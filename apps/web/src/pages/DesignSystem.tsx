import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CONSEQUENCE_TYPES,
  CREDIT_TYPE_ICONS,
  CREDIT_TYPE_LABELS,
  type ConsequenceType,
} from '@purrpose/shared';
import { popSpring, standardSpring } from '../lib/motion.js';
import { useReducedMotion } from '../lib/useReducedMotion.js';
import {
  AmountPicker,
  Chip,
  DoodleButton,
  EmptyState,
  Field,
  Input,
  Select,
  Sheet,
  SketchCard,
  Stamp,
  Stepper,
} from '../components/ui/index.js';
import { DOODLES, Paw } from '../components/doodles/index.js';

const SWATCHES: Array<[string, string]> = [
  ['paper', '#FAF6EE'],
  ['raised', '#FFFDF8'],
  ['ink', '#1A1A1A'],
  ['ink-soft', '#4A4742'],
  ['orange', '#E08B4C'],
  ['stamp-red', '#B4443C'],
];

export function DesignSystem() {
  const reduced = useReducedMotion();
  const [amount, setAmount] = useState(5);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [creditType, setCreditType] = useState<ConsequenceType>('MEALS');

  return (
    <main>
      <h1>Paper &amp; Ink — Design Kit</h1>
      <p className="muted">Internal reference. Every screen must be assembled from these parts.</p>

      <section className="kit-section" aria-label="Palette">
        <h2>Palette</h2>
        <div className="doodle-grid">
          {SWATCHES.map(([name, hex]) => (
            <div className="doodle-cell" key={name}>
              <div className="swatch" style={{ background: hex }} />
              <span>{name}</span>
              <span style={{ color: 'var(--ink-soft)' }}>{hex}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="kit-section" aria-label="Typography">
        <h2>Typography</h2>
        <h1>Gochi Hand display 34</h1>
        <h2>Heading 26 — the cat is waiting</h2>
        <h3>Subhead 20 — deadline energy</h3>
        <p>Inter body 16. Countdowns and balances use tabular numerals: 12:47:08.</p>
        <p className="muted">Muted body for secondary information.</p>
      </section>

      <section className="kit-section" aria-label="Buttons">
        <h2>Buttons</h2>
        <div className="chip-row">
          <DoodleButton variant="primary">Primary</DoodleButton>
          <DoodleButton>Ghost</DoodleButton>
          <DoodleButton variant="primary" size="big">
            Big / CTA
          </DoodleButton>
          <DoodleButton disabled>Disabled</DoodleButton>
        </div>
      </section>

      <section className="kit-section" aria-label="Cards">
        <h2>Cards</h2>
        <SketchCard variant="a">
          <strong>card-a</strong>
          <p className="muted">Commitment cards default to corner variant a.</p>
        </SketchCard>
        <SketchCard variant="b">
          <strong>card-b</strong>
          <p className="muted">Alternate silhouette so lists don't look cloned.</p>
        </SketchCard>
        <SketchCard variant="c">
          <strong>card-c</strong>
          <p className="muted">Sheets and dialogs use c.</p>
        </SketchCard>
      </section>

      <section className="kit-section" aria-label="Chips and stamps">
        <h2>Chips &amp; Stamps</h2>
        <div className="chip-row">
          <Chip>3 active</Chip>
          <Chip active onClick={() => undefined}>
            selectable
          </Chip>
          <Chip onClick={() => undefined}>+5</Chip>
          <Stamp kind="stake" />
          <Stamp kind="kept" />
          <Stamp kind="fed" />
        </div>
      </section>

      <section className="kit-section" aria-label="Fields">
        <h2>Fields &amp; Inputs</h2>
        <Field label="Title" hint="max 80 chars">
          <Input placeholder="Finish YouTube video" maxLength={80} />
        </Field>
        <Field label="Stake type">
          <Select value={creditType} onChange={e => setCreditType(e.target.value as ConsequenceType)}>
            {CONSEQUENCE_TYPES.map(t => (
              <option key={t} value={t}>
                {CREDIT_TYPE_ICONS[t]} {CREDIT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount" error={amount > 10 ? 'That exceeds your available credits.' : undefined}>
          <AmountPicker value={amount} onChange={setAmount} max={11} />
          <div style={{ marginTop: 8 }}>
            <Stepper value={amount} onChange={setAmount} ariaLabel="plain stepper" />
          </div>
        </Field>
      </section>

      <section className="kit-section" aria-label="Sheet">
        <h2>Sheet</h2>
        <DoodleButton variant="primary" onClick={() => setSheetOpen(true)}>
          Open confirm sheet
        </DoodleButton>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Did you actually finish it?">
          <div style={{ display: 'flex', gap: 12 }}>
            <DoodleButton
              variant="primary"
              onClick={() => {
                setSheetOpen(false);
                setReplayKey(k => k + 1);
              }}
            >
              Yes, I did
            </DoodleButton>
            <DoodleButton onClick={() => setSheetOpen(false)}>Not yet</DoodleButton>
          </div>
        </Sheet>
      </section>

      <section className="kit-section" aria-label="Motion">
        <h2>Motion</h2>
        <p className="muted">
          Standard spring 260/18 · sheet spring 380/34 · tap 110ms · reduced motion:{' '}
          <strong>{reduced ? 'ON (poses only)' : 'off'}</strong>
        </p>
        <motion.div
          key={replayKey}
          initial={reduced ? false : { scale: 0.6, rotate: -8 }}
          animate={reduced ? undefined : { scale: 1, rotate: 0 }}
          transition={popSpring}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '2px solid var(--ink)',
            padding: '10px 16px',
            background: 'var(--paper-raised)',
          }}
        >
          <Paw size={22} /> replay popSpring
        </motion.div>{' '}
        <DoodleButton onClick={() => setReplayKey(k => k + 1)}>Replay</DoodleButton>
        <p className="muted" style={{ marginTop: 8 }}>
          <code>standardSpring</code> preview:
        </p>
        <motion.div
          animate={reduced ? undefined : { x: [-40, 0] }}
          transition={standardSpring}
          style={{ width: 90, height: 14, background: 'var(--accent-orange)', border: '2px solid var(--ink)' }}
        />
      </section>

      <section className="kit-section" aria-label="Empty states">
        <h2>Empty State</h2>
        <SketchCard variant="a">
          <EmptyState
            title="No commitments yet"
            hint="The cat pretends not to care."
            action={<DoodleButton variant="primary" href="/new">+ New Commitment</DoodleButton>}
          />
        </SketchCard>
      </section>

      <section className="kit-section" aria-label="Doodles">
        <h2>Doodles ({DOODLES.length})</h2>
        <div className="doodle-grid">
          {DOODLES.map(({ name, Comp }) => (
            <div className="doodle-cell" key={name}>
              <Comp size={30} />
              <span>{name}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Rules: 24×24 grid, currentColor stroke, width ≈2, round caps/joins, imperfect paths.
        </p>
      </section>
    </main>
  );
}
