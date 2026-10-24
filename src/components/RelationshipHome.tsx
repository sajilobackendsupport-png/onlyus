import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Calendar,
  Smile,
  Send,
  MessageCircle,
  BookHeart,
  Clock,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CoupleSession, UserProfile, UserMood } from '../types';
import { getAvatarDetails, MOOD_OPTIONS } from '../utils/avatars';
import { soundService } from '../services/sound';

interface RelationshipHomeProps {
  session: CoupleSession;
  currentUser: UserProfile;
  partner: UserProfile | null;
  onSendLovePing: (type: string, emoji: string) => void;
  onUpdateMood: (mood: UserMood) => void;
  onNavigateToChat: () => void;
  onNavigateToMemories: () => void;
}

export const RelationshipHome: React.FC<RelationshipHomeProps> = ({
  session,
  currentUser,
  partner,
  onSendLovePing,
  onUpdateMood,
  onNavigateToChat,
  onNavigateToMemories,
}) => {
  const [timeElapsed, setTimeElapsed] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const anniversary = new Date(session.anniversaryDate || '2024-02-14').getTime();
      const now = Date.now();
      const diff = Math.max(0, now - anniversary);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeElapsed({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [session.anniversaryDate]);

  const triggerHeartFireworks = () => {
    soundService.playSparkle();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#d946ef', '#fb7185', '#fda4af'],
      shapes: ['circle'],
    });
  };

  const myAvatar = getAvatarDetails(currentUser.avatar);
  const partnerAvatar = partner ? getAvatarDetails(partner.avatar) : null;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Hero Love Counter Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#241138] via-[#1a0c2c] to-[#120720] border border-rose-500/30 p-6 shadow-2xl shadow-rose-950/60 text-center">
        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Our Love Story Since{' '}
              {new Date(session.anniversaryDate || '2024-02-14').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold tracking-tight mb-4">
            Together In Love
          </h2>

          {/* Time Counter Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto my-5">
            <div className="p-3 bg-white/5 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-rose-200 font-mono">
                {timeElapsed.days}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-rose-300/70 font-medium">
                Days
              </span>
            </div>

            <div className="p-3 bg-white/5 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-rose-200 font-mono">
                {timeElapsed.hours}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-rose-300/70 font-medium">
                Hours
              </span>
            </div>

            <div className="p-3 bg-white/5 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-rose-200 font-mono">
                {timeElapsed.minutes}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-rose-300/70 font-medium">
                Minutes
              </span>
            </div>

            <div className="p-3 bg-white/5 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-rose-300 to-pink-400 font-mono">
                {timeElapsed.seconds}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-rose-300/70 font-medium">
                Seconds
              </span>
            </div>
          </div>

          <button
            onClick={triggerHeartFireworks}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white text-xs font-semibold shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
          >
            <Heart className="w-4 h-4 fill-white" />
            Celebrate Us
          </button>
        </div>
      </div>

      {/* Two Hearts Connected Card */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold mb-4 text-center">
          Connected Hearts
        </h3>

        <div className="flex items-center justify-between max-w-sm mx-auto px-4">
          {/* User 1 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-tr ${myAvatar.gradient} border-2 ${myAvatar.borderColor} shadow-lg shadow-rose-950/40`}
            >
              {myAvatar.icon}
            </div>
            <span className="mt-2 text-xs font-bold text-white">{currentUser.nickname}</span>
            <span className="text-[10px] text-rose-300/70 capitalize">
              {currentUser.mood ? currentUser.mood.replace('-', ' ') : 'In love'}
            </span>
          </div>

          {/* Connected Glowing Heart Pulse Line */}
          <div className="flex-1 flex flex-col items-center mx-4">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/30 animate-pulse">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-400" />
            </div>
            <span className="font-serif font-bold text-xs text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-200 mt-1">
              karsh
            </span>
            <span className="font-serif italic text-[8px] text-rose-300/70 lowercase tracking-widest -mt-0.5">
              only us
            </span>
          </div>

          {/* User 2 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-tr ${
                partnerAvatar?.gradient || 'from-purple-600 to-rose-500'
              } border-2 ${partnerAvatar?.borderColor || 'border-purple-400'} shadow-lg shadow-rose-950/40`}
            >
              {partnerAvatar?.icon || '💕'}
            </div>
            <span className="mt-2 text-xs font-bold text-white">
              {partner?.nickname || 'Partner'}
            </span>
            <span className="text-[10px] text-rose-300/70 capitalize">
              {partner?.mood ? partner.mood.replace('-', ' ') : 'Thinking of you'}
            </span>
          </div>
        </div>
      </div>

      {/* Instant Romantic Love Pings */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Send An Instant Love Ping
          </h3>
          <span className="text-[10px] text-rose-300/50">One-tap sweet touch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onSendLovePing('love_ping', '❤️')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all active:scale-95 text-center"
          >
            <span className="text-2xl mb-1">❤️</span>
            <span className="text-xs font-semibold text-rose-100">Send Heart</span>
            <span className="text-[10px] text-rose-300/60">I love you</span>
          </button>

          <button
            onClick={() => onSendLovePing('love_ping', '💋')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all active:scale-95 text-center"
          >
            <span className="text-2xl mb-1">💋</span>
            <span className="text-xs font-semibold text-rose-100">Virtual Kiss</span>
            <span className="text-[10px] text-rose-300/60">Mwah!</span>
          </button>

          <button
            onClick={() => onSendLovePing('love_ping', '🤗')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all active:scale-95 text-center"
          >
            <span className="text-2xl mb-1">🤗</span>
            <span className="text-xs font-semibold text-rose-100">Warm Hug</span>
            <span className="text-[10px] text-rose-300/60">Hold you tight</span>
          </button>

          <button
            onClick={() => onSendLovePing('love_ping', '🥺')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all active:scale-95 text-center"
          >
            <span className="text-2xl mb-1">🥺</span>
            <span className="text-xs font-semibold text-rose-100">Miss You</span>
            <span className="text-[10px] text-rose-300/60">Wish you were here</span>
          </button>
        </div>
      </div>

      {/* Update My Mood Picker */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold mb-3">
          How are you feeling today?
        </h3>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => {
            const isSelected = currentUser.mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onUpdateMood(m.id as UserMood)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-rose-500/30 border-rose-500/60 text-white shadow-sm'
                    : 'bg-white/5 border-white/5 text-rose-200/80 hover:bg-white/10'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Buttons to Chat & Memories */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigateToChat}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-500/30 text-rose-200 text-xs font-bold transition-all shadow-md active:scale-98"
        >
          <MessageCircle className="w-4 h-4 text-rose-400" />
          Open Private Chat
        </button>

        <button
          onClick={onNavigateToMemories}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all shadow-md active:scale-98"
        >
          <BookHeart className="w-4 h-4 text-purple-400" />
          Our Diary & Memories
        </button>
      </div>
    </div>
  );
};
