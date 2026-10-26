import { Message, AppSettings, CoupleSession } from '../types';

const DB_NAME = 'OnlyUsDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'offline_queue';
const CACHE_STORE = 'cached_messages';
const KEYVAL_STORE = 'keyval';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private onlineListeners: Array<(online: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineStatus = true;
        this.notifyOnlineStatus(true);
      });
      window.addEventListener('offline', () => {
        this.isOnlineStatus = false;
        this.notifyOnlineStatus(false);
      });
    }
  }

  public get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : this.isOnlineStatus;
  }

  public onOnlineChange(callback: (online: boolean) => void): () => void {
    this.onlineListeners.push(callback);
    return () => {
      this.onlineListeners = this.onlineListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyOnlineStatus(online: boolean) {
    this.onlineListeners.forEach((cb) => cb(online));
  }

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'clientMessageId' });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(KEYVAL_STORE)) {
          db.createObjectStore(KEYVAL_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Offline Queue ---
  async enqueueOfflineMessage(message: Message): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.put(message);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      const queue = this.getFallbackQueue();
      const idx = queue.findIndex((m) => m.clientMessageId === message.clientMessageId);
      if (idx >= 0) queue[idx] = message;
      else queue.push(message);
      localStorage.setItem('onlyus_offline_queue', JSON.stringify(queue));
    }
  }

  async getOfflineQueue(): Promise<Message[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.getFallbackQueue();
    }
  }

  async removeFromOfflineQueue(clientMessageId: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.delete(clientMessageId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const queue = this.getFallbackQueue().filter((m) => m.clientMessageId !== clientMessageId);
      localStorage.setItem('onlyus_offline_queue', JSON.stringify(queue));
    }
  }

  private getFallbackQueue(): Message[] {
    try {
      const item = localStorage.getItem('onlyus_offline_queue');
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  // --- Cache Messages ---
  async saveCachedMessages(messages: Message[]): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      const store = tx.objectStore(CACHE_STORE);
      store.clear();
      messages.forEach((m) => store.put(m));
    } catch {
      try {
        localStorage.setItem('onlyus_cached_messages', JSON.stringify(messages.slice(-100)));
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }

  async getCachedMessages(): Promise<Message[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(CACHE_STORE, 'readonly');
        const store = tx.objectStore(CACHE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      try {
        const cached = localStorage.getItem('onlyus_cached_messages');
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  }

  // --- Draft Storage ---
  saveDraft(pairCode: string, draft: string) {
    try {
      localStorage.setItem(`onlyus_draft_${pairCode}`, draft);
    } catch {}
  }

  getDraft(pairCode: string): string {
    try {
      return localStorage.getItem(`onlyus_draft_${pairCode}`) || '';
    } catch {
      return '';
    }
  }

  // --- Settings & Auth Session Storage ---
  saveAppSettings(settings: AppSettings) {
    try {
      localStorage.setItem('onlyus_settings', JSON.stringify(settings));
    } catch {}
  }

  getAppSettings(): AppSettings {
    const defaultSettings: AppSettings = {
      passcode: null,
      isLocked: false,
      isStealthMode: false,
      soundEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
      activeTheme: 'obsidian-rose',
      smtpHost: 'smtp.host.com',
      smtpPort: '587',
      smtpUsername: '',
      smtpPassword: '',
      smtpSecurity: 'starttls',
    };
    try {
      const stored = localStorage.getItem('onlyus_settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  saveSessionData(session: CoupleSession, currentUserId: string) {
    try {
      localStorage.setItem('onlyus_session', JSON.stringify({ session, currentUserId }));
    } catch {}
  }

  getSavedSession(): { session: CoupleSession | null; currentUserId: string | null } {
    try {
      const data = localStorage.getItem('onlyus_session');
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return { session: null, currentUserId: null };
  }

  clearAllData() {
    try {
      localStorage.clear();
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase(DB_NAME);
      }
    } catch {}
  }
}

export const storageService = new StorageService();
