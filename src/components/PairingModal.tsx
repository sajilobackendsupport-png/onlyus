import React, { useState } from 'react';
import { Heart, Sparkles, Key, Check, Users, ShieldCheck, ArrowRight } from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onInitSpace: (pairCode: string, nickname: string, anniversaryDate: string) => void;
  onJoinSpace: (pairCode: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onInitSpace,
  onJoinSpace,
  onClose,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  
  // Create state
  const [createCode, setCreateCode] = useState(`US-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [createNickname, setCreateNickname] = useState('Sweetheart');
  const [anniversaryDate, setAnniversaryDate] = useState('2024-02-14');
  
  // Join state
  const [joinCode, setJoinCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('My Love');
  const [consentChecked, setConsentChecked] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    onInitSpace(createCode.trim().toUpperCase(), createNickname.trim(), anniversaryDate);
    onClose();
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter the pairing invitation code from your partner.');
      return;
    }
    if (!consentChecked) {
      setJoinError('Mutual consent is required to join this private space.');
      return;
    }

    setJoinError(null);
    setIsJoining(true);
    const result = await onJoinSpace(joinCode.trim().toUpperCase(), joinNickname.trim());
    setIsJoining(false);

    if (result.success) {
      onClose();
    } else {
      setJoinError(result.error || 'Failed to join. Please check the code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-rose-50">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1b0d2f] via-[#140824] to-[#0d0517] border border-rose-500/30 rounded-3xl p-6 shadow-2xl shadow-rose-950/70 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500/20 to-purple-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
            <Heart className="w-7 h-7 fill-rose-500/50 text-rose-400 animate-pulse" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">OnlyUs</h2>
          <p className="text-xs text-rose-300/70">
            A private, two-person messaging sanctuary designed exclusively for you and your partner.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-black/40 rounded-2xl border border-purple-900/40 text-xs font-semibold">
          <button
            onClick={() => setTab('create')}
            className={`py-2 rounded-xl transition-all ${
              tab === 'create'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/60 hover:text-white'
            }`}
          >
            Create Private Space
          </button>
          <button
            onClick={() => setTab('join')}
            className={`py-2 rounded-xl transition-all ${
              tab === 'join'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/60 hover:text-white'
            }`}
          >
            Join Partner
          </button>
        </div>

        {/* Create Mode */}
        {tab === 'create' && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block mb-1 text-rose-300 font-medium">Your Nickname</label>
              <input
                type="text"
                value={createNickname}
                onChange={(e) => setCreateNickname(e.target.value)}
                className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Secret Pair Code (For Partner)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-rose-300 font-mono font-bold tracking-wider focus:outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setCreateCode(`US-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-rose-300 text-xs font-medium"
                >
                  Generate
                </button>
              </div>
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

            <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-2xl text-[11px] text-purple-200 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Zero public profiles, zero search directories. Only the partner holding this code can pair with you.
              </span>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-xs shadow-xl shadow-rose-500/30 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Begin Our OnlyUs Space</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Join Mode */}
        {tab === 'join' && (
          <div className="space-y-3.5 text-xs">
            {joinError && (
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-[11px]">
                {joinError}
              </div>
            )}

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Your Nickname</label>
              <input
                type="text"
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Partner's Invitation Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. US-FOREVER or ONLY-LOVE-77"
                className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-rose-300 font-mono font-bold tracking-wider placeholder-rose-300/30 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 rounded text-rose-500 focus:ring-rose-400"
              />
              <label htmlFor="consentCheck" className="text-[11px] text-rose-200 cursor-pointer leading-tight">
                I explicitly consent to join this private two-person communication space with my partner.
              </label>
            </div>

            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-xs shadow-xl shadow-rose-500/30 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isJoining ? 'Joining Space...' : 'Accept Invitation & Enter'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
