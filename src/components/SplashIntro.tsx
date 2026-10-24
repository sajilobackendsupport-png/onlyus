import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/sound';

interface SplashIntroProps {
  onSelectPersona: (persona: 'Aalu' | 'Petu') => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onSelectPersona, isOpen }) => {
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [selected, setSelected] = useState<'Aalu' | 'Petu' | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Sequence of lovely opening animations:
    // Step 0: Initial dark mystery
    // Step 1: Glowing heart expands & pulses
    // Step 2: "Karsh" title shimmer + "only us" fades in
    // Step 3: Aalu or Petu selector emerges
    const t1 = setTimeout(() => {
      setAnimationStep(1);
      soundService.playSparkle();
    }, 400);

    const t2 = setTimeout(() => {
      setAnimationStep(2);
    }, 1300);

    const t3 = setTimeout(() => {
      setAnimationStep(3);
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (persona: 'Aalu' | 'Petu') => {
    setSelected(persona);
    soundService.playSparkle();

    // Romantic heart confetti burst
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.65 },
      colors: ['#f43f5e', '#ec4899', '#f59e0b', '#fb7185', '#d946ef'],
      shapes: ['circle'],
    });

    setTimeout(() => {
      onSelectPersona(persona);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07030d] p-4 select-none overflow-hidden transition-all duration-700">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-700/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Floating subtle romantic star particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-rose-400 text-xs animate-pulse"
            style={{
              top: `${(i * 19 + 7) % 90}%`,
              left: `${(i * 29 + 11) % 90}%`,
              animationDelay: `${(i * 0.4) % 3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          >
            {i % 2 === 0 ? '✨' : '💖'}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        {/* Glowing Heart with Pulse Rings */}
        <div
          className={`relative mb-6 transition-all duration-1000 transform ${
            animationStep >= 1
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-50'
          }`}
        >
          {/* Animated concentric glowing wave rings */}
          <div className="absolute -inset-4 rounded-full bg-rose-500/20 blur-xl animate-ping opacity-60" />
          <div className="absolute -inset-2 rounded-full bg-pink-500/30 blur-md animate-pulse" />

          {/* Central Heart Vessel */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#310e3d] via-[#240b2e] to-[#12061b] border border-rose-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.45)]">
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 fill-rose-500 text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)] animate-pulse" />
            <Sparkles className="absolute top-3 right-3 w-4 h-4 text-amber-300 animate-spin [animation-duration:8s]" />
          </div>
        </div>

        {/* Main Name: Karsh */}
        <div
          className={`transition-all duration-1000 transform ${
            animationStep >= 2
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <h1 className="font-serif text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-100 to-rose-300 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]">
            karsh
          </h1>

          {/* Subtitle: only us */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-6 h-px bg-gradient-to-r from-transparent to-rose-500/60" />
            <p className="font-serif italic text-base sm:text-lg tracking-[0.28em] text-rose-300/90 font-light lowercase">
              only us
            </p>
            <span className="w-6 h-px bg-gradient-to-l from-transparent to-rose-500/60" />
          </div>
        </div>

        {/* Persona Selector: Aalu or Petu */}
        <div
          className={`w-full mt-8 sm:mt-10 transition-all duration-700 transform ${
            animationStep >= 3
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          <p className="text-xs uppercase tracking-widest text-rose-300/70 font-semibold mb-4">
            Who is opening our sanctuary?
          </p>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 w-full">
            {/* Aalu Card */}
            <button
              onClick={() => handleSelect('Aalu')}
              disabled={selected !== null}
              className={`relative group flex flex-col items-center p-4 rounded-3xl border transition-all duration-300 active:scale-95 ${
                selected === 'Aalu'
                  ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-105'
                  : 'bg-[#180b26]/90 hover:bg-[#25103a] border-amber-500/30 hover:border-amber-400/60 shadow-lg shadow-black/50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-pink-500 flex items-center justify-center text-3xl mb-2.5 shadow-md shadow-amber-950/40 group-hover:scale-110 transition-transform">
                🥔
              </div>
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                Aalu
              </span>
              <span className="text-[11px] text-amber-300/80 mt-0.5 font-medium">
                The sweetest soul ❤️
              </span>

              {selected === 'Aalu' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center animate-bounce">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Petu Card */}
            <button
              onClick={() => handleSelect('Petu')}
              disabled={selected !== null}
              className={`relative group flex flex-col items-center p-4 rounded-3xl border transition-all duration-300 active:scale-95 ${
                selected === 'Petu'
                  ? 'bg-rose-500/30 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)] scale-105'
                  : 'bg-[#180b26]/90 hover:bg-[#25103a] border-rose-500/30 hover:border-rose-400/60 shadow-lg shadow-black/50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center text-3xl mb-2.5 shadow-md shadow-rose-950/40 group-hover:scale-110 transition-transform">
                🧸
              </div>
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                Petu
              </span>
              <span className="text-[11px] text-rose-300/80 mt-0.5 font-medium">
                The cuddly heartbeat 💕
              </span>

              {selected === 'Petu' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-400 text-white flex items-center justify-center animate-bounce">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          <p className="text-[11px] text-rose-300/50 mt-4 italic">
            Tap your name to enter our forever love space
          </p>
        </div>
      </div>
    </div>
  );
};
