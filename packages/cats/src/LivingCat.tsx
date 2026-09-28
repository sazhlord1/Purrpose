import {
  motion,
  useAnimationControls,
} from 'framer-motion';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { CAT_SEED } from '@purrpose/shared';
import { Cat } from './Cat.js';
import type { CatState, Expression } from './poses.js';
import {
  IDLE_TIMING,
  durationFor,
  excludedMacros,
  itemMacros,
  macroCooldownMs,
  mulberry32,
  pickMacro,
  rollSpeech,
  type ActivePhase,
  type ItemBehaviors,
  type MacroName,
} from './engine.js';
import { injectLivingStyle } from './livingCss.js';
import { catName, resolveCatConfig } from './config.js';
import type { CatAction, CatWear } from './FaceKit.js';

/** What each behavior visibly does (FaceKit draws it). Behaviors not listed use pose/eyes only. */
const MACRO_ACTION: Partial<Record<MacroName, CatAction>> = {
  perkUp: 'alert',
  lickLips: 'tongue',
  lookAtClock: 'curious',
  scratch: 'scratchPost', // turned toward the scratcher at its left
  batToy: 'bat',
  playWithYarn: 'bat',
  playPounce: 'bat',
  napOnBed: 'nap',
  bigStretch: 'stretch',
  stretch: 'stretch',
  yawn: 'yawn',
  groom: 'lickPaw',
  lickPaw: 'lickPaw',
  sniffBowl: 'lookDownRight', // mirrored when the bowl is on the left (see actionFor)
  inspectBowl: 'lookDownRight',
  inspectCabinet: 'curious',
  pawCabinet: 'pawUp',
  attemptOpenCabinet: 'pawUp',
  dragBowl: 'bat',
  excitedHop: 'alert',
  freeze: 'freeze',
  // Shop items — all done right where the cat sits.
  tossMouse: 'sniff',
  kneadBlanket: 'knead',
  napInBed: 'nap',
  watchFish: 'lookRight',
};

/** Everything LivingCat needs to know about the items around it (built by CatScene). */
export interface LivingItems {
  behaviors: ItemBehaviors;
  /** Which way the food bowl is (1 = the cat's right on screen, -1 = left). */
  bowlSide: 1 | -1;
  /** Which side of the cat the toy lies on. */
  toySide?: 1 | -1;
  fishSide?: 1 | -1;
  clockSide?: 1 | -1;
  wear?: CatWear;
  /** A real toy lies by the paw, so the bat action doesn't draw its own yarn. */
  noYarn?: boolean;
}

/** Toy games turn the cat toward wherever you left the toy. */
const TOY_MACROS: ReadonlySet<MacroName> = new Set<MacroName>(['batToy', 'playWithYarn', 'playPounce', 'tossMouse']);

/** Eyes the cat drifts between while idle, per state (mood 0–3), so no stage looks frozen. */
const IDLE_EYES: Partial<Record<CatState, Expression[]>> = {
  INITIAL: ['neutral', 'hopeful', 'neutral', 'happyShut'],
  WAITING: ['hopeful', 'bored', 'neutral', 'bored'],
  ANTICIPATING: ['hopeful', 'stare', 'neutral', 'hopeful'],
  VERY_CLOSE: ['stare', 'hopeful', 'stare', 'neutral'],
  SATISFIED: ['happyShut', 'happyShut', 'neutral', 'happyShut'],
};

const ACTIVE_PHASES: ActivePhase[] = ['INITIAL', 'WAITING', 'ANTICIPATING', 'VERY_CLOSE'];

export interface LivingCatHandle {
  play: (name: MacroName) => void;
  playScript: (script: 'SUCCESS' | 'FAILURE') => void;
  /** You tapped the cat: a short happy reaction. */
  pet: () => void;
  /** You're holding a toy: eyes locked on it. */
  watch: (on: boolean) => void;
  /** You dropped a toy: swat it if it's within reach, otherwise a curious look. */
  toyDropped: (inReach: boolean, side: 1 | -1) => void;
  stop: () => void;
}

