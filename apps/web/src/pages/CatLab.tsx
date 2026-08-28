import { useRef, useState } from 'react';
import {
  CAT_STATES,
  MACRO_TABLE,
  type CatState,
  type LivingCatHandle,
  type MacroName,
} from '@purrpose/cats';
import { CatScene } from '@purrpose/cats';
import { CAT_SEED, type CatId } from '@purrpose/shared';
import { Chip, DoodleButton } from '../components/ui/index.js';

const CATS: Array<{ id: CatId; name: string }> = CAT_SEED.map(c => ({
  id: c.id,
  name: c.name,
}));

const ALL_MACROS = Array.from(new Set(Object.values(MACRO_TABLE).flat().map(m => m.name)));

export function CatLab() {
  const livingRef = useRef<LivingCatHandle>(null);
  const [catId, setCatId] = useState<CatId>('orange');
  const [state, setState] = useState<CatState>('WAITING');
  const [phase, setPhase] = useState(0.4);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [seed, setSeed] = useState(1234);
  const [seedLocked, setSeedLocked] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (e: string) =>
    setLog(l => [`${new Date().toLocaleTimeString()} · ${e}`, ...l].slice(0, 30));

  return (
    <main>
      <h1>Cat Lab</h1>
      <p className="muted">Development only. Drive the behavior system directly.</p>

      <div className="card card-b">
        <div className="chip-row">
          {CATS.map(c => (
            <Chip key={c.id} active={catId === c.id} onClick={() => setCatId(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <div className="chip-row">
          {CAT_STATES.map(s => (
            <Chip key={s} active={state === s} onClick={() => setState(s)}>
              {s}
            </Chip>
          ))}
        </div>

        <label className="field">
          <span>Phase ratio: {phase.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.01} value={phase} onChange={e => setPhase(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Speed: {speed.toFixed(2)}×</span>
          <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        </label>
        <div className="chip-row">
          <Chip active={paused} onClick={() => setPaused(p => !p)}>
            {paused ? '▶ resume' : '⏸ pause'}
          </Chip>
          <Chip active={reduced} onClick={() => setReduced(r => !r)}>
            reduced motion
          </Chip>
          <Chip active={seedLocked} onClick={() => setSeedLocked(s => !s)}>
            seed lock
          </Chip>
          <Chip onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}>🎲 reroll seed</Chip>
          <span className="chip">seed {seed}</span>
        </div>
      </div>

      <CatScene
        catId={catId}
        state={state}
        phaseRatio={phase}
        seed={seedLocked ? seed : seed + Math.floor(phase * 100)}
        speed={speed}
        paused={paused}
        reduced={reduced}
        showMarkers={false}
        livingRef={livingRef}
        onSceneEvent={pushLog}
      />

      <div className="card card-a">
        <h2>Terminal scripts</h2>
        <div className="chip-row">
          <DoodleButton variant="primary" onClick={() => livingRef.current?.playScript('SUCCESS')}>
            ▶ SUCCESS
          </DoodleButton>
          <DoodleButton variant="primary" onClick={() => livingRef.current?.playScript('FAILURE')}>
            ▶ FAILURE
          </DoodleButton>
          <DoodleButton onClick={() => livingRef.current?.stop()}>stop</DoodleButton>
        </div>
        <h2>Behaviors</h2>
        <div className="chip-row">
          {ALL_MACROS.map(m => (
            <Chip key={m} onClick={() => livingRef.current?.play(m as MacroName)}>
              {m}
            </Chip>
          ))}
        </div>
      </div>

      <div className="card card-c">
        <h2>Event log</h2>
        {log.length === 0 && <p className="muted">idle…</p>}
        {log.map((line, i) => (
          <div key={`${line}-${i}`} className="muted" style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {line}
          </div>
        ))}
      </div>
    </main>
  );
}
