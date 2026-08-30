/**
 * Ambient Audio Engine for Focus Mode:
 * - Supports custom audio files placed in `/public/audio/rain.mp3` and `/public/audio/purr.mp3`
 * - Automatically loops them seamlessly with smooth volume fade in/out
 * - Falls back to procedural Web Audio synthesizer if audio files are not yet loaded
 */

class AmbientAudioEngine {
  // HTML5 Audio elements for user custom mp3 files
  private rainAudio: HTMLAudioElement | null = null;
  private purrAudio: HTMLAudioElement | null = null;
  private customAudioAvailable = { rain: false, purr: false };

  // Web Audio synth fallback nodes
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private purrGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private purrOsc: OscillatorNode | null = null;
  private purrMod: OscillatorNode | null = null;
  private isRunning = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initCustomAudio();
    }
  }

  private initCustomAudio() {
    try {
      this.rainAudio = new Audio('/audio/rain.mp3');
      this.rainAudio.loop = true;
      this.rainAudio.preload = 'auto';

      this.purrAudio = new Audio('/audio/purr.mp3');
      this.purrAudio.loop = true;
      this.purrAudio.preload = 'auto';
    } catch {}
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private createRainBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastLeft = 0;
    let lastRight = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      lastLeft = (lastLeft + 0.04 * whiteL) / 1.04;
      lastRight = (lastRight + 0.04 * whiteR) / 1.04;

      const dropL = Math.random() < 0.003 ? (Math.random() * 0.3 - 0.15) : 0;
      const dropR = Math.random() < 0.003 ? (Math.random() * 0.3 - 0.15) : 0;

      left[i] = (lastLeft * 3.2 + dropL);
      right[i] = (lastRight * 3.2 + dropR);
    }

    return buffer;
  }

  public start(opts: { rain?: boolean; purr?: boolean; rainVol?: number; purrVol?: number } = {}) {
    this.stop(0.1);

    const rainVol = opts.rainVol ?? 0.45;
    const purrVol = opts.purrVol ?? 0.55;

    // 1. Try playing custom audio files if available
    let rainCustomPlayed = false;
    let purrCustomPlayed = false;

    if (this.rainAudio && opts.rain !== false) {
      this.rainAudio.volume = rainVol;
      this.rainAudio.currentTime = 0;
      this.rainAudio.play().then(() => {
        rainCustomPlayed = true;
      }).catch(() => {
        // file not found or autoplay blocked, fallback to Web Audio
      });
    }

    if (this.purrAudio && opts.purr !== false) {
      this.purrAudio.volume = purrVol;
      this.purrAudio.currentTime = 0;
      this.purrAudio.play().then(() => {
        purrCustomPlayed = true;
      }).catch(() => {
        // file not found, fallback to Web Audio
      });
    }

    // 2. Start Web Audio Engine (synthesizer / ambient fallback)
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(1, now + 1.0);
    this.masterGain.connect(this.ctx.destination);

    // Fallback Rain Synth
    if (opts.rain !== false && !rainCustomPlayed) {
      const rainBuffer = this.createRainBuffer(this.ctx);
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = rainBuffer;
      this.rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1050, now);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, now);
      this.rainGain.gain.linearRampToValueAtTime(rainVol, now + 1.5);

      this.rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      this.rainSource.start();
    }

    // Fallback Purr Synth
    if (opts.purr !== false && !purrCustomPlayed) {
      this.purrOsc = this.ctx.createOscillator();
      this.purrOsc.type = 'triangle';
      this.purrOsc.frequency.setValueAtTime(28, now);

      this.purrMod = this.ctx.createOscillator();
      this.purrMod.type = 'sine';
      this.purrMod.frequency.setValueAtTime(24, now);

      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(0.7, now);

      const purrFilter = this.ctx.createBiquadFilter();
      purrFilter.type = 'lowpass';
      purrFilter.frequency.setValueAtTime(180, now);

      this.purrGain = this.ctx.createGain();
      this.purrGain.gain.setValueAtTime(0, now);
      this.purrGain.gain.linearRampToValueAtTime(purrVol, now + 1.8);

      this.purrMod.connect(modGain);
      modGain.connect(this.purrGain.gain);

      this.purrOsc.connect(purrFilter);
      purrFilter.connect(this.purrGain);
      this.purrGain.connect(this.masterGain);

      this.purrOsc.start();
      this.purrMod.start();
    }

    this.isRunning = true;
  }

  public setPurrActive(active: boolean, fadeTime = 1.0) {
    // Custom audio volume fade
    if (this.purrAudio) {
      if (active) {
        this.purrAudio.play().catch(() => {});
        this.purrAudio.volume = 0.55;
      } else {
        this.purrAudio.pause();
      }
    }
    // Web Audio fallback fade
    if (this.ctx && this.purrGain) {
      const now = this.ctx.currentTime;
      const target = active ? 0.45 : 0;
      this.purrGain.gain.cancelScheduledValues(now);
      this.purrGain.gain.linearRampToValueAtTime(target, now + fadeTime);
    }
  }

  public setRainActive(active: boolean, fadeTime = 2.5) {
    if (this.rainAudio) {
      if (active) {
        this.rainAudio.play().catch(() => {});
        this.rainAudio.volume = 0.45;
      } else {
        let vol = this.rainAudio.volume;
        const fadeStep = vol / 20;
        const fadeInterval = setInterval(() => {
          if (!this.rainAudio) return clearInterval(fadeInterval);
          vol = Math.max(0, vol - fadeStep);
          this.rainAudio.volume = vol;
          if (vol <= 0.02) {
            this.rainAudio.pause();
            clearInterval(fadeInterval);
          }
        }, 100);
      }
    }
    if (this.ctx && this.rainGain) {
      const now = this.ctx.currentTime;
      const target = active ? 0.35 : 0;
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(target, now + fadeTime);
    }
  }

  public stop(fadeTime = 0.5) {
    if (this.rainAudio) {
      try {
        this.rainAudio.pause();
        this.rainAudio.currentTime = 0;
      } catch {}
    }
    if (this.purrAudio) {
      try {
        this.purrAudio.pause();
        this.purrAudio.currentTime = 0;
      } catch {}
    }

    if (!this.ctx || !this.masterGain || !this.isRunning) return;
    const now = this.ctx.currentTime;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + fadeTime);

    setTimeout(() => {
      try {
        this.rainSource?.stop();
        this.purrOsc?.stop();
        this.purrMod?.stop();
        this.rainSource?.disconnect();
        this.purrOsc?.disconnect();
        this.purrMod?.disconnect();
      } catch {}
      this.isRunning = false;
    }, fadeTime * 1000 + 50);
  }
}

export const ambientAudio = new AmbientAudioEngine();
