import { CoupleSession, Message, UserProfile, Memory, DiaryEntry } from '../types';
import { storageService } from './storage';
import { soundService } from './sound';
import { notificationService } from './notificationService';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  pairCode: string;
}

class CoupleService {
  private channel: BroadcastChannel | null = null;
  private isProcessingQueue = false;
  private listeners: Array<(session: CoupleSession) => void> = [];
  private eventSource: EventSource | null = null;
  private currentAuthToken: string | null = null;
  private currentAuthUser: AuthUser | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('onlyus-couple-channel');
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_SESSION' && event.data.session) {
          this.notifySession(event.data.session);
        }
      };
    }

    if (typeof window !== 'undefined') {
      this.currentAuthToken = localStorage.getItem('karsh_auth_token');
      const savedUser = localStorage.getItem('karsh_auth_user');
      if (savedUser) {
        try {
          this.currentAuthUser = JSON.parse(savedUser);
        } catch {}
      }
    }

    // Auto-retry offline queue when internet reconnects
    storageService.onOnlineChange((online) => {
      if (online) {
        this.flushOfflineQueue();
      }
    });
  }

  get token(): string | null {
    return this.currentAuthToken;
  }

  get authUser(): AuthUser | null {
    return this.currentAuthUser;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.currentAuthToken) {
      headers['Authorization'] = `Bearer ${this.currentAuthToken}`;
    }
    return headers;
  }

  // --- Authentication ---
  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user && data.token) {
        this.currentAuthToken = data.token;
        this.currentAuthUser = data.user;
        localStorage.setItem('karsh_auth_token', data.token);
        localStorage.setItem('karsh_auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error. Please check connection.' };
    }
  }

  async register(
    email: string,
    password: string,
    nickname: string,
    avatar: string,
    pairCode = 'KARSH-FOREVER'
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname, avatar, pairCode }),
      });
      const data = await res.json();
      if (data.success && data.user && data.token) {
        this.currentAuthToken = data.token;
        this.currentAuthUser = data.user;
        localStorage.setItem('karsh_auth_token', data.token);
        localStorage.setItem('karsh_auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch {
      return { success: false, error: 'Network error. Please check connection.' };
    }
  }

  logout() {
    this.currentAuthToken = null;
    this.currentAuthUser = null;
    localStorage.removeItem('karsh_auth_token');
    localStorage.removeItem('karsh_auth_user');
    this.closeEventStream();
  }

  onSessionChange(callback: (session: CoupleSession) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifySession(session: CoupleSession) {
    this.listeners.forEach((cb) => cb(session));
  }

  private broadcastLocal(session: CoupleSession) {
    this.channel?.postMessage({ type: 'SYNC_SESSION', session });
  }

  // Real-Time Server-Sent Events Push Connection
  startEventStream(pairCode: string, currentUserId: string) {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;
    this.closeEventStream();

    try {
      const url = `/api/couple/stream?pairCode=${encodeURIComponent(pairCode)}&userId=${encodeURIComponent(currentUserId)}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_MESSAGE' && payload.message) {
            const msg: Message = payload.message;
            if (msg.senderId !== currentUserId) {
              // Automatically confirm delivery back to sender
              this.acknowledgeDelivery(pairCode, currentUserId, [msg.id]);
              // Trigger background/system notification if supported
              notificationService.notifyNewMessage(msg.senderNickname, msg.text);
            }
            this.syncServer(pairCode, currentUserId).then((synced) => {
              if (synced) {
                this.notifySession(synced);
                this.broadcastLocal(synced);
              }
            });
          } else if (payload.type === 'MESSAGES_DELIVERED' || payload.type === 'MESSAGES_READ') {
            this.syncServer(pairCode, currentUserId).then((synced) => {
              if (synced) {
                this.notifySession(synced);
                this.broadcastLocal(synced);
              }
            });
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        // Auto-reconnects natively via EventSource spec
      };
    } catch (e) {
      console.warn('Failed to start SSE stream:', e);
    }
  }

  closeEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Confirm delivery of incoming messages
  async acknowledgeDelivery(pairCode: string, recipientId: string, messageIds: string[]): Promise<void> {
    if (!storageService.isOnline || messageIds.length === 0) return;
    try {
      await fetch('/api/couple/deliver', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, userId: recipientId, messageIds }),
      });
    } catch {}
  }

  // Initialize or fetch couple
  async initCouple(
    pairCode = 'KARSH-FOREVER',
    userId = 'user-aalu',
    nickname = 'Aalu',
    anniversaryDate = '2024-02-14'
  ): Promise<CoupleSession> {
    try {
      const res = await fetch('/api/couple/init', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, userId, nickname, anniversaryDate }),
      });
      const data = await res.json();
      if (data.success && data.couple) {
        storageService.saveSessionData(data.couple, userId);
        this.broadcastLocal(data.couple);
        return data.couple;
      }
    } catch {
      // Offline fallback
    }

    const saved = storageService.getSavedSession();
    if (saved.session) return saved.session;

    const fallback: CoupleSession = {
      pairCode,
      createdAt: Date.now(),
      anniversaryDate,
      user1: {
        id: userId,
        nickname,
        avatar: 'avatar-aalu',
        statusMessage: 'Forever and always Karsh ❤️',
        mood: 'in-love',
        isOnline: true,
        lastSeen: Date.now(),
        consentShareOnline: true,
      },
      user2: {
        id: 'user-petu',
        nickname: 'Petu',
        avatar: 'avatar-petu',
        statusMessage: 'Thinking of you my Aalu 💕',
        mood: 'happy',
        isOnline: false,
        lastSeen: Date.now() - 3600000,
        consentShareOnline: true,
      },
      messages: [],
      memories: [],
      diaries: [],
      typingUser: null,
      typingTimestamp: 0,
    };
    storageService.saveSessionData(fallback, userId);
    return fallback;
  }

  // Join couple with invite code
  async joinCouple(
    pairCode: string,
    userId = 'user-petu',
    nickname = 'Petu'
  ): Promise<{ success: boolean; couple?: CoupleSession; error?: string }> {
    try {
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, userId, nickname }),
      });
      const data = await res.json();
      if (data.success && data.couple) {
        storageService.saveSessionData(data.couple, userId);
        this.broadcastLocal(data.couple);
        return { success: true, couple: data.couple };
      }
      return { success: false, error: data.error || 'Failed to join invitation' };
    } catch {
      return { success: false, error: 'Network error. Are you connected to the internet?' };
    }
  }

  // Pull latest updates from server
  async syncServer(pairCode: string, currentUserId: string): Promise<CoupleSession | null> {
    if (!storageService.isOnline) return null;

    try {
      const res = await fetch(
        `/api/couple/sync?pairCode=${encodeURIComponent(pairCode)}&userId=${encodeURIComponent(currentUserId)}`,
        { headers: this.getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success && data.couple) {
        // If there are unconfirmed messages from partner, confirm delivery now!
        const unconfirmedIds = data.couple.messages
          .filter((m: Message) => m.senderId !== currentUserId && m.status === 'sent')
          .map((m: Message) => m.id);

        if (unconfirmedIds.length > 0) {
          this.acknowledgeDelivery(pairCode, currentUserId, unconfirmedIds);
        }

        storageService.saveSessionData(data.couple, currentUserId);
        storageService.saveCachedMessages(data.couple.messages);
        return data.couple;
      }
    } catch {}
    return null;
  }

  // Send message with offline queue & deduplication
  async sendMessage(
    pairCode: string,
    message: Message,
    currentSession: CoupleSession,
    soundSettings?: { soundEnabled: boolean; quietHoursEnabled: boolean; start: string; end: string }
  ): Promise<{ session: CoupleSession; message: Message }> {
    // 1. Local sound feedback
    if (soundSettings) {
      soundService.playSent(soundSettings.soundEnabled, soundSettings.quietHoursEnabled, soundSettings.start, soundSettings.end);
    }

    // 2. If completely offline: save directly to IndexedDB offline queue with status 'offline'
    if (!storageService.isOnline) {
      const offlineMsg: Message = {
        ...message,
        status: 'offline',
      };

      await storageService.enqueueOfflineMessage(offlineMsg);

      const updatedMessages = [...currentSession.messages, offlineMsg];
      const updatedSession: CoupleSession = {
        ...currentSession,
        messages: updatedMessages,
      };

      storageService.saveSessionData(updatedSession, message.senderId);
      this.broadcastLocal(updatedSession);
      this.notifySession(updatedSession);

      return { session: updatedSession, message: offlineMsg };
    }

    // 3. If online, set status to 'sending' and enqueue
    const pendingMsg: Message = {
      ...message,
      status: 'sending',
    };
    await storageService.enqueueOfflineMessage(pendingMsg);

    // Optimistically update session
    const optimisticMessages = [...currentSession.messages, pendingMsg];
    const optimisticSession: CoupleSession = {
      ...currentSession,
      messages: optimisticMessages,
    };
    this.notifySession(optimisticSession);

    try {
      const res = await fetch('/api/couple/message', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, message: pendingMsg }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        await storageService.removeFromOfflineQueue(message.clientMessageId);

        const confirmedMsg = data.message;
        const finalMessages = optimisticMessages.map((m) =>
          m.clientMessageId === message.clientMessageId ? confirmedMsg : m
        );

        const finalSession: CoupleSession = {
          ...currentSession,
          messages: finalMessages,
        };

        storageService.saveSessionData(finalSession, message.senderId);
        storageService.saveCachedMessages(finalMessages);
        this.broadcastLocal(finalSession);
        this.notifySession(finalSession);

        return { session: finalSession, message: confirmedMsg };
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch {
      // Mark as failed and retain in queue for retry
      const failedMsg: Message = {
        ...message,
        status: 'failed',
        errorMessage: 'Connection lost. Tap to retry.',
      };
      await storageService.enqueueOfflineMessage(failedMsg);

      const finalMessages = optimisticMessages.map((m) =>
        m.clientMessageId === message.clientMessageId ? failedMsg : m
      );

      const finalSession: CoupleSession = {
        ...currentSession,
        messages: finalMessages,
      };

      storageService.saveSessionData(finalSession, message.senderId);
      this.notifySession(finalSession);

      return { session: finalSession, message: failedMsg };
    }
  }

  // Flush offline queue preserving strict chronological ordering
  async flushOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || !storageService.isOnline) return;
    this.isProcessingQueue = true;

    try {
      const queue = await storageService.getOfflineQueue();
      if (queue.length === 0) return;

      // Sort by creation time to ensure message order is strictly preserved
      queue.sort((a, b) => a.createdAt - b.createdAt);

      const saved = storageService.getSavedSession();
      if (!saved.session) return;

      const pairCode = saved.session.pairCode;

      for (const msg of queue) {
        try {
          const res = await fetch('/api/couple/message', {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ pairCode, message: { ...msg, status: 'sending' } }),
          });
          const data = await res.json();
          if (data.success && data.message) {
            await storageService.removeFromOfflineQueue(msg.clientMessageId);
          }
        } catch {
          // If network cuts out again, stop and retry on next reconnect
          break;
        }
      }

      if (saved.currentUserId) {
        const synced = await this.syncServer(pairCode, saved.currentUserId);
        if (synced) {
          this.notifySession(synced);
          this.broadcastLocal(synced);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Mark all unread messages as read
  async markRead(pairCode: string, currentUserId: string): Promise<void> {
    if (!storageService.isOnline) return;
    try {
      await fetch('/api/couple/read', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, userId: currentUserId }),
      });
    } catch {}
  }

  // Add/remove reaction
  async toggleReaction(pairCode: string, messageId: string, emoji: string, userId: string): Promise<void> {
    soundService.playSparkle();
    if (!storageService.isOnline) return;
    try {
      await fetch('/api/couple/reaction', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, messageId, emoji, userId }),
      });
    } catch {}
  }

  // Delete message
  async deleteMessage(pairCode: string, messageId: string, userId: string, deleteForBoth: boolean): Promise<void> {
    try {
      await fetch('/api/couple/delete', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, messageId, userId, deleteForBoth }),
      });
    } catch {}
  }

  // Broadcast typing status
  async sendTyping(pairCode: string, nickname: string, isTyping: boolean): Promise<void> {
    if (!storageService.isOnline) return;
    try {
      await fetch('/api/couple/typing', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, nickname, isTyping }),
      });
    } catch {}
  }

  // Add memory or diary entry
  async addMemoryOrDiary(pairCode: string, type: 'memory' | 'diary', item: Memory | DiaryEntry): Promise<void> {
    try {
      await fetch('/api/couple/memory', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          pairCode,
          type,
          memory: type === 'memory' ? item : undefined,
          entry: type === 'diary' ? item : undefined,
        }),
      });
    } catch {}
  }

  // Update profile / anniversary date
  async updateProfile(
    pairCode: string,
    userId: string,
    updates: Partial<UserProfile>,
    anniversaryDate?: string
  ): Promise<CoupleSession | null> {
    try {
      const res = await fetch('/api/couple/update-profile', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ pairCode, userId, updates, anniversaryDate }),
      });
      const data = await res.json();
      if (data.success && data.couple) {
        storageService.saveSessionData(data.couple, userId);
        this.broadcastLocal(data.couple);
        this.notifySession(data.couple);
        return data.couple;
      }
    } catch {}
    return null;
  }
}

export const coupleService = new CoupleService();
