export type MessageStatus = 'offline' | 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageType = 'text' | 'image' | 'voice' | 'love_note';

export type UserMood = 'in-love' | 'happy' | 'missing-you' | 'sleepy' | 'cozy' | 'excited' | 'need-hug';

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string; // avatar identifier or custom data url
  statusMessage: string;
  mood: UserMood;
  isOnline: boolean;
  lastSeen: number;
  consentShareOnline: boolean;
}

export interface ReplyPreview {
  id: string;
  text: string;
  senderNickname: string;
  type?: MessageType;
}

export interface Message {
  id: string;
  clientMessageId: string;
  senderId: string;
  senderNickname: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  mediaDuration?: number; // seconds for voice
  replyTo?: ReplyPreview | null;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  status: MessageStatus;
  createdAt: number;
  deliveredAt?: number | null;
  readAt?: number | null;
  scheduledFor?: number | null;
  isDeleted?: boolean;
  deletedFor?: string[];
  retryCount?: number;
  errorMessage?: string;
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  description: string;
  category: 'milestone' | 'date' | 'letter' | 'trip';
  photoUrl?: string;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  authorId: string;
  authorNickname: string;
  title: string;
  content: string;
  mood: string;
  isLocked: boolean;
  createdAt: number;
}

export interface CoupleSession {
  pairCode: string;
  createdAt: number;
  anniversaryDate: string;
  user1: UserProfile;
  user2: UserProfile | null;
  messages: Message[];
  memories: Memory[];
  diaries: DiaryEntry[];
  typingUser: string | null;
  typingTimestamp: number;
}

export interface AppSettings {
  passcode: string | null;
  isLocked: boolean;
  isStealthMode: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "23:00"
  quietHoursEnd: string; // e.g. "07:00"
  activeTheme: 'obsidian-rose' | 'amethyst-night' | 'velvet-ruby' | 'midnight-bloom';
}
