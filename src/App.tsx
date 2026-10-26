import React, { useState, useEffect, useRef } from 'react';
import {
  CoupleSession,
  UserProfile,
  Message,
  Memory,
  DiaryEntry,
  AppSettings,
  UserMood,
} from './types';
import { coupleService, deduplicateMessages } from './services/coupleService';
import { storageService } from './services/storage';
import { soundService } from './services/sound';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { ChatView } from './components/ChatView';
import { RelationshipHome } from './components/RelationshipHome';
import { MemoriesView } from './components/MemoriesView';
import { SettingsView } from './components/SettingsView';
import { StealthCalculator } from './components/StealthCalculator';
import { LockScreen } from './components/LockScreen';
import { PairingModal } from './components/PairingModal';
import { SplashIntro } from './components/SplashIntro';
import { CallModal } from './components/CallModal';

export default function App() {
  const [session, setSession] = useState<CoupleSession | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('user-1');
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isOffline, setIsOffline] = useState<boolean>(!storageService.isOnline);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState<boolean>(false);

  const [showSplashIntro, setShowSplashIntro] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState<number>(0);

  const [settings, setSettings] = useState<AppSettings>(() => storageService.getAppSettings());
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    type: 'audio' | 'video';
    isIncoming: boolean;
  }>({
    isOpen: false,
    type: 'audio',
    isIncoming: false,
  });

  const previousMessageCountRef = useRef<number>(0);

  // Network listener & offline queue tracking
  useEffect(() => {
    const unsubOnline = storageService.onOnlineChange((online) => {
      setIsOffline(!online);
      if (online) {
        coupleService.flushOfflineQueue();
      }
    });

    const updateQueueCount = async () => {
      const q = await storageService.getOfflineQueue();
      setQueuedCount(q.length);
    };
    updateQueueCount();
    const qInterval = setInterval(updateQueueCount, 2500);

    return () => {
      unsubOnline();
      clearInterval(qInterval);
    };
  }, []);

  // Initialize Session with Karsh, Aalu & Petu defaults
  useEffect(() => {
    const init = async () => {
      const saved = storageService.getSavedSession();
      if (saved.session && saved.currentUserId) {
        setSession(saved.session);
        setCurrentUserId(saved.currentUserId);
        previousMessageCountRef.current = saved.session.messages.length;
      } else {
        const defaultCouple = await coupleService.initCouple('KARSH-FOREVER', 'user-1', 'Aalu', '2024-02-14');
        setSession(defaultCouple);
        setCurrentUserId(defaultCouple.user1.id);
        previousMessageCountRef.current = defaultCouple.messages.length;
      }
    };
    init();

    // Listen to local / broadcast session updates
    const unsubSession = coupleService.onSessionChange((updated) => {
      const cleanSession: CoupleSession = {
        ...updated,
        messages: deduplicateMessages(updated.messages),
      };
      setSession(cleanSession);

      // Play chime if new incoming message received from partner
      if (cleanSession.messages.length > previousMessageCountRef.current) {
        const latest = cleanSession.messages[cleanSession.messages.length - 1];
        if (latest.senderId !== currentUserId) {
          soundService.playReceived(
            settings.soundEnabled,
            settings.quietHoursEnabled,
            settings.quietHoursStart,
            settings.quietHoursEnd
          );
        }
      }
      previousMessageCountRef.current = cleanSession.messages.length;
    });

    return () => unsubSession();
  }, [currentUserId, settings]);

  // Periodic polling sync with server for remote multi-device updates
  useEffect(() => {
    if (!session) return;

    const syncTick = async () => {
      if (storageService.isOnline) {
        const synced = await coupleService.syncServer(session.pairCode, currentUserId);
        if (synced) {
          const cleanSynced: CoupleSession = {
            ...synced,
            messages: deduplicateMessages(synced.messages),
          };
          setSession(cleanSynced);
          if (cleanSynced.messages.length > previousMessageCountRef.current) {
            const latest = cleanSynced.messages[cleanSynced.messages.length - 1];
            if (latest.senderId !== currentUserId) {
              soundService.playReceived(
                settings.soundEnabled,
                settings.quietHoursEnabled,
                settings.quietHoursStart,
                settings.quietHoursEnd
              );
            }
          }
          previousMessageCountRef.current = cleanSynced.messages.length;
        }
      }
    };

    const interval = setInterval(syncTick, 2500);
    return () => clearInterval(interval);
  }, [session?.pairCode, currentUserId, settings]);

  // Connect real-time Server-Sent Events (SSE) push stream
  useEffect(() => {
    if (session?.pairCode && storageService.isOnline) {
      coupleService.startEventStream(session.pairCode, currentUserId);
    }
    return () => {
      coupleService.closeEventStream();
    };
  }, [session?.pairCode, currentUserId]);

  // Mark read when user is actively viewing the chat tab
  useEffect(() => {
    if (activeTab === 'chat' && session) {
      coupleService.markRead(session.pairCode, currentUserId);
    }
  }, [activeTab, session?.messages.length, currentUserId]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#07030d] text-rose-300">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            ❤️
          </div>
          <span className="font-serif text-lg text-white font-bold tracking-tight">karsh</span>
          <span className="font-serif italic text-xs tracking-widest text-rose-300/70 lowercase">only us</span>
        </div>
      </div>
    );
  }

  // Identify current user and partner
  const isUser1 = currentUserId === session.user1?.id;
  const currentUser: UserProfile = isUser1
    ? session.user1
    : session.user2 || {
        id: 'user-2',
        nickname: 'Petu',
        avatar: 'avatar-petu',
        statusMessage: 'Thinking of you my Aalu 💕',
        mood: 'happy',
        isOnline: true,
        lastSeen: Date.now(),
        consentShareOnline: true,
      };

  const partner: UserProfile | null = isUser1
    ? session.user2 || {
        id: 'user-2',
        nickname: 'Petu',
        avatar: 'avatar-petu',
        statusMessage: 'Thinking of you my Aalu 💕',
        mood: 'happy',
        isOnline: false,
        lastSeen: Date.now() - 3600000,
        consentShareOnline: true,
      }
    : session.user1;

  // Persona selection handler from the lovely opening animation
  const handleSelectPersona = (persona: 'Aalu' | 'Petu') => {
    const isAalu = persona === 'Aalu';
    const targetUserId = isAalu ? 'user-1' : 'user-2';

    const updatedSession: CoupleSession = {
      ...session,
      user1: {
        ...session.user1,
        id: 'user-1',
        nickname: 'Aalu',
        avatar: 'avatar-aalu',
      },
      user2: session.user2
        ? {
            ...session.user2,
            id: 'user-2',
            nickname: 'Petu',
            avatar: 'avatar-petu',
          }
        : {
            id: 'user-2',
            nickname: 'Petu',
            avatar: 'avatar-petu',
            statusMessage: 'Thinking of you my Aalu 💕',
            mood: 'happy',
            isOnline: true,
            lastSeen: Date.now(),
            consentShareOnline: true,
          },
    };

    setCurrentUserId(targetUserId);
    setSession(updatedSession);
    storageService.saveSessionData(updatedSession, targetUserId);
    coupleService.updateProfile(session.pairCode, targetUserId, {
      nickname: persona,
      avatar: isAalu ? 'avatar-aalu' : 'avatar-petu',
    });
    setShowSplashIntro(false);
  };

  // Toggle between User 1 (Aalu) and User 2 (Petu)
  const handleSwitchUser = () => {
    const nextId = isUser1 ? (session.user2?.id || 'user-2') : session.user1.id;
    setCurrentUserId(nextId);
    storageService.saveSessionData(session, nextId);
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    type: 'text' | 'image' | 'voice' | 'love_note',
    mediaUrl?: string,
    mediaDuration?: number,
    scheduledFor?: number | null
  ) => {
    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newMsg: Message = {
      id: clientMessageId,
      clientMessageId,
      senderId: currentUser.id,
      senderNickname: currentUser.nickname,
      text,
      type,
      mediaUrl,
      mediaDuration,
      reactions: {},
      status: isOffline ? 'offline' : 'sending',
      createdAt: Date.now(),
      scheduledFor,
    };

    const res = await coupleService.sendMessage(
      session.pairCode,
      newMsg,
      session,
      {
        soundEnabled: settings.soundEnabled,
        quietHoursEnabled: settings.quietHoursEnabled,
        start: settings.quietHoursStart,
        end: settings.quietHoursEnd,
      }
    );
    setSession(res.session);

    // Refresh queued count
    const q = await storageService.getOfflineQueue();
    setQueuedCount(q.length);
  };

  // Typing indicator
  const handleSendTyping = (isTyping: boolean) => {
    coupleService.sendTyping(session.pairCode, currentUser.nickname, isTyping);
  };

  // Reactions
  const handleReact = (messageId: string, emoji: string) => {
    coupleService.toggleReaction(session.pairCode, messageId, emoji, currentUser.id);
    // Optimistic reaction update
    setSession((prev) => {
      if (!prev) return prev;
      const msgs = prev.messages.map((m) => {
        if (m.id === messageId) {
          const rx = { ...(m.reactions || {}) };
          if (!rx[emoji]) rx[emoji] = [];
          const idx = rx[emoji].indexOf(currentUser.id);
          if (idx >= 0) rx[emoji].splice(idx, 1);
          else rx[emoji].push(currentUser.id);
          return { ...m, reactions: rx };
        }
        return m;
      });
      return { ...prev, messages: msgs };
    });
  };

  // Delete message
  const handleDeleteMessage = (messageId: string, deleteForBoth: boolean) => {
    coupleService.deleteMessage(session.pairCode, messageId, currentUser.id, deleteForBoth);
    setSession((prev) => {
      if (!prev) return prev;
      const msgs = prev.messages.map((m) => {
        if (m.id === messageId) {
          if (deleteForBoth) {
            return { ...m, isDeleted: true, text: 'This message was deleted', mediaUrl: undefined };
          } else {
            return { ...m, deletedFor: [...(m.deletedFor || []), currentUser.id] };
          }
        }
        return m;
      });
      return { ...prev, messages: msgs };
    });
  };

  // Retry failed message
  const handleRetryMessage = async (msg: Message) => {
    const res = await coupleService.sendMessage(session.pairCode, msg, session);
    setSession(res.session);
  };

  // Send love ping (Heart, kiss, hug)
  const handleSendLovePing = (type: string, emoji: string) => {
    handleSendMessage(
      emoji === '❤️'
        ? `Sent an unconditional heart ❤️ from ${currentUser.nickname}!`
        : emoji === '💋'
        ? `Sent a sweet virtual kiss 💋 to my love!`
        : emoji === '🤗'
        ? `Sent a tight warm hug 🤗 from ${currentUser.nickname}!`
        : `Missing you so much right now 🥺`,
      'love_note'
    );
  };

  // Update mood
  const handleUpdateMood = (mood: UserMood) => {
    coupleService.updateProfile(session.pairCode, currentUser.id, { mood });
    setSession((prev) => {
      if (!prev) return prev;
      if (isUser1) {
        return { ...prev, user1: { ...prev.user1, mood } };
      } else if (prev.user2) {
        return { ...prev, user2: { ...prev.user2, mood } };
      }
      return prev;
    });
  };

  // Add Memory / Diary
  const handleAddMemory = (memory: Memory) => {
    coupleService.addMemoryOrDiary(session.pairCode, 'memory', memory);
    setSession((prev) => (prev ? { ...prev, memories: [memory, ...prev.memories] } : prev));
  };

  const handleAddDiary = (entry: DiaryEntry) => {
    coupleService.addMemoryOrDiary(session.pairCode, 'diary', entry);
    setSession((prev) => (prev ? { ...prev, diaries: [entry, ...prev.diaries] } : prev));
  };

  // Update Profile & Settings
  const handleUpdateProfile = (updates: Partial<UserProfile>, anniversaryDate?: string) => {
    coupleService.updateProfile(session.pairCode, currentUser.id, updates, anniversaryDate);
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (anniversaryDate) updated.anniversaryDate = anniversaryDate;
      if (isUser1) updated.user1 = { ...updated.user1, ...updates };
      else if (updated.user2) updated.user2 = { ...updated.user2, ...updates };
      return updated;
    });
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveAppSettings(newSettings);
  };

  // Stealth Calculator Disguise
  if (settings.isStealthMode) {
    return (
      <StealthCalculator
        passcode={settings.passcode}
        onUnlock={() => {
          handleUpdateSettings({ ...settings, isStealthMode: false });
        }}
      />
    );
  }

  // Passcode Lock Screen
  if (settings.isLocked) {
    return (
      <LockScreen
        passcode={settings.passcode}
        onUnlock={() => {
          handleUpdateSettings({ ...settings, isLocked: false });
        }}
      />
    );
  }

  // Calculate unread message count
  const unreadCount = session.messages.filter(
    (m) => m.senderId !== currentUser.id && m.status !== 'read'
  ).length;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#07030d] text-rose-50 overflow-hidden font-sans select-none">
      {/* Top Header featuring Karsh with only us below it */}
      <Header
        currentUser={currentUser}
        partner={partner}
        isOffline={isOffline}
        onToggleSearch={() => setShowSearch(!showSearch)}
        showSearch={showSearch}
        onLockApp={() => handleUpdateSettings({ ...settings, isLocked: true })}
        onToggleStealth={() => handleUpdateSettings({ ...settings, isStealthMode: true })}
        onSwitchUser={handleSwitchUser}
        onOpenIntro={() => setShowSplashIntro(true)}
        onStartCall={(type) => setActiveCall({ isOpen: true, type, isIncoming: false })}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'chat' && (
          <ChatView
            messages={session.messages.filter((m) => !m.deletedFor?.includes(currentUser.id))}
            currentUser={currentUser}
            partner={partner}
            pairCode={session.pairCode}
            typingUser={session.typingUser}
            isOffline={isOffline}
            showSearch={showSearch}
            onCloseSearch={() => setShowSearch(false)}
            onSendMessage={handleSendMessage}
            onSendTyping={handleSendTyping}
            onReact={handleReact}
            onDeleteMessage={handleDeleteMessage}
            onRetryMessage={handleRetryMessage}
          />
        )}

        {activeTab === 'hub' && (
          <RelationshipHome
            session={session}
            currentUser={currentUser}
            partner={partner}
            onSendLovePing={handleSendLovePing}
            onUpdateMood={handleUpdateMood}
            onNavigateToChat={() => setActiveTab('chat')}
            onNavigateToMemories={() => setActiveTab('memories')}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesView
            memories={session.memories || []}
            diaries={session.diaries || []}
            currentUser={currentUser}
            onAddMemory={handleAddMemory}
            onAddDiary={handleAddDiary}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            session={session}
            currentUser={currentUser}
            settings={settings}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSettings={handleUpdateSettings}
            onFlushQueue={() => coupleService.flushOfflineQueue()}
            queuedMessagesCount={queuedCount}
          />
        )}
      </main>

      {/* Navigation (Bottom Bar on Mobile, top/bar on Desktop) */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        unreadCount={unreadCount}
      />

      {/* Opening Animation of Karsh + only us + Aalu/Petu Selector */}
      <SplashIntro
        isOpen={showSplashIntro}
        onSelectPersona={handleSelectPersona}
      />

      {/* Pairing Invitation Modal */}
      <PairingModal
        isOpen={isPairingModalOpen}
        onInitSpace={(pairCode, nickname, anniv) => {
          coupleService.initCouple(pairCode, 'user-1', nickname, anniv).then((s) => {
            setSession(s);
            setCurrentUserId('user-1');
          });
        }}
        onJoinSpace={async (pairCode, nickname) => {
          const res = await coupleService.joinCouple(pairCode, 'user-2', nickname);
          if (res.success && res.couple) {
            setSession(res.couple);
            setCurrentUserId('user-2');
            return { success: true };
          }
          return { success: false, error: res.error };
        }}
        onClose={() => setIsPairingModalOpen(false)}
      />

      {/* Voice & Video Call Modal */}
      <CallModal
        isOpen={activeCall.isOpen}
        callType={activeCall.type}
        isIncoming={activeCall.isIncoming}
        partner={partner}
        currentUser={currentUser}
        pairCode={session.pairCode}
        onEndCall={() => setActiveCall({ ...activeCall, isOpen: false })}
      />

    </div>
  );
}
