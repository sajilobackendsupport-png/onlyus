/**
 * Synthesizes romantic, warm auditory feedback using Web Audio API.
 * Works seamlessly offline without external asset downloads.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Check if current time falls within quiet hours
  private isQuietHours(start = '23:00', end = '07:00'): boolean {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMins = startH * 60 + (startM || 0);
    const endMins = endH * 60 + (endM || 0);

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins <= endMins;
    } else {
      // Over midnight (e.g. 23:00 to 07:00)
      return currentMins >= startMins || currentMins <= endMins;
    }
  }

  // Sent message pop
  playSent(soundEnabled = true, quietHoursEnabled = false, start?: string, end?: string) {
    if (!soundEnabled) return;
    if (quietHoursEnabled && this.isQuietHours(start, end)) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio might be blocked until user gesture
    }
  }

  // Celestial romantic chime when incoming message is received
  playReceived(soundEnabled = true, quietHoursEnabled = false, start?: string, end?: string) {
    if (!soundEnabled) return;
    if (quietHoursEnabled && this.isQuietHours(start, end)) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5 (Romantic D-major chord)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.09, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch {
      // Audio error suppressed
    }
  }

  // Sparkle for heart / reaction
  playSparkle(soundEnabled = true) {
    if (!soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [1046.5, 1318.51, 1567.98]; // C6, E6, G6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.26);
      });
    } catch {
      // Audio error suppressed
    }
  }

  // Mic recording start/stop chime
  playMicBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio error suppressed
    }
  }

  playDialTone(): () => void {
    try {
      const ctx = this.getContext();
      if (!ctx) return () => {};

      let isRunning = true;
      const playTone = () => {
        if (!isRunning) return;
        try {
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.setValueAtTime(0.04, now + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.05);
          osc2.stop(now + 1.05);
        } catch {}
      };

      playTone();
      const interval = setInterval(playTone, 3000);

      return () => {
        isRunning = false;
        clearInterval(interval);
      };
    } catch {
      return () => {};
    }
  }

  playRingtone(): () => void {
    try {
      const ctx = this.getContext();
      if (!ctx) return () => {};

      let isRunning = true;
      const playRing = () => {
        if (!isRunning) return;
        try {
          const now = ctx.currentTime;
          for (let i = 0; i < 2; i++) {
            const startTime = now + i * 0.25;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(850, startTime);
            osc.frequency.setValueAtTime(960, startTime + 0.12);

            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.22);
          }
        } catch {}
      };

      playRing();
      const interval = setInterval(playRing, 2500);

      return () => {
        isRunning = false;
        clearInterval(interval);
      };
    } catch {
      return () => {};
    }
  }
}

export const soundService = new SoundService();