export interface LivingCatProps {
  catId: CatId;
  state: CatState;
  seed: number;
  speed?: number;
  paused?: boolean;
  reduced?: boolean;
  onEvent?: (event: string) => void;
  speech?: string | null;
  items?: LivingItems;
}

function wait(seconds: number, speed: number): Promise<void> {
  return new Promise(r => setTimeout(r, (seconds * 1000) / speed));
}

export const LivingCat = forwardRef<LivingCatHandle, LivingCatProps>(function LivingCat(
  { catId, state, seed, speed = 1, paused = false, reduced = false, onEvent, speech, items },
  ref,
) {
  const config = resolveCatConfig(catId);
  const controls = useAnimationControls();
  const speedRef = useRef(speed);
  speedRef.current = speed;
  // Read through a ref so equipping an item never restarts the behavior loop.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  /** -1 while the cat turns to its left (to scratch the post there). */
  const [facing, setFacing] = useState<1 | -1>(1);

  const [displayState, setDisplayState] = useState<CatState>(state);
  const [headTilt, setHeadTilt] = useState<-1 | 0 | 1>(0);
  const [action, setAction] = useState<CatAction | null>(null);
  const [expression, setExpression] = useState<Expression | null>(null);
  const [flags, setFlags] = useState<{
    blink: boolean;
    halfBlink: boolean;
    earLeft: boolean;
    earRight: boolean;
    earDual: boolean;
    tailFlick: boolean;
    bob: boolean;
    stare: boolean;
    stretch: boolean;
    listenLeft: boolean;
    listenRight: boolean;
  }>({
    blink: false,
    halfBlink: false,
    earLeft: false,
    earRight: false,
    earDual: false,
    tailFlick: false,
    bob: false,
    stare: false,
    stretch: false,
    listenLeft: false,
    listenRight: false,
  });

  const [bubble, setBubble] = useState<string | null>(null);
  const [mood, setMood] = useState(0);
  const scriptDoneRef = useRef<string>('');
  const firstBeatRef = useRef(true);

  useEffect(() => {
    injectLivingStyle();
  }, []);

  useEffect(() => {
    setBubble(typeof speech === 'string' && speech.length > 0 ? speech : null);
  }, [speech]);

  useEffect(() => {
    setDisplayState(state);
    scriptDoneRef.current = '';
  }, [state]);

  useEffect(() => {
    onEvent?.(`display:${displayState}`);
  }, [displayState]);

  useEffect(() => {
    setFlags({
      blink: false,
      halfBlink: false,
      earLeft: false,
      earRight: false,
      earDual: false,
      tailFlick: false,
      bob: false,
      stare: false,
      stretch: false,
      listenLeft: false,
      listenRight: false,
    });
    setHeadTilt(0);
    setAction(null);
    setExpression(null);
    firstBeatRef.current = displayState === 'INITIAL';
  }, [displayState]);

  const setFlag = (k: keyof typeof flags, on: boolean) => setFlags(f => ({ ...f, [k]: on }));

  const bubbleFor = (text: string, ms?: number) => {
    const duration = ms ?? Math.max(4800, text.length * 90);
    setBubble(text);
    onEvent?.(`speech:"${text}"`);
    setTimeout(() => setBubble(b => (b === text ? null : b)), duration / speedRef.current);
  };

  async function hop(): Promise<void> {
    await controls.start({
      y: [0, -14, 0, -8, 0],
      transition: { duration: 0.7 / speedRef.current, times: [0, 0.3, 0.55, 0.78, 1] },
    });
    await controls.set({ y: 0, x: 0 });
  }

  /** Direction-aware actions: look toward where the thing actually is. */
  function actionFor(name: MacroName): CatAction | null {
    const it = itemsRef.current;
    if ((name === 'sniffBowl' || name === 'inspectBowl') && it?.bowlSide === -1) return 'lookDownLeft';
    if (name === 'watchFish' && it?.fishSide === -1) return 'lookLeft';
    return MACRO_ACTION[name] ?? null;
  }

  async function runMacro(name: MacroName): Promise<void> {
    const sp = speedRef.current;
    onEvent?.(`macro:${name}`);
    setAction(actionFor(name));
    const toyGame = TOY_MACROS.has(name);
    if (toyGame) setFacing(itemsRef.current?.toySide ?? 1);
    try {
      await runMacroBody(name, sp);
    } finally {
      setAction(null);
      if (toyGame) setFacing(1);
    }
  }

  async function runMacroBody(name: MacroName, sp: number): Promise<void> {

    switch (name) {
      case 'perkUp':
        await hop();
        setFlags(f => ({ ...f, earDual: true }));
        await wait(0.9, sp);
        setFlags(f => ({ ...f, earDual: false }));
        break;
      case 'lickLips':
        await wait(1.4, sp);
        break;
      case 'sit':
        setHeadTilt(0);
        await wait(1.2, sp);
        break;
      case 'shiftWeight':
        await controls.start({ x: [0, 3, -3, 0], transition: { duration: 0.9 / sp } });
        break;
      case 'lookAround':
        setHeadTilt(-1);
        setAction('lookLeft');
        await wait(0.7, sp);
        setHeadTilt(1);
        setAction('lookRight');
        await wait(0.7, sp);
        setHeadTilt(0);
        setAction(null);
        await wait(0.3, sp);
        break;
      case 'lookAtUser':
      case 'lookAtClock':
        setHeadTilt(name === 'lookAtClock' ? 1 : -1);
        if (name === 'lookAtUser') setExpression('hopeful');
        else if (itemsRef.current?.clockSide) {
          // There's a real clock on the wall: look up toward it.
          setHeadTilt(-1);
          setAction(itemsRef.current.clockSide === 1 ? 'lookRight' : 'lookLeft');
        } else setAction('lookUp');
        await wait(1.4, sp);
        setHeadTilt(0);
        setExpression(null);
        break;
      // Paw actions: timings follow the CSS loops in FaceKit (scratch 0.8s, bat 1.2s per swing),
      // so every action shows complete, readable swings instead of a flicker.
      case 'scratch':
        // Turn to the scratcher standing at its left and rake it with the paw.
        setFacing(-1);
        for (let i = 0; i < 3; i++) {
          onEvent?.('scratcher:shake');
          await wait(0.8, sp);
        }
        setFacing(1);
        break;
      case 'batToy':
        setExpression('stare');
        for (let i = 0; i < 2; i++) {
          await wait(0.6, sp);
          onEvent?.('toy:shake'); // the strike lands mid-swing
          await wait(0.6, sp);
        }
        setExpression(null);
        break;
      case 'playWithYarn':
        setExpression('hopeful');
        for (let i = 0; i < 3; i++) {
          await wait(0.6, sp);
          onEvent?.('toy:shake');
          await wait(0.6, sp);
        }
        setExpression(null);
        break;
      case 'playPounce':
        // Crouch and wiggle, pounce, then pin the yarn with a paw.
        setAction('freeze');
        setHeadTilt(1);
        setFlags(f => ({ ...f, tailFlick: true }));
        await wait(0.9, sp);
        setFlags(f => ({ ...f, tailFlick: false }));
        setAction('alert');
        await hop();
        setAction('bat');
        onEvent?.('toy:shake');
        await wait(1.2, sp);
        setHeadTilt(0);
        break;
      case 'napOnBed':
        setHeadTilt(1);
        setExpression('sleep');
        await wait(1.8, sp);
        setExpression(null);
        setFlag('stretch', true);
        await wait(0.8, sp);
        setFlag('stretch', false);
        setHeadTilt(0);
        break;
      case 'bigStretch':
        setHeadTilt(-1);
        setFlag('stretch', true);
        await wait(1.6, sp);
        setFlag('stretch', false);
        setHeadTilt(0);
        await wait(0.4, sp);
        break;
      case 'yawn':
        setHeadTilt(-1);
        setExpression('sleep');
        await wait(2.0, sp);
        setExpression(null);
        setHeadTilt(0);
        break;
      case 'stretch':
        setFlag('stretch', true);
        await wait(1.5, sp);
        setFlag('stretch', false);
        break;
      case 'groom':
      case 'lickPaw':
        setHeadTilt(1);
        await wait(2.4, sp);
        setHeadTilt(0);
        break;
      case 'sniffBowl':
      case 'inspectBowl':
        // Head dips toward the bowl and the eyes stay on it (see actionFor), a lick of the lips, one more look.
        await wait(1.3, sp);
        setAction('tongue');
        await wait(0.6, sp);
        setAction(actionFor(name));
        await wait(0.6, sp);
        break;
      case 'inspectCabinet':
        setHeadTilt(-1);
        await wait(1.8, sp);
        setHeadTilt(0);
        break;
      case 'pawCabinet':
        // tap-tap-tap (0.55s per tap in CSS)
        for (let i = 0; i < 4; i++) {
          onEvent?.('cabinet:shake');
          await wait(0.55, sp);
        }
        break;
      case 'attemptOpenCabinet':
        onEvent?.('cabinet:crack');
        await wait(1.4, sp);
        onEvent?.('cabinet:close');
        setAction('curious');
        await wait(0.8, sp);
        break;
      case 'dragBowl':
        onEvent?.('bowl:drag');
        await Promise.all([
          controls.start({
            x: [0, -7, -7, 0],
            transition: { duration: 1.6 / sp, times: [0, 0.4, 0.7, 1] },
          }),
          wait(1.6, sp),
        ]);
        break;
      case 'excitedHop':
        await hop();
        await hop();
        await wait(0.5, sp);
        break;
      case 'stareAtUser':
        setFlag('stare', true);
        setExpression('stare');
        await wait(2.2, sp);
        setFlag('stare', false);
        setExpression(null);
        break;
      case 'freeze':
        await wait(1.3, sp);
        break;

      // ── Shop items ──────────────────────────────────────────────────────
      case 'tossMouse':
        setHeadTilt(1);
        await wait(1.0, sp); // suspicious sniff
        setHeadTilt(0);
        setAction('bat');
        await wait(0.6, sp);
        onEvent?.('toy:shake'); // flick — the mouse flies
        await wait(0.6, sp);
        setAction('alert');
        await hop();
        break;
      case 'kneadBlanket':
        await wait(2.6, sp);
        break;
      case 'napInBed':
        // It is already sitting in the bed: doze off, then stretch awake.
        setExpression('sleep');
        await wait(3.2, sp);
        setExpression(null);
        setAction('stretch');
        await wait(0.8, sp);
        break;
      case 'watchFish':
        // Stares at the tank from where it sits, tail twitching.
        setExpression('stare');
        setFlags(f => ({ ...f, tailFlick: true }));
        await wait(1.2, sp);
        setFlags(f => ({ ...f, tailFlick: false }));
        await wait(1.0, sp);
        setExpression(null);
        break;
      default:
        await wait(1, sp);
    }
  }

  useImperativeHandle(ref, () => ({
    play: (name: MacroName) => {
      void runMacro(name);
    },
    playScript: (script: 'SUCCESS' | 'FAILURE') => {
      void runTerminalScript(script);
    },
    pet: () => {
      void petReaction();
    },
    watch: (on: boolean) => {
      setExpression(on ? 'stare' : null);
      setAction(on ? 'alert' : null);
    },
    toyDropped: (inReach: boolean, side: 1 | -1) => {
      void toyReaction(inReach, side);
    },
    stop: () => controls.stop(),
  }));

  const pettingRef = useRef(false);
  /** Tap → eyes shut, hearts, a little hop, then back to whatever it was doing. */
  async function petReaction(): Promise<void> {
    if (pettingRef.current) return;
    pettingRef.current = true;
    const sp = speedRef.current;
    onEvent?.('pet');
    setAction('loved');
    setHeadTilt(1);
    await wait(0.5, sp);
    await hop();
    await wait(0.9, sp);
    setHeadTilt(0);
    setAction(null);
    pettingRef.current = false;
  }

  async function toyReaction(inReach: boolean, side: 1 | -1): Promise<void> {
    const sp = speedRef.current;
    if (inReach) {
      // It lands by its paw: one swat and the toy skitters a little further.
      setFacing(side);
      setExpression('stare');
      setAction('bat');
      await wait(0.55, sp);
      onEvent?.('toy:swat');
      await wait(0.7, sp);
      setFacing(1);
    } else {
      setAction(side === 1 ? 'lookRight' : 'lookLeft');
      setExpression('hopeful');
      await wait(0.6, sp);
      setAction('curious');
      await wait(1.0, sp);
    }
    setAction(null);
    setExpression(null);
  }

  async function runTerminalScript(script: 'SUCCESS' | 'FAILURE'): Promise<void> {
    const sp = speedRef.current;
    setFacing(1);
    onEvent?.(`script:${script}`);
    if (script === 'SUCCESS') {
      // Freeze in disbelief → sad sigh → give up and go to sleep.
      setAction('freeze');
      await wait(0.6, sp);
      setAction('sigh');
      setExpression('sad');
      setHeadTilt(1);
      await wait(0.5, sp);
      setHeadTilt(-1);
      await wait(0.4, sp);
      setHeadTilt(0);
      bubbleFor(config.quirks.loseLine, 5000);
      await wait(2.0, sp);
      setAction(null);
      setExpression(null);
      setDisplayState('SLEEPING');
    } else {
      // "I KNEW IT" → dash for the food → three happy bites → victory hops.
      setAction('alert');
      await wait(0.35, sp);
      onEvent?.('cabinet:crack');
      await wait(0.3, sp);
      onEvent?.('cabinet:close');
      setAction('feast');
      for (let i = 0; i < 3; i++) {
        setHeadTilt(1);
        await wait(0.34, sp);
        setHeadTilt(0);
        await wait(0.2, sp);
      }
      setAction('tongue');
      await hop();
      await hop();
      bubbleFor(config.quirks.winLine, 5000);
      await wait(2.0, sp);
      setAction(null);
      setDisplayState('SATISFIED');
    }
    onEvent?.('script:done');
  }

  // Every few seconds the face drifts to another variant (tongue in/out, mouth open/shut, eyes).
  useEffect(() => {
    if (reduced || paused) return undefined;
    let timer = 0;
    const next = () => {
      timer = window.setTimeout(() => {
        setMood(m => (m + 1 + Math.floor(Math.random() * 3)) % 4);
        next();
      }, (4500 + Math.random() * 4500) / speedRef.current);
    };
    next();
    return () => window.clearTimeout(timer);
  }, [reduced, paused]);

  const phase = ACTIVE_PHASES.includes(displayState as ActivePhase)
    ? (displayState as ActivePhase)
    : null;

  useEffect(() => {
    if (reduced || paused || !phase) return undefined;
    let cancelled = false;
    const rng = mulberry32(seed);
    let last: MacroName | undefined;
    const cooldownUntil: Partial<Record<MacroName, number>> = {};
    let clock = 0;

    (async () => {
      await wait(0.8, speedRef.current);
      while (!cancelled) {
        const picked = pickMacro(phase, rng, {
          last,
          cooldownUntil,
          nowMs: clock,
          extra: itemMacros(phase, itemsRef.current?.behaviors),
          exclude: excludedMacros(itemsRef.current?.behaviors),
        });
        clock += 1000;
        if (!picked) {
          await wait(1, speedRef.current);
          continue;
        }
        last = picked.name;
        const dur = durationFor(picked, rng);
        const forced = phase === 'INITIAL' && firstBeatRef.current;
        if (rollSpeech(phase, rng, forced)) {
          if (phase === 'INITIAL') {
            firstBeatRef.current = false;
            bubbleFor(config.quirks.chosenLine, 5200);
          } else if (phase === 'WAITING') {
            const lines = config.quirks.waitingLines;
            bubbleFor(lines[Math.floor(rng() * lines.length) % lines.length], 5000);
          } else {
            const lines = config.quirks.closeLines;
            bubbleFor(lines[Math.floor(rng() * lines.length) % lines.length], 4800);
          }
        }
        await runMacro(picked.name);
        if (cancelled) return;
        if (dur > 0) await wait(dur / 1000, speedRef.current);
        const cd = macroCooldownMs(rng) / 1000;
        cooldownUntil[picked.name] = clock + cd * 1000;
        clock += cd * 1000;
        for (let w = 0; w < cd * 10 && !cancelled; w++) {
          await wait(0.1, 1);
        }
      }
    })();

    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [phase, seed, paused, reduced, displayState]);

  // Organic Randomized Blinking with Full, Half, and Double Blinks
  useEffect(() => {
    if (reduced || paused || !phase) return undefined;
    let cancelled = false;
    let timer = 0;
    const schedule = () => {
      const rng = Math.random;
      const delay = (IDLE_TIMING.blinkMinMs + rng() * (IDLE_TIMING.blinkMaxMs - IDLE_TIMING.blinkMinMs)) / speedRef.current;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        const roll = rng();
        if (roll < 0.20) {
          // Lazy gentle half-blink
          setFlags(f => ({ ...f, halfBlink: true }));
          window.setTimeout(() => {
            if (!cancelled) setFlags(f => ({ ...f, halfBlink: false }));
            schedule();
          }, 320);
        } else if (roll < 0.35) {
          // Double rapid blink
          setFlags(f => ({ ...f, blink: true }));
          window.setTimeout(() => {
            setFlags(f => ({ ...f, blink: false }));
            if (!cancelled) {
              window.setTimeout(() => {
                setFlags(f => ({ ...f, blink: true }));
                window.setTimeout(() => {
                  setFlags(f => ({ ...f, blink: false }));
                  schedule();
                }, 160);
              }, 140);
            }
          }, 170);
        } else {
          // Standard natural blink
          setFlags(f => ({ ...f, blink: true }));
          window.setTimeout(() => {
            if (!cancelled) setFlags(f => ({ ...f, blink: false }));
            schedule();
          }, 180);
        }
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, paused, reduced, displayState]);

  // Independent Ear Micro-Twitches (Left / Right / Dual)
  useEffect(() => {
    if (reduced || paused || !phase) return undefined;
    let cancelled = false;
    let timer = 0;
    const scheduleEar = () => {
      const delay = (4500 + Math.random() * 5500) / speedRef.current;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        const roll = Math.random();
        if (roll < 0.4) {
          setFlags(f => ({ ...f, earLeft: true }));
          setTimeout(() => setFlags(f => ({ ...f, earLeft: false })), 360);
        } else if (roll < 0.8) {
          setFlags(f => ({ ...f, earRight: true }));
          setTimeout(() => setFlags(f => ({ ...f, earRight: false })), 360);
        } else {
          setFlags(f => ({ ...f, earDual: true }));
          setTimeout(() => setFlags(f => ({ ...f, earDual: false })), 420);
        }
        scheduleEar();
      }, delay);
    };
    scheduleEar();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, paused, reduced, displayState]);

  useEffect(() => {
    if (reduced) {
      if (state === 'SUCCESS') setDisplayState('SLEEPING');
      if (state === 'FAILURE') setDisplayState('SATISFIED');
    }
  }, [reduced, state]);

  const swayClass =
    !reduced && phase ? (displayState === 'VERY_CLOSE' ? 'lc-swayfast' : 'lc-sway') : '';

  const breatheClass = !reduced && phase && !flags.stare
    ? displayState === 'SLEEPING'
      ? 'lc-breathe-sleeping'
      : (displayState === 'ANTICIPATING' || displayState === 'VERY_CLOSE')
        ? 'lc-breathe-tense'
        : 'lc-breathe'
    : '';

  const rootClass = [
    'purrpose-living',
    swayClass,
    breatheClass,
    flags.blink ? 'lc-blinking' : '',
    flags.halfBlink ? 'lc-halfblink' : '',
    flags.earDual ? 'lc-earflicking' : '',
    flags.earLeft ? 'lc-ear-left-twitch' : '',
    flags.earRight ? 'lc-ear-right-twitch' : '',
    flags.tailFlick ? 'lc-tailflicking' : '',
    flags.bob ? 'lc-bob' : '',
    flags.stare ? 'lc-stare' : '',
    flags.stretch ? 'lc-stretch' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (reduced) {
    return (
      <g transform="translate(-120 -254)">
        <Cat
          catId={catId}
          state={displayState}
          size={240}
          title={`${catName(catId)} — ${displayState.toLowerCase()}`}
          wear={items?.wear}
        />
      </g>
    );
  }

  return (
    <motion.g
      className={rootClass}
      data-living
      data-state={displayState}
      initial={false}
      animate={controls}
    >
      {/* Mirrored when the cat reaches for something on its left. */}
      <g transform={facing === -1 ? 'scale(-1 1)' : undefined}>
        <g transform="translate(-120 -254)">
          <Cat
            catId={catId}
            state={displayState}
            expression={expression ?? undefined}
            headTilt={headTilt}
            action={action}
            size={240}
            wear={items?.wear}
            noYarn={items?.noYarn}
            mood={mood}
            idleExpression={IDLE_EYES[displayState]?.[mood]}
          />
        </g>
      </g>
      {bubble && <SpeechBubble text={bubble} />}
    </motion.g>
  );
});

LivingCat.displayName = 'LivingCat';

/** Splits a line into at most 3 rows of ~26 characters for the speech bubble. */
function wrapBubble(text: string, max = 26): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function SpeechBubble({ text }: { text: string }) {
  const lines = wrapBubble(text);
  const longest = Math.max(...lines.map(l => l.length));
  const w = Math.max(140, Math.min(300, longest * 8.4 + 36));
  const h = 20 * lines.length + 18;
  const mid = w / 2;
  // Outer <g> positions the bubble; the inner <g> carries the pop-in CSS animation.
  // (A CSS transform on the same element would override the SVG position attribute.)
  return (
    <g transform={`translate(${-mid} ${-215 - (lines.length - 1) * 20})`}>
      <g className="lc-bubble">
        <rect x={0} y={0} rx={14} ry={16} width={w} height={h} fill="#FFFDF8" stroke="#2B231F" strokeWidth={2.4} />
        <path
          d={`M${mid - 6} ${h - 1} L${mid} ${h + 10} L${mid + 8} ${h - 1} Z`}
          fill="#FFFDF8"
          stroke="#2B231F"
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <path d={`M${mid - 8} ${h - 3} h18 v3 h-18 z`} fill="#FFFDF8" stroke="none" />
        <text
          x={mid}
          y={24}
          textAnchor="middle"
          fontSize={15}
          fontWeight={500}
          fill="#2B231F"
          style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.2px' }}
        >
          {lines.map((l, i) => (
            <tspan key={i} x={mid} dy={i === 0 ? 0 : 20}>
              {l}
            </tspan>
          ))}
        </text>
      </g>
    </g>
  );
}

export function quirkFor(catId: CatId, phase: ActivePhase, stage: number = 1): string | null {
  const seed = CAT_SEED.find(c => c.id === catId);
  if (!seed) return null;
  const stageKey = `stage${stage}` as keyof typeof seed.config.quirks.stageLines;
  const stageLine = seed.config.quirks.stageLines?.[stageKey]?.[0];
  if (stageLine) return stageLine;
  if (phase === 'WAITING') return seed.config.quirks.waitingLines[0];
  if (phase === 'VERY_CLOSE' || phase === 'ANTICIPATING') return seed.config.quirks.closeLines[0];
  return seed.config.quirks.chosenLine;
}
