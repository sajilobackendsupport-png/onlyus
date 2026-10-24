import React from 'react';
import { MessageCircleHeart, BookHeart, Sparkles, Settings } from 'lucide-react';

export type ActiveTab = 'chat' | 'memories' | 'hub' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  unreadCount = 0,
}) => {
  const tabs = [
    {
      id: 'chat' as ActiveTab,
      label: 'OnlyUs Chat',
      shortLabel: 'Chat',
      icon: MessageCircleHeart,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'hub' as ActiveTab,
      label: 'Love Hub',
      shortLabel: 'Love Hub',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'memories' as ActiveTab,
      label: 'Diary & Memories',
      shortLabel: 'Memories',
      icon: BookHeart,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Privacy & Settings',
      shortLabel: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav className="z-30 bg-[#0d0617]/95 backdrop-blur-xl border-t md:border-t-0 md:border-b border-purple-900/30 px-2 py-1.5 md:py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-around md:justify-center md:gap-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-1.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-rose-300 font-semibold md:bg-rose-500/15 md:border md:border-rose-500/30'
                  : 'text-rose-300/60 hover:text-rose-200 hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-rose-400' : ''
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-xs tracking-tight">
                <span className="md:hidden">{tab.shortLabel}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </span>

              {/* Active glowing indicator pill */}
              {isActive && (
                <div className="md:hidden absolute -bottom-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
