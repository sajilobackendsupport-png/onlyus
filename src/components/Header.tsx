import React from 'react';
import {
  Heart,
  Search,
  Lock,
  Calculator,
  WifiOff,
  Users,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getAvatarDetails } from '../utils/avatars';

interface HeaderProps {
  currentUser: UserProfile;
  partner: UserProfile | null;
  isOffline: boolean;
  onToggleSearch: () => void;
  showSearch: boolean;
  onLockApp: () => void;
  onToggleStealth: () => void;
  onSwitchUser: () => void;
  onOpenIntro?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  partner,
  isOffline,
  onToggleSearch,
  showSearch,
  onLockApp,
  onToggleStealth,
  onSwitchUser,
  onOpenIntro,
}) => {
  const partnerAvatar = partner ? getAvatarDetails(partner.avatar) : null;
  const isPartnerOnline = partner?.consentShareOnline && partner.isOnline;
  const timeSinceSeen = partner?.lastSeen ? Date.now() - partner.lastSeen : 99999999;
  const isRecentlyActive = isPartnerOnline || timeSinceSeen < 60000;

  return (
    <header className="relative z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 bg-[#0e061b]/95 backdrop-blur-xl border-b border-purple-900/40">
      {/* Left: Partner Info */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Partner Presence Badge */}
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-gradient-to-tr ${
              partnerAvatar?.gradient || 'from-purple-600 to-rose-500'
            } shadow-md shadow-rose-950/40 border border-white/20`}
          >
            {partnerAvatar?.icon || '💕'}
          </div>

          {/* Online Indicator Dot (Only with consent) */}
          {partner?.consentShareOnline ? (
            <div
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0e061b] ${
                isRecentlyActive ? 'bg-emerald-400' : 'bg-zinc-500'
              }`}
              title={isRecentlyActive ? 'Partner is online now' : 'Partner is away'}
            >
              {isRecentlyActive && (
                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              )}
            </div>
          ) : (
            <div
              className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#1e1233] border border-white/20 text-[8px] text-zinc-400"
              title="Online status private"
            >
              <EyeOff className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-tight flex items-center gap-1">
              <span>{partner?.nickname || 'Partner'}</span>
              {partner?.mood && (
                <span className="text-xs" title={`Partner mood: ${partner.mood}`}>
                  {partner.mood === 'in-love' && '🥰'}
                  {partner.mood === 'missing-you' && '🥺'}
                  {partner.mood === 'happy' && '✨'}
                  {partner.mood === 'need-hug' && '🤗'}
                  {partner.mood === 'cozy' && '☕'}
                  {partner.mood === 'sleepy' && '😴'}
                  {partner.mood === 'excited' && '🎉'}
                </span>
              )}
            </h2>

            {/* Offline tag */}
            {isOffline && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-medium">
                <WifiOff className="w-2.5 h-2.5" />
                Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-rose-300/70">
            {partner?.consentShareOnline ? (
              <span>
                {isRecentlyActive
                  ? 'Active now'
                  : `Active ${Math.floor(timeSinceSeen / 60000)}m ago`}
              </span>
            ) : (
              <span className="text-zinc-400 italic">Privacy enabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Karsh & only us */}
      <div
        onClick={onOpenIntro}
        className="cursor-pointer group flex flex-col items-center justify-center text-center px-2 py-0.5 rounded-xl hover:bg-white/5 transition-colors"
        title="Karsh — only us (Tap to view intro animation)"
      >
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-400 group-hover:scale-125 transition-transform" />
          <h1 className="font-serif text-lg sm:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-100 to-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]">
            karsh
          </h1>
          <Sparkles className="w-3 h-3 text-amber-300 opacity-80" />
        </div>
        <p className="font-serif italic text-[10px] sm:text-[11px] tracking-[0.25em] text-rose-300/80 font-light -mt-0.5 lowercase">
          only us
        </p>
      </div>

      {/* Right: Header Action Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Switch perspective button (Aalu <-> Petu) */}
        <button
          onClick={onSwitchUser}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-xs font-semibold transition-all active:scale-95"
          title={`Currently ${currentUser.nickname}. Tap to switch to ${partner?.nickname || 'Partner'}`}
        >
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">I am {currentUser.nickname}</span>
          <span className="sm:hidden">{currentUser.nickname === 'Aalu' ? '🥔' : '🧸'}</span>
        </button>

        {/* Search Conversation */}
        <button
          onClick={onToggleSearch}
          className={`p-2 rounded-xl transition-colors ${
            showSearch
              ? 'bg-rose-500/20 text-rose-300'
              : 'text-rose-300/70 hover:text-white hover:bg-white/5'
          }`}
          title="Search conversation"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Stealth Disguise Button */}
        <button
          onClick={onToggleStealth}
          className="p-2 rounded-xl text-rose-300/70 hover:text-amber-300 hover:bg-white/5 transition-colors"
          title="Stealth Disguise Mode (Opens Calculator)"
        >
          <Calculator className="w-4 h-4" />
        </button>

        {/* Quick Passcode Lock */}
        <button
          onClick={onLockApp}
          className="p-2 rounded-xl text-rose-300/70 hover:text-rose-200 hover:bg-white/5 transition-colors"
          title="Lock App"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
