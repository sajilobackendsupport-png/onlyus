import React, { useState } from 'react';
import { Clock, X, Calendar, Sparkles } from 'lucide-react';

interface ScheduledMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledTimestamp: number, customNote?: string) => void;
}

export const ScheduledMessageModal: React.FC<ScheduledMessageModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('midnight');
  const [customDateTime, setCustomDateTime] = useState<string>('');

  if (!isOpen) return null;

  const handleApply = () => {
    let targetTime = Date.now();

    if (selectedPreset === 'midnight') {
      const now = new Date();
      now.setHours(24, 0, 0, 0); // Next midnight
      targetTime = now.getTime();
    } else if (selectedPreset === 'morning') {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0); // Tomorrow 8 AM
      targetTime = now.getTime();
    } else if (selectedPreset === '1hour') {
      targetTime = Date.now() + 60 * 60 * 1000;
    } else if (selectedPreset === 'custom' && customDateTime) {
      targetTime = new Date(customDateTime).getTime();
    }

    onSchedule(targetTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#160d26] border border-rose-500/20 rounded-3xl p-5 shadow-2xl shadow-rose-950/50 text-rose-50">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Schedule Surprise Message</h3>
              <p className="text-[11px] text-rose-300/70">Deliver at the exact romantic moment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-rose-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 my-4">
          <button
            type="button"
            onClick={() => setSelectedPreset('midnight')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all ${
              selectedPreset === 'midnight'
                ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm'
                : 'bg-white/5 border-white/5 text-rose-200/80 hover:bg-white/10'
            }`}
          >
            <div>
              <span className="font-medium text-rose-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Midnight Surprise (00:00)
              </span>
              <p className="text-[10px] text-rose-300/60 mt-0.5">Perfect for midnight love notes or birthdays</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPreset('morning')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all ${
              selectedPreset === 'morning'
                ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm'
                : 'bg-white/5 border-white/5 text-rose-200/80 hover:bg-white/10'
            }`}
          >
            <div>
              <span className="font-medium text-rose-100">Tomorrow Morning (08:00 AM) ☀️</span>
              <p className="text-[10px] text-rose-300/60 mt-0.5">The first sweet notification when waking up</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPreset('1hour')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all ${
              selectedPreset === '1hour'
                ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm'
                : 'bg-white/5 border-white/5 text-rose-200/80 hover:bg-white/10'
            }`}
          >
            <div>
              <span className="font-medium text-rose-100">In 1 Hour ⏳</span>
              <p className="text-[10px] text-rose-300/60 mt-0.5">Quick sweet reminder</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPreset('custom')}
            className={`w-full flex flex-col p-3 rounded-2xl border text-left text-xs transition-all ${
              selectedPreset === 'custom'
                ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm'
                : 'bg-white/5 border-white/5 text-rose-200/80 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium text-rose-100 mb-2">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              Pick Exact Date & Time
            </div>
            {selectedPreset === 'custom' && (
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full bg-black/40 border border-rose-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-rose-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-all"
          >
            Set Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
