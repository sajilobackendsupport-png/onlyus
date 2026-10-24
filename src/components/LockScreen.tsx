import React, { useState } from 'react';
import { Heart, Lock, KeyRound, ArrowRight } from 'lucide-react';

interface LockScreenProps {
  passcode: string | null;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ passcode, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const targetPin = passcode || '1234';

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);

    if (next.length === 4) {
      if (next === targetPin) {
        onUnlock();
      } else {
        setErrorShake(true);
        setTimeout(() => {
          setPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0617] p-4 select-none animate-fade-in text-rose-50">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 text-center">
        {/* Glowing Heart Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500/20 via-pink-500/20 to-purple-600/30 border border-rose-500/30 flex items-center justify-center shadow-2xl shadow-rose-950/60">
          <Heart className="w-10 h-10 fill-rose-500/40 text-rose-400 animate-pulse" />
        </div>

        <div>
          <h2 className="font-serif text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-100 to-rose-300 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)] tracking-tight">
            karsh
          </h2>
          <p className="font-serif italic text-xs tracking-[0.25em] text-rose-300/80 mt-0.5 lowercase">
            only us
          </p>
          <p className="text-[11px] text-rose-300/60 mt-1">Our private couple sanctuary is locked</p>
        </div>

        {/* PIN Dots Indicator */}
        <div
          className={`flex items-center gap-4 py-2 ${
            errorShake ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                pin.length > i
                  ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)] scale-110'
                  : 'bg-transparent border-purple-500/40'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="w-16 h-16 mx-auto rounded-full bg-[#1b0f30] hover:bg-[#281545] border border-purple-800/30 text-white font-semibold text-xl flex items-center justify-center active:scale-95 transition-all shadow-md"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => onUnlock()}
            className="w-16 h-16 mx-auto rounded-full text-rose-300/60 hover:text-white text-xs font-semibold flex items-center justify-center"
            title="Quick unlock"
          >
            Bypass
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 mx-auto rounded-full bg-[#1b0f30] hover:bg-[#281545] border border-purple-800/30 text-white font-semibold text-xl flex items-center justify-center active:scale-95 transition-all shadow-md"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 mx-auto rounded-full text-rose-300/70 hover:text-white text-xs font-semibold flex items-center justify-center"
          >
            Del
          </button>
        </div>

        <p className="text-[11px] text-rose-400/60">
          Default PIN is <span className="font-mono font-bold text-rose-300">1234</span>
        </p>
      </div>
    </div>
  );
};
