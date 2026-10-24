export interface AvatarOption {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  borderColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'avatar-aalu',
    name: 'Aalu',
    icon: '🥔',
    gradient: 'from-amber-400 via-rose-400 to-pink-500',
    borderColor: 'border-amber-300',
  },
  {
    id: 'avatar-petu',
    name: 'Petu',
    icon: '🧸',
    gradient: 'from-rose-500 via-pink-500 to-purple-600',
    borderColor: 'border-rose-400',
  },
  {
    id: 'avatar-1',
    name: 'Rose Starlight',
    icon: '✨',
    gradient: 'from-pink-500 via-rose-500 to-purple-600',
    borderColor: 'border-rose-400',
  },
  {
    id: 'avatar-2',
    name: 'Cosmic Violet',
    icon: '🌙',
    gradient: 'from-purple-600 via-indigo-600 to-pink-500',
    borderColor: 'border-purple-400',
  },
  {
    id: 'avatar-3',
    name: 'Warm Velvet',
    icon: '🧸',
    gradient: 'from-amber-500 via-rose-500 to-red-600',
    borderColor: 'border-amber-400',
  },
  {
    id: 'avatar-4',
    name: 'Midnight Bloom',
    icon: '🌸',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-400',
    borderColor: 'border-pink-400',
  },
  {
    id: 'avatar-5',
    name: 'Sun & Ocean',
    icon: '🌊',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
    borderColor: 'border-cyan-400',
  },
  {
    id: 'avatar-6',
    name: 'Eternal Flame',
    icon: '🔥',
    gradient: 'from-red-500 via-orange-500 to-amber-500',
    borderColor: 'border-red-400',
  },
];

export function getAvatarDetails(avatarId: string): AvatarOption {
  return (
    AVATAR_OPTIONS.find((a) => a.id === avatarId) || {
      id: 'custom',
      name: 'Custom',
      icon: '❤️',
      gradient: 'from-pink-500 to-purple-600',
      borderColor: 'border-pink-400',
    }
  );
}

export const MOOD_OPTIONS = [
  { id: 'in-love', label: 'Madly In Love', emoji: '🥰' },
  { id: 'missing-you', label: 'Missing You', emoji: '🥺' },
  { id: 'happy', label: 'Super Happy', emoji: '✨' },
  { id: 'need-hug', label: 'Need A Warm Hug', emoji: '🤗' },
  { id: 'cozy', label: 'Warm & Cozy', emoji: '☕' },
  { id: 'sleepy', label: 'Sleepy / Cuddle Time', emoji: '😴' },
  { id: 'excited', label: 'Excited For Us', emoji: '🎉' },
];
