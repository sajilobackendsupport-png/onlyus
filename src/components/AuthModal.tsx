import React, { useState } from 'react';
import {
  Heart,
  Lock,
  Mail,
  User,
  ShieldCheck,
  FileCode,
  Bell,
  Check,
  ArrowRight,
  X,
} from 'lucide-react';
import { coupleService } from '../services/coupleService';
import { notificationService } from '../services/notificationService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'firebase_rules'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('Aalu');
  const [pairCode, setPairCode] = useState('KARSH-FOREVER');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    notificationService.permission
  );
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await coupleService.login(email.trim(), password);
    setLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
      onClose();
    } else {
      setErrorMessage(res.error || 'Login failed. Check credentials.');
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const avatar = nickname.toLowerCase().includes('petu') ? 'avatar-petu' : 'avatar-aalu';
    const res = await coupleService.register(email.trim(), password, nickname.trim(), avatar, pairCode.trim().toUpperCase());
    setLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
      onClose();
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const handleQuickLogin = async (targetPersona: 'Aalu' | 'Petu') => {
    setLoading(true);
    setErrorMessage(null);
    const targetEmail = targetPersona === 'Aalu' ? 'aalu@karsh.love' : 'petu@karsh.love';
    const targetPassword = 'love';

    const res = await coupleService.login(targetEmail, targetPassword);
    setLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
      onClose();
    } else {
      // If default not created yet, register them!
      const avatar = targetPersona === 'Aalu' ? 'avatar-aalu' : 'avatar-petu';
      const reg = await coupleService.register(targetEmail, targetPassword, targetPersona, avatar, 'KARSH-FOREVER');
      if (reg.success && reg.user) {
        onAuthSuccess(reg.user);
        onClose();
      }
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
  };

  const firestoreRulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }

    // Couple session: Only the two designated participants can read or update
    match /couples/{pairCode} {
      allow read, update: if request.auth != null && (
        resource.data.user1.id == request.auth.uid ||
        resource.data.user2.id == request.auth.uid
      );
      allow create: if request.auth != null;

      // Messages sub-collection: only sender can create, both can read
      match /messages/{messageId} {
        allow read: if request.auth != null && (
          get(/databases/$(database)/documents/couples/$(pairCode)).data.user1.id == request.auth.uid ||
          get(/databases/$(database)/documents/couples/$(pairCode)).data.user2.id == request.auth.uid
        );
        allow create: if request.auth != null &&
          request.resource.data.senderId == request.auth.uid;
        allow update, delete: if request.auth != null &&
          resource.data.senderId == request.auth.uid;
      }
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(firestoreRulesContent);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-rose-50">
      <div className="w-full max-w-md bg-[#160d26] border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-rose-950/70 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500/20 to-purple-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500/50" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                karsh
                <span className="text-[11px] font-sans font-normal text-rose-300/70">• only us</span>
              </h2>
              <p className="text-[11px] text-rose-300/60">Separate Phone Account Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-rose-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-1 bg-black/40 rounded-2xl border border-purple-900/40 text-xs font-semibold">
          <button
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`py-1.5 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`py-1.5 rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/60 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('firebase_rules'); setErrorMessage(null); }}
            className={`py-1.5 rounded-xl transition-all ${
              mode === 'firebase_rules'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/60 hover:text-white'
            }`}
          >
            Firebase Info
          </button>
        </div>

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs animate-shake">
            {errorMessage}
          </div>
        )}

        {/* 1. Sign In Mode */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            {/* Quick 1-Click Persona Login */}
            <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-2xl space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-rose-300/70 font-semibold block">
                Quick Sign-In For This Phone:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Aalu')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold active:scale-95 transition-all"
                >
                  <span>🥔</span>
                  <span>Sign In as Aalu</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Petu')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold active:scale-95 transition-all"
                >
                  <span>🧸</span>
                  <span>Sign In as Petu</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-rose-400/60" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aalu@karsh.love or petu@karsh.love"
                  className="w-full bg-black/40 border border-purple-800/40 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-rose-400/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full bg-black/40 border border-purple-800/40 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-rose-500/30 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Karsh'}
            </button>
          </form>
        )}

        {/* 2. Register Mode */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block mb-1 text-rose-300 font-medium">Your Nickname</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setNickname('Aalu')}
                  className={`py-1.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                    nickname === 'Aalu'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-white/5 border-white/5 text-rose-200'
                  }`}
                >
                  <span>🥔 Aalu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNickname('Petu')}
                  className={`py-1.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                    nickname === 'Petu'
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                      : 'bg-white/5 border-white/5 text-rose-200'
                  }`}
                >
                  <span>🧸 Petu</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a private password"
                className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-rose-300 font-medium">Shared Secret Pair Code</label>
              <input
                type="text"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                placeholder="KARSH-FOREVER"
                className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-rose-300 font-mono font-bold tracking-wider focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-rose-500/30 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account & Join Karsh'}
            </button>
          </form>
        )}

        {/* 3. Firebase Architecture & Rules Mode */}
        {mode === 'firebase_rules' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-[11px] leading-relaxed text-purple-200">
              <span className="font-bold text-white block mb-1">
                🔒 Strict Firestore Security Rules
              </span>
              These hardened rules restrict read, write, and subcollection operations strictly to the two authenticated UIDs:
            </div>

            <div className="relative">
              <pre className="p-3 bg-black/60 border border-purple-900/50 rounded-2xl text-[10px] font-mono text-rose-200 overflow-x-auto max-h-48">
                {firestoreRulesContent}
              </pre>
              <button
                onClick={copyRules}
                className="absolute top-2 right-2 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-[10px] font-semibold text-rose-200 flex items-center gap-1 transition-colors"
              >
                {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                {copiedRules ? 'Copied!' : 'Copy Rules'}
              </button>
            </div>

            {/* Notification Permissions for Android */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Android Mobile Notifications</span>
                <span className="text-[10px] text-rose-300/60">
                  Status: {notificationStatus === 'granted' ? 'Enabled 🔔' : 'Not enabled'}
                </span>
              </div>
              <button
                onClick={handleRequestNotifications}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-semibold"
              >
                Enable
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
