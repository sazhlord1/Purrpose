import {
  motion,
  useAnimationControls,
} from 'framer-motion';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CatId } from '@purrpose/shared';
import { CAT_SEED } from '@purrpose/shared';
import { Cat } from './Cat.js';
import { POSE_BY_STATE, type CatState, type Expression } from './poses.js';
import {
  IDLE_TIMING,
  WALK_TARGET,
  durationFor,
  macroCooldownMs,
  mulberry32,
  pickMacro,
  rollSpeech,
  stepped,
  type ActivePhase,
  type MacroName,
} from './engine.js';
import { ANCHORS, type AnchorName } from './anchors.js';
import { injectLivingStyle } from './livingCss.js';
import { catName, resolveCatConfig } from './config.js';

const ACTIVE_PHASES: ActivePhase[] = ['INITIAL', 'WAITING', 'ANTICIPATING', 'VERY_CLOSE'];

export interface LivingCatHandle {
  play: (name: MacroName) => void;
  playScript: (script: 'SUCCESS' | 'FAILURE') => void;
  stop: () => void;
}

export interface LivingCatProps {
  catId: CatId;
  state: CatState;
  seed: number;
  homeX: number;
  speed?: number;
  paused?: boolean;
  reduced?: boolean;
  onEvent?: (event: string) => void;
  speech?: string | null;
}

function wait(seconds: number, speed: number): Promise<void> {
  return new Promise(r => setTimeout(r, (seconds * 1000) / speed));
}

