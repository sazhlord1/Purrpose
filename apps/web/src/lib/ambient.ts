/**
 * Bulletproof Ambient & Meow Audio Engine:
 * Direct HTML5 Audio with instant playback, seamless loop, and volume controls:
 * - /audio/rain.mp3 (40% volume)
 * - /audio/purr.mp3 (60% volume)
 * - /audio/meow1.mp3, meow2.mp3, meow3.mp3
 */

class FocusAudioManager {
  private rainAudio: HTMLAudioElement | null = null;
  private purrAudio: HTMLAudioElement | null = null;
  private meowAudios: HTMLAudioElement[] = [];
  private lastMeowTime = 0;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    try {
      this.rainAudio = new Audio('/audio/rain.mp3');
      this.rainAudio.loop = true;
      this.rainAudio.volume = 0.40;
      this.rainAudio.preload = 'auto';

      this.purrAudio = new Audio('/audio/purr.mp3');
      this.purrAudio.loop = true;
      this.purrAudio.volume = 0.60;
      this.purrAudio.preload = 'auto';

      this.meowAudios = [
        new Audio('/audio/meow1.mp3'),
        new Audio('/audio/meow2.mp3'),
        new Audio('/audio/meow3.mp3'),
      ];
      this.meowAudios.forEach(a => {
        a.preload = 'auto';
        a.volume = 0.65;
      });
    } catch (e) {
      console.warn('Audio init warning:', e);
    }
  }

  public playRandomMeow(volume = 0.65) {
    try {
      if (this.meowAudios.length === 0) {
        this.init();
      }
      const idx = Math.floor(Math.random() * this.meowAudios.length);
      const audio = this.meowAudios[idx];
      if (audio) {
        audio.currentTime = 0;
        audio.volume = volume;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(() => {});
        }
      }
      this.lastMeowTime = Date.now();
    } catch {}
  }

  public playOccasionalMeow(cooldownMs = 12000) {
    const now = Date.now();
    if (now - this.lastMeowTime < cooldownMs) return;
    if (Math.random() < 0.65) {
      this.playRandomMeow(0.55 + Math.random() * 0.15);
    }
  }

  public startFocus() {
    if (!this.rainAudio || !this.purrAudio) {
      this.init();
    }

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // 1. Play greeting meow
    this.playRandomMeow(0.70);

    // 2. Play Rain (40% volume)
    if (this.rainAudio) {
      this.rainAudio.volume = 0.40;
      const p = this.rainAudio.play();
      if (p) p.catch(() => {});
    }

    // 3. Play Purr (60% volume)
    if (this.purrAudio) {
      this.purrAudio.volume = 0.60;
      setTimeout(() => {
        if (this.purrAudio) {
          const p = this.purrAudio.play();
          if (p) p.catch(() => {});
        }
      }, 350);
    }
  }

  public pauseFocus() {
    this.playRandomMeow(0.55);
    if (this.purrAudio) {
      this.purrAudio.pause();
    }
  }

  public resumeFocus() {
    this.playRandomMeow(0.60);

    if (this.rainAudio) {
      this.rainAudio.volume = 0.40;
      const p = this.rainAudio.play();
      if (p) p.catch(() => {});
    }

    if (this.purrAudio) {
      this.purrAudio.volume = 0.60;
      setTimeout(() => {
        if (this.purrAudio) {
          const p = this.purrAudio.play();
          if (p) p.catch(() => {});
        }
      }, 350);
    }
  }

  public finishFocus() {
    // Play celebratory meow
    this.playRandomMeow(0.75);

    // Stop purr
    if (this.purrAudio) {
      this.purrAudio.pause();
      this.purrAudio.currentTime = 0;
    }

    // Fade out rain smoothly over 2.5s
    if (this.rainAudio && !this.rainAudio.paused) {
      let vol = this.rainAudio.volume;
      const step = vol / 20;
      this.fadeInterval = setInterval(() => {
        if (!this.rainAudio) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          return;
        }
        vol = Math.max(0, vol - step);
        this.rainAudio.volume = vol;
        if (vol <= 0.02) {
          this.rainAudio.pause();
          this.rainAudio.currentTime = 0;
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
        }
      }, 120);
    }
  }

  public stop() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.rainAudio) {
      this.rainAudio.pause();
      this.rainAudio.currentTime = 0;
    }
    if (this.purrAudio) {
      this.purrAudio.pause();
      this.purrAudio.currentTime = 0;
    }
    this.meowAudios.forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
  }
}

export const ambient = new FocusAudioManager();
