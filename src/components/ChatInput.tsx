import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Image,
  Mic,
  Clock,
  Heart,
  X,
  WifiOff,
} from 'lucide-react';
import { Message, ReplyPreview } from '../types';
import { VoiceRecorder } from './VoiceRecorder';
import { ScheduledMessageModal } from './ScheduledMessageModal';
import { storageService } from '../services/storage';

interface ChatInputProps {
  pairCode: string;
  onSendMessage: (
    text: string,
    type: 'text' | 'image' | 'voice' | 'love_note',
    mediaUrl?: string,
    mediaDuration?: number,
    scheduledFor?: number | null
  ) => void;
  onSendTyping: (isTyping: boolean) => void;
  replyingTo: ReplyPreview | null;
  onCancelReply: () => void;
  isOffline: boolean;
}

const EMOJI_LIST = [
  '❤️', '💖', '💕', '💘', '😘', '🥰', '😍', '💋', 
  '🌹', '✨', '🥺', '💍', '🧸', '🤗', '🔥', '💫', 
  '🥂', '💌', '🌸', '🍓', '🧁', '🌙', '⭐', '🕊️'
];

export const ChatInput: React.FC<ChatInputProps> = ({
  pairCode,
  onSendMessage,
  onSendTyping,
  replyingTo,
  onCancelReply,
  isOffline,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isLoveNoteMode, setIsLoveNoteMode] = useState(false);
  const [scheduledTimestamp, setScheduledTimestamp] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = storageService.getDraft(pairCode);
    if (savedDraft) {
      setText(savedDraft);
    }
  }, [pairCode]);

  // Persist draft on text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    storageService.saveDraft(pairCode, val);

    // Typing indicator throttle
    onSendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 2500);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const messageType = isLoveNoteMode ? 'love_note' : 'text';
    onSendMessage(trimmed, messageType, undefined, undefined, scheduledTimestamp);

    setText('');
    setIsLoveNoteMode(false);
    setScheduledTimestamp(null);
    storageService.saveDraft(pairCode, '');
    onSendTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    storageService.saveDraft(pairCode, text + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Client-side image resize & compression to ensure fast offline storage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        onSendMessage('', 'image', compressedDataUrl, undefined, scheduledTimestamp);
        setScheduledTimestamp(null);
      };
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVoiceSend = (mediaUrl: string, durationSeconds: number) => {
    setIsRecordingVoice(false);
    onSendMessage('', 'voice', mediaUrl, durationSeconds, scheduledTimestamp);
    setScheduledTimestamp(null);
  };

  if (isRecordingVoice) {
    return (
      <div className="p-3 bg-[#130b21] border-t border-rose-500/15">
        <VoiceRecorder
          onSendVoice={handleVoiceSend}
          onCancel={() => setIsRecordingVoice(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative p-2.5 sm:p-3 bg-[#11091e]/95 backdrop-blur-xl border-t border-purple-900/40">
      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Offline Mode:</strong> Message will queue in device storage and send immediately when internet reconnects.
          </span>
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-purple-950/50 border-l-4 border-rose-500 rounded-r-xl text-xs">
          <div className="truncate">
            <span className="font-semibold text-rose-300 mr-2">Replying to {replyingTo.senderNickname}:</span>
            <span className="text-rose-100/70 truncate">{replyingTo.text}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-rose-300 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scheduled message badge if active */}
      {scheduledTimestamp && (
        <div className="flex items-center justify-between px-3 py-1 mb-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Scheduled for {new Date(scheduledTimestamp).toLocaleString()}</span>
          </div>
          <button
            onClick={() => setScheduledTimestamp(null)}
            className="text-[11px] text-rose-400 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-30 p-3 bg-[#1b102e] border border-rose-500/30 rounded-3xl shadow-2xl shadow-rose-950/60 max-w-xs animate-fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-semibold text-rose-300">
            <span>Romantic Emojis & Hearts</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded-full hover:bg-white/10 text-rose-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_LIST.map((em) => (
              <button
                key={em}
                onClick={() => addEmoji(em)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-1.5 sm:gap-2">
        {/* Attachment & Action Buttons */}
        <div className="flex items-center gap-1 pb-1">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add romantic emoji"
            className={`p-2 rounded-full transition-colors ${
              showEmojiPicker
                ? 'bg-rose-500/20 text-rose-300'
                : 'text-rose-300/70 hover:text-rose-200 hover:bg-white/5'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Share a private photo"
            className="p-2 text-rose-300/70 hover:text-rose-200 hover:bg-white/5 rounded-full transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsRecordingVoice(true)}
            title="Record voice message"
            className="p-2 text-rose-300/70 hover:text-rose-200 hover:bg-white/5 rounded-full transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsLoveNoteMode(!isLoveNoteMode)}
            title="Love Note Card Mode"
            className={`p-2 rounded-full transition-colors ${
              isLoveNoteMode
                ? 'bg-rose-500/30 text-rose-300 shadow-sm shadow-rose-500/30'
                : 'text-rose-300/70 hover:text-rose-200 hover:bg-white/5'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLoveNoteMode ? 'fill-rose-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            title="Schedule message"
            className={`p-2 rounded-full transition-colors ${
              scheduledTimestamp
                ? 'bg-rose-500/20 text-rose-300'
                : 'text-rose-300/70 hover:text-rose-200 hover:bg-white/5'
            }`}
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Input Text Box */}
        <div
          className={`flex-1 relative flex items-center bg-[#1c1130] rounded-2xl border transition-all ${
            isLoveNoteMode
              ? 'border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              : 'border-purple-800/40 focus-within:border-rose-500/50'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoveNoteMode
                ? 'Write a secret love note...'
                : 'Say something sweet...'
            }
            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-rose-300/40 resize-none focus:outline-none max-h-32"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className={`p-2.5 rounded-2xl flex items-center justify-center transition-all ${
            text.trim()
              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-rose-500/30 scale-100 hover:scale-105 active:scale-95'
              : 'bg-white/5 text-rose-300/30 cursor-not-allowed scale-95'
          }`}
          title="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Scheduled message modal */}
      <ScheduledMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={(ts) => setScheduledTimestamp(ts)}
      />
    </div>
  );
};