export const LivingCat = forwardRef<LivingCatHandle, LivingCatProps>(function LivingCat(
  { catId, state, seed, homeX, speed = 1, paused = false, reduced = false, onEvent, speech },
  ref,
) {
  const config = resolveCatConfig(catId);
  const controls = useAnimationControls();
  const offsetRef = useRef(0);
  const anchorRef = useRef<AnchorName>('scratcher');
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const [displayState, setDisplayState] = useState<CatState>(state);
  const [headTilt, setHeadTilt] = useState<-1 | 0 | 1>(0);
  const [armUp, setArmUp] = useState(false);
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
    setArmUp(false);
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

  async function ensureAt(target: AnchorName): Promise<void> {
    if (anchorRef.current === target) return;
    await walkTo(target);
  }

  async function walkTo(target: AnchorName): Promise<void> {
    const dx = ANCHORS[target] - homeX - offsetRef.current;
    if (Math.abs(dx) < 2) {
      anchorRef.current = target;
      return;
    }
    const dist = Math.abs(dx);
    const dur = Math.max(0.5, dist / 240) / speedRef.current;
    setFlag('bob', true);
    onEvent?.('walk');
    await controls.start({
      x: offsetRef.current + dx,
      transition: { duration: dur, ease: stepped(4) },
    });
    setFlag('bob', false);
    offsetRef.current += dx;
    anchorRef.current = target;
  }

  async function hop(): Promise<void> {
    const base = offsetRef.current;
    await controls.start({
      y: [0, -16, 0, -10, 0],
      transition: { duration: 0.7 / speedRef.current, times: [0, 0.3, 0.55, 0.78, 1] },
    });
    await controls.set({ y: 0, x: base });
  }

  async function runMacro(name: MacroName): Promise<void> {
    const sp = speedRef.current;
    onEvent?.(`macro:${name}`);
    const target = WALK_TARGET[name as keyof typeof WALK_TARGET] as AnchorName | undefined;
    if (target) await ensureAt(target);

    switch (name) {
      case 'perkUp':
        await hop();
        setFlags(f => ({ ...f, earDual: true }));
        await wait(0.35, sp);
        setFlags(f => ({ ...f, earDual: false }));
        break;
      case 'lickLips':
        setExpression('happyShut');
        await wait(0.6, sp);
        setExpression(null);
        break;
      case 'sit':
        setHeadTilt(0);
        setArmUp(false);
        await wait(1.2, sp);
        break;
      case 'shiftWeight':
        await controls.start({ x: [offsetRef.current, offsetRef.current + 4, offsetRef.current], transition: { duration: 0.9 / sp } });
        break;
      case 'lookAround':
        setHeadTilt(-1);
        await wait(0.55, sp);
        setHeadTilt(1);
        await wait(0.55, sp);
        setHeadTilt(0);
        await wait(0.3, sp);
        break;
      case 'lookAtUser':
      case 'lookAtClock':
        setHeadTilt(name === 'lookAtClock' ? 1 : -1);
        await wait(1.2, sp);
        setHeadTilt(0);
        break;
      case 'scratch':
        for (let i = 0; i < 3; i++) {
          setArmUp(true);
          onEvent?.('scratcher:shake');
          await wait(0.22, sp);
          setArmUp(false);
          await wait(0.18, sp);
        }
        break;
      case 'batToy':
        for (let i = 0; i < 2; i++) {
          setArmUp(true);
          onEvent?.('toy:shake');
          await wait(0.2, sp);
          setArmUp(false);
          await wait(0.25, sp);
        }
        break;
      case 'playWithYarn':
        for (let i = 0; i < 4; i++) {
          setArmUp(true);
          onEvent?.('toy:shake');
          await wait(0.18, sp);
          setArmUp(false);
          await wait(0.18, sp);
        }
        break;
      case 'playPounce':
        setHeadTilt(1);
        setFlags(f => ({ ...f, tailFlick: true }));
        await wait(0.4, sp);
        setFlags(f => ({ ...f, tailFlick: false }));
        await hop();
        onEvent?.('toy:shake');
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
        await wait(1.4, sp);
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
        setArmUp(true);
        await wait(1.1, sp);
        setArmUp(false);
        await wait(0.4, sp);
        setHeadTilt(0);
        break;
      case 'sniffBowl':
      case 'inspectBowl':
        setHeadTilt(1);
        await wait(0.9, sp);
        setHeadTilt(0);
        await wait(0.3, sp);
        setHeadTilt(1);
        await wait(0.7, sp);
        setHeadTilt(0);
        break;
      case 'inspectCabinet':
        setHeadTilt(-1);
        await wait(1.2, sp);
        setHeadTilt(0);
        break;
      case 'pawCabinet':
        for (let i = 0; i < 3; i++) {
          setArmUp(true);
          onEvent?.('cabinet:shake');
          await wait(0.24, sp);
          setArmUp(false);
          await wait(0.16, sp);
        }
        break;
      case 'attemptOpenCabinet':
        setArmUp(true);
        onEvent?.('cabinet:crack');
        await wait(0.9, sp);
        setArmUp(false);
        onEvent?.('cabinet:close');
        await wait(0.4, sp);
        break;
      case 'dragBowl':
        onEvent?.('bowl:drag');
        await controls.start({ x: [offsetRef.current, offsetRef.current - 7, offsetRef.current], transition: { duration: 0.8 / sp } });
        break;
      case 'excitedHop':
        await hop();
        await hop();
        break;
      case 'stareAtUser':
        setFlag('stare', true);
        await wait(2.2, sp);
        setFlag('stare', false);
        break;
      case 'freeze':
        await wait(0.6, sp);
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
    stop: () => controls.stop(),
  }));

  async function runTerminalScript(script: 'SUCCESS' | 'FAILURE'): Promise<void> {
    const sp = speedRef.current;
    onEvent?.(`script:${script}`);
    if (script === 'SUCCESS') {
      await wait(0.45, sp);
      setHeadTilt(1);
      await wait(0.35, sp);
      setHeadTilt(-1);
      await wait(0.35, sp);
      setHeadTilt(0);
      bubbleFor(config.quirks.loseLine, 5000);
      await wait(2.0, sp);
      await walkTo('bed');
      setDisplayState('SLEEPING');
    } else {
      await wait(0.25, sp);
      await walkTo('bowl');
      onEvent?.('cabinet:crack');
      await wait(0.4, sp);
      onEvent?.('cabinet:close');
      for (let i = 0; i < 3; i++) {
        setHeadTilt(1);
        await wait(0.32, sp);
        setHeadTilt(0);
        await wait(0.18, sp);
      }
      await hop();
      await hop();
      bubbleFor(config.quirks.winLine, 5000);
      await wait(2.0, sp);
      setDisplayState('SATISFIED');
    }
    onEvent?.('script:done');
  }

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
        const picked = pickMacro(phase, rng, { last, cooldownUntil, nowMs: clock });
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
      <Cat
        catId={catId}
        state={displayState}
        size={220}
        title={`${catName(catId)} — ${displayState.toLowerCase()}`}
      />
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
      <g transform="translate(-110 -150)">
        <Cat
          catId={catId}
          state={displayState}
          expression={expression ?? undefined}
          headTilt={headTilt}
          armUp={armUp}
          size={220}
        />
      </g>
      {bubble && (
        <g className="lc-bubble" transform={`translate(${-Math.max(140, Math.min(280, bubble.length * 8.2 + 36)) / 2} -185)`}>
          <rect
            x={0}
            y={0}
            rx={14}
            ry={16}
            width={Math.max(140, Math.min(280, bubble.length * 8.2 + 36))}
            height={38}
            fill="#FFFDF8"
            stroke="#2B231F"
            strokeWidth={2.4}
          />
          <path
            d={`M${Math.max(140, Math.min(280, bubble.length * 8.2 + 36)) / 2 - 6} 37 L${Math.max(140, Math.min(280, bubble.length * 8.2 + 36)) / 2} 48 L${Math.max(140, Math.min(280, bubble.length * 8.2 + 36)) / 2 + 8} 37 Z`}
            fill="#FFFDF8"
            stroke="#2B231F"
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <path
            d={`M${Math.max(140, Math.min(280, bubble.length * 8.2 + 36)) / 2 - 8} 35 h18 v3 h-18 z`}
            fill="#FFFDF8"
            stroke="none"
          />
          <text
            x={Math.max(140, Math.min(280, bubble.length * 8.2 + 36)) / 2}
            y={24}
            textAnchor="middle"
            fontSize={15}
            fontWeight={500}
            fill="#2B231F"
            style={{ fontFamily: 'Gochi Hand, cursive', letterSpacing: '0.2px' }}
          >
            {bubble}
          </text>
        </g>
      )}
    </motion.g>
  );
});

LivingCat.displayName = 'LivingCat';

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
