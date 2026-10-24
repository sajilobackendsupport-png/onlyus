import React, { useState, useRef, useEffect } from 'react';
import { Message, UserProfile, ReplyPreview } from '../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Search, X, Heart, Sparkles } from 'lucide-react';

interface ChatViewProps {
  messages: Message[];
  currentUser: UserProfile;
  partner: UserProfile | null;
  pairCode: string;
  typingUser: string | null;
  isOffline: boolean;
  showSearch: boolean;
  onCloseSearch: () => void;
  onSendMessage: (
    text: string,
    type: 'text' | 'image' | 'voice' | 'love_note',
    mediaUrl?: string,
    mediaDuration?: number,
    scheduledFor?: number | null
  ) => void;
  onSendTyping: (isTyping: boolean) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string, deleteForBoth: boolean) => void;
  onRetryMessage: (message: Message) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentUser,
  partner,
  pairCode,
  typingUser,
  isOffline,
  showSearch,
  onCloseSearch,
  onSendMessage,
  onSendTyping,
  onReact,
  onDeleteMessage,
  onRetryMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const handleReply = (message: Message) => {
    setReplyingTo({
      id: message.id,
      text: message.text || (message.type === 'voice' ? 'Voice note' : 'Photo'),
      senderNickname: message.senderNickname,
      type: message.type,
    });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [dateStr: string]: Message[] } = {};
    msgs.forEach((m) => {
      const d = new Date(m.createdAt);
      const today = new Date();
      let key = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });

      if (d.toDateString() === today.toDateString()) {
        key = 'Today';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  };

  const grouped = groupMessagesByDate(filteredMessages);

  return (
    <div className="flex flex-col h-full bg-[#0b0612] relative overflow-hidden">
      {/* Search Header Bar if active */}
      {showSearch && (
        <div className="flex items-center gap-2 p-2.5 bg-[#170e28] border-b border-rose-500/20 animate-fade-in">
          <Search className="w-4 h-4 text-rose-400 shrink-0 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation..."
            autoFocus
            className="flex-1 bg-transparent text-xs text-white placeholder-rose-300/40 focus:outline-none"
          />
          {searchQuery && (
            <span className="text-[10px] text-rose-300/60 font-mono">
              {filteredMessages.length} found
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              onCloseSearch();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-rose-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-3 py-3 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-purple-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl shadow-rose-950/40">
              <Heart className="w-8 h-8 fill-rose-500/30 text-rose-400 animate-pulse" />
            </div>
            <h3 className="font-serif text-lg text-white font-semibold mb-1">
              {searchQuery ? 'No matching messages' : 'Our Secret Sanctuary'}
            </h3>
            <p className="text-xs text-rose-300/70 max-w-xs leading-relaxed">
              {searchQuery
                ? 'Try searching for different romantic words or phrases.'
                : 'This private space is reserved only for you two. Send your first sweet message, voice note, or shared memory below.'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dateMsgs]) => (
            <div key={dateLabel} className="space-y-2">
              {/* Date divider pill */}
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 rounded-full bg-[#1b102e]/80 border border-purple-800/30 text-[10px] font-medium text-rose-300/80 shadow-sm backdrop-blur-sm">
                  {dateLabel}
                </span>
              </div>

              {/* Messages under this date */}
              {dateMsgs.map((msg) => (
                <MessageBubble
                  key={msg.id || msg.clientMessageId}
                  message={msg}
                  currentUserId={currentUser.id}
                  partner={partner}
                  onReply={handleReply}
                  onReact={onReact}
                  onDelete={onDeleteMessage}
                  onRetry={onRetryMessage}
                  onOpenImage={(url) => setActivePhotoUrl(url)}
                />
              ))}
            </div>
          ))
        )}

        {/* Partner Typing Indicator Banner */}
        {typingUser && typingUser !== currentUser.nickname && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-rose-300/90 italic animate-fade-in">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>{typingUser} is typing something sweet... ❤️</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        pairCode={pairCode}
        onSendMessage={onSendMessage}
        onSendTyping={onSendTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        isOffline={isOffline}
      />

      {/* Lightbox for shared photo preview */}
      {activePhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={activePhotoUrl}
              alt="Shared romantic memory"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
            <button
              onClick={() => setActivePhotoUrl(null)}
              className="absolute -top-3 -right-3 p-2 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
