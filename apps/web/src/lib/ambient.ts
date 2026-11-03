/**
 * Focus Room and meow audio:
 * - rain (/audio/rain.mp3) and purr (/audio/purr.mp3) loop with no gap: they are decoded with
 *   Web Audio, the encoder's silent padding is trimmed, and the end is crossfaded into the start,
 *   so the loop point can't be heard (an <audio loop> stops for a moment at every repeat);
 * - meows (/audio/meow1-3.mp3) are short one-shots played with plain <audio>.
 */

type Ctx = AudioContext;

let sharedCtx: Ctx | null = null;
/** One AudioContext for the app, created on first use (it must start from a tap to play). */
function audioCtx(): Ctx | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      sharedCtx = new AC();
    } catch {
      return null;
    }
  }
  if (sharedCtx.state === 'suspended') void sharedCtx.resume().catch(() => undefined);
  return sharedCtx;
}

/**
 * Makes a buffer that loops seamlessly: trims near-silent edges (mp3 padding), then blends
 * the last `xfade` seconds into the first ones with an equal-power crossfade.
 */
export function makeSeamless(ctx: Ctx, input: AudioBuffer, xfadeSec = 1.2): AudioBuffer {
  const rate = input.sampleRate;
  const chans = Array.from({ length: input.numberOfChannels }, (_, c) => input.getChannelData(c));
  const loud = (i: number) => chans.some(d => Math.abs(d[i] ?? 0) > 0.002);
  let a = 0;
  let b = input.length - 1;
  while (a < b && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  const len = b - a + 1;
  const x = Math.max(1, Math.min(Math.floor(xfadeSec * rate), Math.floor(len / 3)));
  const outLen = len - x;
  if (outLen < rate * 0.5) return input; // too short to treat; loop as is
  const out = ctx.createBuffer(input.numberOfChannels, outLen, rate);
  for (let c = 0; c < chans.length; c++) {
    const src = chans[c]!;
    const dst = out.getChannelData(c);
    for (let i = 0; i < outLen; i++) {
      if (i < x) {
        const t = i / x;
        // Start of the loop = the tail fading out over the head fading in.
        dst[i] = src[a + i]! * Math.sin((t * Math.PI) / 2) + src[a + outLen + i]! * Math.cos((t * Math.PI) / 2);
      } else {
        dst[i] = src[a + i]!;
      }
    }
  }
  return out;
}

/** A gapless looping sound with fades. */
class SeamlessLoop {
  private buffer: Promise<AudioBuffer | null> | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  /** Bumped on every play/stop, so a slow load can't start a sound that was stopped meanwhile. */
  private token = 0;

  constructor(private readonly url: string) {}

  private load(ctx: Ctx): Promise<AudioBuffer | null> {
    this.buffer ??= fetch(this.url)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then(data => ctx.decodeAudioData(data))
      .then(buf => makeSeamless(ctx, buf))
      .catch(() => {
        this.buffer = null; // try again next time
        return null;
      });
    return this.buffer;
  }

  /** Warm up (download + decode) so pressing Start plays at once. */
  preload(): void {
    const ctx = audioCtx();
    if (ctx) void this.load(ctx);
  }

  get playing(): boolean {
    return this.src !== null;
  }

  async play(volume: number, fadeSec = 0.8): Promise<void> {
    const ctx = audioCtx();
    if (!ctx) return;
    const token = ++this.token;
    if (this.src && this.gain) {
      this.gain.gain.cancelScheduledValues(ctx.currentTime);
      this.gain.gain.setValueAtTime(this.gain.gain.value, ctx.currentTime);
      this.gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeSec);
      return;
    }
    const buf = await this.load(ctx);
    if (!buf || token !== this.token) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeSec);
    gain.connect(ctx.destination);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(gain);
    src.start();
    this.src = src;
    this.gain = gain;
  }

  stop(fadeSec = 0.3): void {
    this.token++;
    const ctx = sharedCtx;
    const src = this.src;
    const gain = this.gain;
    this.src = null;
    this.gain = null;
    if (!ctx || !src || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeSec);
    try {
      src.stop(now + fadeSec + 0.05);
    } catch {
      /* already stopped */
    }
    setTimeout(() => {
      try {
        src.disconnect();
        gain.disconnect();
      } catch {
        /* gone */
      }
    }, (fadeSec + 0.2) * 1000);
  }
}

const RAIN_VOLUME = 0.4;
const PURR_VOLUME = 0.6;

class FocusAudioManager {
  private rain = new SeamlessLoop('/audio/rain.mp3');
  private purr = new SeamlessLoop('/audio/purr.mp3');
  private meowAudios: HTMLAudioElement[] = [];
  private lastMeowTime = 0;
  private purrTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') this.initMeows();
  }

  private initMeows() {
    try {
      this.meowAudios = ['/audio/meow1.mp3', '/audio/meow2.mp3', '/audio/meow3.mp3'].map(url => {
        const a = new Audio(url);
        a.preload = 'auto';
        a.volume = 0.65;
        return a;
      });
    } catch {
      this.meowAudios = [];
    }
  }

  /** Start downloading the loops (call when the Focus Room opens). */
  public preloadFocus() {
    this.rain.preload();
    this.purr.preload();
  }

  public playRandomMeow(volume = 0.65) {
    try {
      if (this.meowAudios.length === 0) this.initMeows();
      const audio = this.meowAudios[Math.floor(Math.random() * this.meowAudios.length)];
      if (audio) {
        audio.currentTime = 0;
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play()?.catch(() => {});
      }
      this.lastMeowTime = Date.now();
    } catch {
      /* no audio here */
    }
  }

  public playOccasionalMeow(cooldownMs = 12000) {
    const now = Date.now();
    if (now - this.lastMeowTime < cooldownMs) return;
    if (Math.random() < 0.65) this.playRandomMeow(0.55 + Math.random() * 0.15);
  }

  private startPurrSoon() {
    if (this.purrTimer) clearTimeout(this.purrTimer);
    this.purrTimer = setTimeout(() => void this.purr.play(PURR_VOLUME, 1.2), 350);
  }

  public startFocus() {
    audioCtx(); // created inside the tap that started the session
    this.playRandomMeow(0.7);
    void this.rain.play(RAIN_VOLUME, 1.0);
    this.startPurrSoon();
  }

  public pauseFocus() {
    this.playRandomMeow(0.55);
    if (this.purrTimer) clearTimeout(this.purrTimer);
    this.purr.stop(0.6);
  }

  public resumeFocus() {
    audioCtx();
    this.playRandomMeow(0.6);
    void this.rain.play(RAIN_VOLUME, 0.8);
    this.startPurrSoon();
  }

  public finishFocus() {
    this.playRandomMeow(0.75);
    if (this.purrTimer) clearTimeout(this.purrTimer);
    this.purr.stop(0.4);
    this.rain.stop(2.5); // rain fades out slowly
  }

  public stop() {
    if (this.purrTimer) clearTimeout(this.purrTimer);
    this.rain.stop(0.3);
    this.purr.stop(0.3);
    this.meowAudios.forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
  }
}

export const ambient = new FocusAudioManager();
