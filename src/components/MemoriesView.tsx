import React, { useState } from 'react';
import {
  BookHeart,
  Calendar,
  Plus,
  Image,
  Lock,
  Unlock,
  Heart,
  Sparkles,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { Memory, DiaryEntry, UserProfile } from '../types';

interface MemoriesViewProps {
  memories: Memory[];
  diaries: DiaryEntry[];
  currentUser: UserProfile;
  onAddMemory: (memory: Memory) => void;
  onAddDiary: (entry: DiaryEntry) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  memories,
  diaries,
  currentUser,
  onAddMemory,
  onAddDiary,
}) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'diary'>('memories');
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [showAddDiaryModal, setShowAddDiaryModal] = useState(false);

  // Add Memory state
  const [memTitle, setMemTitle] = useState('');
  const [memDate, setMemDate] = useState(new Date().toISOString().split('T')[0]);
  const [memDesc, setMemDesc] = useState('');
  const [memCategory, setMemCategory] = useState<'milestone' | 'date' | 'letter' | 'trip'>('milestone');
  const [memPhoto, setMemPhoto] = useState<string | null>(null);

  // Add Diary state
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryMood, setDiaryMood] = useState('grateful');
  const [diaryLocked, setDiaryLocked] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setMemPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMemory = () => {
    if (!memTitle.trim()) return;
    const newMemory: Memory = {
      id: `mem-${Date.now()}`,
      title: memTitle.trim(),
      date: memDate,
      description: memDesc.trim(),
      category: memCategory,
      photoUrl: memPhoto || undefined,
      createdAt: Date.now(),
    };
    onAddMemory(newMemory);
    setShowAddMemoryModal(false);
    setMemTitle('');
    setMemDesc('');
    setMemPhoto(null);
  };

  const handleSaveDiary = () => {
    if (!diaryTitle.trim() || !diaryContent.trim()) return;
    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      authorId: currentUser.id,
      authorNickname: currentUser.nickname,
      title: diaryTitle.trim(),
      content: diaryContent.trim(),
      mood: diaryMood,
      isLocked: diaryLocked,
      createdAt: Date.now(),
    };
    onAddDiary(newEntry);
    setShowAddDiaryModal(false);
    setDiaryTitle('');
    setDiaryContent('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Tab Switcher & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center p-1 bg-[#170e28] border border-purple-800/30 rounded-2xl">
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'memories'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/70 hover:text-white'
            }`}
          >
            Milestones & Scrapbook
          </button>
          <button
            onClick={() => setActiveTab('diary')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'diary'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-rose-300/70 hover:text-white'
            }`}
          >
            Secret Couple Diary
          </button>
        </div>

        <button
          onClick={() =>
            activeTab === 'memories'
              ? setShowAddMemoryModal(true)
              : setShowAddDiaryModal(true)
          }
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-rose-400" />
          <span>{activeTab === 'memories' ? 'Add Memory' : 'New Entry'}</span>
        </button>
      </div>

      {/* 1. Milestones & Scrapbook Tab */}
      {activeTab === 'memories' && (
        <div className="space-y-4">
          {memories.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#140b24]/60 border border-purple-900/30 rounded-3xl">
              <BookHeart className="w-10 h-10 text-rose-400/50 mx-auto mb-3" />
              <h4 className="font-serif text-base text-white font-semibold">No Memories Saved Yet</h4>
              <p className="text-xs text-rose-300/60 mt-1 max-w-sm mx-auto">
                Capture the unforgettable moments of your journey—first dates, vacations, and special milestones.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l border-rose-500/30 space-y-6">
              {memories.map((mem) => (
                <div key={mem.id} className="relative group">
                  {/* Timeline Pin Node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#180d2c] border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-md shadow-rose-500/20">
                    <Heart className="w-3 h-3 fill-rose-500" />
                  </div>

                  {/* Memory Card */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-[#170c2a]/90 border border-purple-800/30 shadow-lg shadow-rose-950/20 backdrop-blur-sm hover:border-rose-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] uppercase font-bold tracking-wider">
                        {mem.category}
                      </span>
                      <span className="text-[11px] text-rose-300/60 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-rose-400" />
                        {new Date(mem.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h4 className="font-serif text-lg font-bold text-white mb-2">
                      {mem.title}
                    </h4>

                    {mem.photoUrl && (
                      <div className="mb-3 overflow-hidden rounded-2xl max-h-60">
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="w-full h-full object-cover rounded-2xl hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <p className="text-xs text-rose-100/80 leading-relaxed whitespace-pre-wrap">
                      {mem.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Secret Couple Diary Tab */}
      {activeTab === 'diary' && (
        <div className="space-y-4">
          {diaries.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#140b24]/60 border border-purple-900/30 rounded-3xl">
              <BookHeart className="w-10 h-10 text-rose-400/50 mx-auto mb-3" />
              <h4 className="font-serif text-base text-white font-semibold">Shared Secret Journal</h4>
              <p className="text-xs text-rose-300/60 mt-1 max-w-sm mx-auto">
                Write heart-to-heart letters, tender thoughts, and daily appreciation notes only visible between the two of you.
              </p>
            </div>
          ) : (
            diaries.map((entry) => (
              <div
                key={entry.id}
                className="p-5 rounded-3xl bg-gradient-to-br from-[#1b0d30] via-[#150a26] to-[#0f071c] border border-rose-500/20 shadow-xl backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-white text-base">
                      {entry.title}
                    </span>
                    {entry.isLocked && (
                      <span className="p-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-rose-300/60 font-mono">
                    By {entry.authorNickname} • {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm font-serif italic text-rose-100/90 leading-relaxed whitespace-pre-wrap">
                  "{entry.content}"
                </p>

                <div className="flex items-center justify-between mt-4 pt-2 text-[11px] text-rose-400/70">
                  <span className="capitalize">Mood: {entry.mood}</span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                    Forever Us
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#160d28] border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-rose-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-serif font-bold text-base text-white">Add Romantic Memory</h3>
              <button
                onClick={() => setShowAddMemoryModal(false)}
                className="p-1 text-rose-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-rose-300 font-medium">Memory Title</label>
                <input
                  type="text"
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="e.g. Starry night by the lake"
                  className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-rose-300 font-medium">Date</label>
                  <input
                    type="date"
                    value={memDate}
                    onChange={(e) => setMemDate(e.target.value)}
                    className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-rose-300 font-medium">Category</label>
                  <select
                    value={memCategory}
                    onChange={(e) => setMemCategory(e.target.value as any)}
                    className="w-full bg-[#1b0f30] border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="milestone">Milestone</option>
                    <option value="date">Date Night</option>
                    <option value="trip">Vacation / Trip</option>
                    <option value="letter">Love Letter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-rose-300 font-medium">Description</label>
                <textarea
                  rows={3}
                  value={memDesc}
                  onChange={(e) => setMemDesc(e.target.value)}
                  placeholder="What made this moment unforgettable?"
                  className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-rose-300 font-medium">Attach Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-rose-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-rose-500/20 file:text-rose-200 file:font-semibold hover:file:bg-rose-500/30"
                />
                {memPhoto && (
                  <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border border-rose-500/40">
                    <img src={memPhoto} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowAddMemoryModal(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-rose-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMemory}
                disabled={!memTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-xs font-semibold text-white shadow-lg shadow-rose-500/30 disabled:opacity-50"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Diary Entry Modal */}
      {showAddDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#160d28] border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-rose-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-serif font-bold text-base text-white">New Shared Journal Entry</h3>
              <button
                onClick={() => setShowAddDiaryModal(false)}
                className="p-1 text-rose-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-rose-300 font-medium">Title</label>
                <input
                  type="text"
                  value={diaryTitle}
                  onChange={(e) => setDiaryTitle(e.target.value)}
                  placeholder="e.g. Thoughts after our phone call"
                  className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-rose-300 font-medium">Mood</label>
                <select
                  value={diaryMood}
                  onChange={(e) => setDiaryMood(e.target.value)}
                  className="w-full bg-[#1b0f30] border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                >
                  <option value="grateful">Grateful & Blessed ✨</option>
                  <option value="madly-in-love">Madly in Love 🥰</option>
                  <option value="missing-you">Longing & Missing You 🥺</option>
                  <option value="excited">Excited For Tomorrow 🎉</option>
                  <option value="peaceful">Peaceful & Warm ☕</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-rose-300 font-medium">Journal Content</label>
                <textarea
                  rows={5}
                  value={diaryContent}
                  onChange={(e) => setDiaryContent(e.target.value)}
                  placeholder="Pour your heart out. Only your sweetheart can read this."
                  className="w-full bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400 resize-none font-serif leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lockDiary"
                  checked={diaryLocked}
                  onChange={(e) => setDiaryLocked(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-400"
                />
                <label htmlFor="lockDiary" className="text-rose-200 cursor-pointer">
                  Protect with app passcode
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowAddDiaryModal(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-rose-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiary}
                disabled={!diaryTitle.trim() || !diaryContent.trim()}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-xs font-semibold text-white shadow-lg shadow-rose-500/30 disabled:opacity-50"
              >
                Save To Journal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
