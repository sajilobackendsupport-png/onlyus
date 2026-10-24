import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface StealthCalculatorProps {
  passcode: string | null;
  onUnlock: () => void;
}

export const StealthCalculator: React.FC<StealthCalculatorProps> = ({ passcode, onUnlock }) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetDisplayNext, setResetDisplayNext] = useState(false);
  const [typedSequence, setTypedSequence] = useState('');

  const targetPin = passcode || '1234';

  const handleDigit = (digit: string) => {
    // Check PIN unlock sequence
    const nextSeq = (typedSequence + digit).slice(-targetPin.length);
    setTypedSequence(nextSeq);
    if (nextSeq === targetPin) {
      onUnlock();
      return;
    }

    if (display === '0' || resetDisplayNext) {
      setDisplay(digit);
      setResetDisplayNext(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setResetDisplayNext(false);
  };

  const handleOp = (op: string) => {
    setPrevValue(parseFloat(display));
    setOperation(op);
    setResetDisplayNext(true);
  };

  const handleEquals = () => {
    if (prevValue === null || operation === null) return;
    const current = parseFloat(display);
    let result = 0;
    switch (operation) {
      case '+':
        result = prevValue + current;
        break;
      case '-':
        result = prevValue - current;
        break;
      case '×':
        result = prevValue * current;
        break;
      case '÷':
        result = current !== 0 ? prevValue / current : 0;
        break;
    }
    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
    setResetDisplayNext(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 select-none animate-fade-in">
      <div className="w-full max-w-xs bg-black rounded-3xl p-5 shadow-2xl flex flex-col justify-between h-[520px]">
        {/* Subtle top bar */}
        <div className="flex items-center justify-between text-zinc-600 text-xs px-2 pt-1">
          <span>Calculator</span>
          <button
            onClick={onUnlock}
            title="Exit Stealth Mode"
            className="p-1 hover:text-zinc-400 opacity-30 hover:opacity-100 transition-opacity"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Display */}
        <div className="text-right text-white font-mono text-5xl pr-2 tracking-tight overflow-x-auto truncate pb-3">
          {display}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={handleClear}
            className="w-14 h-14 rounded-full bg-zinc-600 text-black font-semibold text-xl active:bg-zinc-400 transition-colors"
          >
            AC
          </button>
          <button
            onClick={() => setDisplay(String(-parseFloat(display)))}
            className="w-14 h-14 rounded-full bg-zinc-600 text-black font-semibold text-xl active:bg-zinc-400 transition-colors"
          >
            ±
          </button>
          <button
            onClick={() => setDisplay(String(parseFloat(display) / 100))}
            className="w-14 h-14 rounded-full bg-zinc-600 text-black font-semibold text-xl active:bg-zinc-400 transition-colors"
          >
            %
          </button>
          <button
            onClick={() => handleOp('÷')}
            className="w-14 h-14 rounded-full bg-amber-500 text-white font-semibold text-2xl active:bg-amber-400 transition-colors"
          >
            ÷
          </button>

          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-14 h-14 rounded-full bg-zinc-800 text-white font-semibold text-2xl active:bg-zinc-700 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => handleOp('×')}
            className="w-14 h-14 rounded-full bg-amber-500 text-white font-semibold text-2xl active:bg-amber-400 transition-colors"
          >
            ×
          </button>

          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-14 h-14 rounded-full bg-zinc-800 text-white font-semibold text-2xl active:bg-zinc-700 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => handleOp('-')}
            className="w-14 h-14 rounded-full bg-amber-500 text-white font-semibold text-2xl active:bg-amber-400 transition-colors"
          >
            -
          </button>

          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-14 h-14 rounded-full bg-zinc-800 text-white font-semibold text-2xl active:bg-zinc-700 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => handleOp('+')}
            className="w-14 h-14 rounded-full bg-amber-500 text-white font-semibold text-2xl active:bg-amber-400 transition-colors"
          >
            +
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="col-span-2 h-14 rounded-full bg-zinc-800 text-white font-semibold text-2xl pl-6 text-left active:bg-zinc-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={() => !display.includes('.') && setDisplay(display + '.')}
            className="w-14 h-14 rounded-full bg-zinc-800 text-white font-semibold text-2xl active:bg-zinc-700 transition-colors"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="w-14 h-14 rounded-full bg-amber-500 text-white font-semibold text-2xl active:bg-amber-400 transition-colors"
          >
            =
          </button>
        </div>

        <div className="text-[10px] text-zinc-700 text-center">
          Disguise active. Type PIN ({targetPin}) to unlock.
        </div>
      </div>
    </div>
  );
};
