import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Volume2,
  Moon,
  Users,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Calculator,
} from 'lucide-react';
import { CoupleSession, UserProfile, AppSettings } from '../types';
import { AVATAR_OPTIONS, getAvatarDetails } from '../utils/avatars';
import { storageService } from '../services/storage';

interface SettingsViewProps {
  session: CoupleSession;
  currentUser: UserProfile;
  settings: AppSettings;
  onUpdateProfile: (updates: Partial<UserProfile>, anniversaryDate?: string) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onFlushQueue: () => void;
  queuedMessagesCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  currentUser,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onFlushQueue,
  queuedMessagesCount,
}) => {
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [anniversaryDate, setAnniversaryDate] = useState(session.anniversaryDate || '2024-02-14');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [consentOnline, setConsentOnline] = useState(currentUser.consentShareOnline ?? true);
  
  const [passcode, setPasscode] = useState(settings.passcode || '');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [quietHours, setQuietHours] = useState(settings.quietHoursEnabled);
  const [quietStart, setQuietStart] = useState(settings.quietHoursStart || '23:00');
  const [quietEnd, setQuietEnd] = useState(settings.quietHoursEnd || '07:00');

  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.pairCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = () => {
    onUpdateProfile(
      {
        nickname: nickname.trim() || currentUser.nickname,
        avatar: selectedAvatar,
        consentShareOnline: consentOnline,
      },
      anniversaryDate
    );

    onUpdateSettings({
      ...settings,
      passcode: passcode.trim() || null,
      soundEnabled,
      quietHoursEnabled: quietHours,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const exportBlob = new Blob([JSON.stringify(session, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(exportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OnlyUs-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear local cache? Your server-synced messages will re-download.')) {
      storageService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto space-y-6 pb-24 animate-fade-in text-rose-50">
      {/* Settings Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white">Privacy & Settings</h2>
          <p className="text-xs text-rose-300/70">Personalize your private sanctuary and secure your data</p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold animate-fade-in">
            <Check className="w-3.5 h-3.5" /> Saved!
          </span>
        )}
      </div>

      {/* 1. Couple Invitation & Pairing Code Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#201035] to-[#140a24] border border-rose-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Our Secret Invitation Code</h3>
              <p className="text-[11px] text-rose-300/70">Share this code with your sweetheart to pair</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-black/40 border border-rose-500/30 rounded-2xl">
          <span className="flex-1 font-mono text-base font-bold text-rose-300 tracking-wider">
            {session.pairCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-[11px] text-rose-300/60 leading-relaxed">
          OnlyUs is strictly restricted to two consenting partners. No third parties can join or discover your messages.
        </p>
      </div>

      {/* 2. My Profile & Nickname */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold">
          Profile & Nickname
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block mb-1 text-rose-300 font-medium">Your Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Honey, Sweetheart, My King"
              className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-rose-300 font-medium">Our Anniversary Date</label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="block mb-2 text-rose-300 font-medium">Select Avatar Style</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedAvatar(opt.id)}
                  className={`flex flex-col items-center p-2 rounded-2xl border transition-all ${
                    selectedAvatar === opt.id
                      ? 'border-rose-500 bg-rose-500/20 shadow-md scale-105'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-tr ${opt.gradient} mb-1`}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-[10px] truncate max-w-full font-medium text-rose-200">
                    {opt.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Privacy, Passcode & Stealth Mode */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          Privacy & Security
        </h3>

        <div className="space-y-4 text-xs">
          {/* Online Presence Consent Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="max-w-[75%]">
              <span className="font-semibold text-rose-100 flex items-center gap-1.5">
                {consentOnline ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                Share Online Status
              </span>
              <p className="text-[11px] text-rose-300/60 mt-0.5">
                Display when you are active. If turned off, your presence remains completely hidden.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentOnline}
              onChange={(e) => setConsentOnline(e.target.checked)}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
          </div>

          {/* 4-digit Passcode Lock */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-100 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-rose-400" />
                4-Digit App Passcode
              </span>
              <span className="text-[10px] text-rose-300/60 font-mono">
                {passcode ? 'PIN set' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-rose-300/60">
              Lock OnlyUs with a secret PIN. Entering this PIN in the Stealth Calculator unlocks the app!
            </p>
            <input
              type="password"
              maxLength={4}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 1234 (leave blank to disable)"
              className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-center focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* Stealth Calculator Explanation */}
          <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-2xl text-[11px] text-purple-200 flex items-start gap-2">
            <Calculator className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Stealth Disguise Mode</span>
              Tap the Calculator icon on top anytime to instantly switch to a functioning innocent Calculator. Enter your PIN to return to OnlyUs.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notification Chimes & Quiet Hours */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-rose-400" />
          Romantic Audio & Quiet Hours
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <span className="font-semibold text-rose-100">Harmonic Romantic Chimes</span>
              <p className="text-[11px] text-rose-300/60 mt-0.5">
                Gentle celestial harp & pop tones for incoming messages and love pings
              </p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-100 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-400" />
                  Quiet Hours (Sleep Sanctuary)
                </span>
                <p className="text-[11px] text-rose-300/60 mt-0.5">
                  Mutes notification chimes automatically during bedtime
                </p>
              </div>
              <input
                type="checkbox"
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>

            {quietHours && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div>
                  <label className="block mb-1 text-[10px] text-rose-300 font-medium">Bedtime Start</label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-2 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] text-rose-300 font-medium">Wakeup End</label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-2 py-1.5 text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Offline Storage & Backup */}
      <div className="p-5 rounded-3xl bg-[#170c29]/80 border border-purple-800/30 space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-rose-300/70 font-semibold">
          Offline Storage & Data Backup
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
            <div>
              <span className="font-semibold text-rose-100">Offline Message Queue</span>
              <p className="text-[11px] text-rose-300/60 mt-0.5">
                {queuedMessagesCount > 0
                  ? `${queuedMessagesCount} messages waiting to dispatch`
                  : 'All messages successfully synced'}
              </p>
            </div>
            {queuedMessagesCount > 0 && (
              <button
                onClick={onFlushQueue}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold"
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                Retry
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-rose-200 font-medium transition-colors"
            >
              <Download className="w-4 h-4 text-rose-400" />
              Export Backup
            </button>

            <button
              onClick={handleClearCache}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveProfile}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-rose-500/30 active:scale-98 transition-all"
      >
        Save Settings
      </button>
    </div>
  );
};
