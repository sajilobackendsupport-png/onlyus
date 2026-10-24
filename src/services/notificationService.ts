/**
 * Web Notification Service for Karsh.
 * Notifies the recipient when a new message arrives on Android or desktop,
 * even when the tab is in background or minimized.
 */

class NotificationService {
  private hasPermission = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch {
      return false;
    }
  }

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  get permission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  notifyNewMessage(senderNickname: string, text: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Only notify if app is in background or tab is not focused
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      return;
    }

    try {
      const notification = new Notification(`Karsh — Love note from ${senderNickname}`, {
        body: text || 'Sent a romantic message 💕',
        icon: '/favicon.ico',
        tag: 'karsh-new-message',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Notification display failed:', e);
    }
  }
}

export const notificationService = new NotificationService();
