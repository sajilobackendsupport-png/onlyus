import React, { useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Play,
  Pause,
  Reply,
  Trash2,
  Heart,
  Smile,
  Flame,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Message, UserProfile } from '../types';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  partner: UserProfile | null;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string, deleteForBoth: boolean) => void;
  onRetry: (message: Message) => void;
  onOpenImage: (url: string) => void;
}

const REACTION_EMOJIS = ['❤️', '🔥', '💋', '🥺', '🥰', '✨'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  partner,
  onReply,
  onReact,
  onDelete,
  onRetry,
  onOpenImage,
}) => {
  const isMe = message.senderId === currentUserId;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOfflineExplanation, setShowOfflineExplanation] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleAudio = () => {
    if (!message.mediaUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(message.mediaUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const renderStatusIcon = () => {
    if (!isMe) return null;

    switch (message.status) {
      case 'offline':
        return (
          <button
            onClick={() => setShowOfflineExplanation(!showOfflineExplanation)}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
            title="Saved offline"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="text-[10px] text-amber-400/90 font-medium">Offline</span>
          </button>
        );
      case 'pending':
        return (
          <span title="Pending">
            <Clock className="w-3.5 h-3.5 text-rose-300/60 animate-pulse" />
          </span>
        );
      case 'sending':
        return (
          <div className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" title="Sending..." />
        );
      case 'sent':
        return (
          <span title="Sent to server">
            <Check className="w-3.5 h-3.5 text-rose-200/60" />
          </span>
        );
      case 'delivered':
        return (
          <span title="Delivered to partner">
            <CheckCheck className="w-3.5 h-3.5 text-rose-200/70" />
          </span>
        );
      case 'read':
        return (
          <div className="flex items-center text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" title="Read by your love">
            <CheckCheck className="w-3.5 h-3.5 text-pink-400" />
          </div>
        );
      case 'failed':
        return (
          <button
            onClick={() => onRetry(message)}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 underline text-[10px]"
            title="Failed - tap to retry"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Retry
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`group relative flex flex-col mb-3.5 px-3 transition-all ${
        isMe ? 'items-end' : 'items-start'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowDeleteConfirm(false);
      }}
    >
      {/* Offline Explanation Callout when user taps offline status badge */}
      {showOfflineExplanation && isMe && (
        <div className="max-w-xs p-2.5 mb-2 bg-[#2a1338] border border-amber-500/40 rounded-xl text-amber-100 text-[11px] leading-relaxed shadow-xl animate-fade-in">
          <div className="flex items-start gap-1.5 font-semibold text-amber-300 mb-1">
            <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
            Offline Message Queued
          </div>
          This message is securely saved on your device in offline storage. A message written offline cannot reach your sweetheart until a network connection becomes available. It will automatically deliver as soon as you reconnect.
          <button
            onClick={() => setShowOfflineExplanation(false)}
            className="block text-right mt-1.5 font-bold text-amber-400 hover:underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* Floating Action Bar (Reactions / Reply / Delete) */}
      <div
        className={`absolute -top-7 z-20 flex items-center gap-1 p-1 rounded-full bg-[#1e1233]/90 backdrop-blur-md border border-rose-500/30 shadow-xl transition-all duration-200 ${
          showActions ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        } ${isMe ? 'right-4' : 'left-4'}`}
      >
        <div className="flex items-center gap-0.5 px-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(message.id, emoji)}
              className="w-6 h-6 flex items-center justify-center hover:scale-125 transition-transform text-sm"
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        <button
          onClick={() => onReply(message)}
          className="p-1 rounded-full hover:bg-white/10 text-rose-300 transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {isMe && !message.isDeleted && (
          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="p-1 rounded-full hover:bg-red-500/20 text-rose-300/80 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Delete Confirmation Popover */}
      {showDeleteConfirm && (
        <div className="absolute top-1 right-2 z-30 p-2.5 bg-[#251336] border border-rose-500/40 rounded-2xl shadow-2xl text-xs space-y-1.5 w-44">
          <p className="text-[11px] text-rose-200 font-medium">Delete this message?</p>
          <button
            onClick={() => {
              onDelete(message.id, false);
              setShowDeleteConfirm(false);
            }}
            className="w-full text-left py-1 px-2 rounded-lg hover:bg-white/10 text-rose-300 text-[11px]"
          >
            Delete for me
          </button>
          <button
            onClick={() => {
              onDelete(message.id, true);
              setShowDeleteConfirm(false);
            }}
            className="w-full text-left py-1 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium text-[11px]"
          >
            Delete for both
          </button>
        </div>
      )}

      {/* The Actual Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-3xl p-3 shadow-md transition-all ${
          isMe
            ? 'bg-gradient-to-br from-rose-600/90 via-pink-600/80 to-purple-700/90 text-white rounded-br-sm border border-rose-400/30'
            : 'bg-[#1e1333]/90 text-rose-100 rounded-bl-sm border border-purple-500/20 backdrop-blur-sm'
        }`}
      >
        {/* Reply Quote Banner if this message is replying to another */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-xl text-xs border-l-2 bg-black/25 ${
              isMe ? 'border-rose-300 text-rose-100' : 'border-purple-400 text-purple-200'
            }`}
          >
            <div className="font-semibold text-[10px] opacity-80 flex items-center gap-1">
              <Reply className="w-3 h-3 rotate-180" />
              {message.replyTo.senderNickname}
            </div>
            <p className="truncate text-[11px] opacity-90 mt-0.5">{message.replyTo.text}</p>
          </div>
        )}

        {/* Deleted Message State */}
        {message.isDeleted ? (
          <div className="flex items-center gap-1.5 py-1 text-xs italic text-rose-200/50">
            <Trash2 className="w-3.5 h-3.5 opacity-60" />
            <span>This message was deleted</span>
          </div>
        ) : (
          <>
            {/* 1. Image Media */}
            {message.type === 'image' && message.mediaUrl && (
              <div className="mb-2 overflow-hidden rounded-2xl max-w-sm cursor-pointer group/img">
                <img
                  src={message.mediaUrl}
                  alt="Shared romantic memory"
                  onClick={() => onOpenImage(message.mediaUrl!)}
                  className="w-full max-h-72 object-cover rounded-2xl hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            )}

            {/* 2. Voice Audio Message */}
            {message.type === 'voice' && message.mediaUrl && (
              <div className="flex items-center gap-3 py-1 min-w-[200px]">
                <button
                  onClick={toggleAudio}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                    isMe
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                  }`}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        isMe ? 'bg-white' : 'bg-rose-400'
                      }`}
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] opacity-75 mt-1 font-mono">
                    <span>Voice Note</span>
                    <span>
                      {message.mediaDuration
                        ? `${Math.floor(message.mediaDuration / 60)}:${
                            message.mediaDuration % 60 < 10 ? '0' : ''
                          }${message.mediaDuration % 60}`
                        : '0:05'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Romantic Love Note Card */}
            {message.type === 'love_note' && (
              <div className="p-3 mb-1 bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-400/40 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                  Love Note for You
                </div>
                <p className="text-sm italic font-serif leading-relaxed text-rose-100">
                  "{message.text}"
                </p>
              </div>
            )}

            {/* 4. Standard Text */}
            {message.type === 'text' && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )}
          </>
        )}

        {/* Bubble Footer: Timestamp & Delivery Status */}
        <div
          className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] ${
            isMe ? 'text-rose-100/70' : 'text-rose-300/60'
          }`}
        >
          {message.scheduledFor && (
            <span className="flex items-center gap-0.5 text-rose-300">
              <Clock className="w-3 h-3" />
              Scheduled
            </span>
          )}
          <span>{formatTimestamp(message.createdAt)}</span>
          {renderStatusIcon()}
        </div>
      </div>

      {/* Floating Reactions Pill Bar */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div
          className={`flex flex-wrap gap-1 mt-1 z-10 ${
            isMe ? 'justify-end' : 'justify-start'
          }`}
        >
          {Object.entries(message.reactions).map(([emoji, users]) => {
            if (!users || users.length === 0) return null;
            const hasReacted = users.includes(currentUserId);
            return (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                  hasReacted
                    ? 'bg-rose-500/30 border-rose-500/60 text-white shadow-sm shadow-rose-500/20 scale-105'
                    : 'bg-[#1f1335]/90 border-purple-500/20 text-rose-200/90 hover:bg-white/10'
                }`}
              >
                <span>{emoji}</span>
                {users.length > 1 && <span className="text-[10px] font-bold">{users.length}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
