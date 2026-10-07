import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppIcon, CatScene } from '@purrpose/cats';
import { catById, now } from '@purrpose/shared';
import { BackLink } from '../components/BackLink.js';
import { CatCard } from '../components/CatCard.js';
import { StagePath } from '../components/StagePath.js';
import { DoodleButton, Skeleton, SketchCard } from '../components/ui/index.js';
import { commitmentView, localHour } from '../lib/commitmentView.js';
import { fmtRemaining } from '../lib/format.js';
import { catNameOf, moodLabel, sceneCaption } from '../lib/labels.js';
import { notifyFailure } from '../lib/notifications.js';
import { useCommitments, useMe } from '../lib/queries.js';


function isReduced(): boolean {
  try {
    return localStorage.getItem('purrpose.reducedMotion') === '1';
  } catch {
    return false;
  }
}

/** Make a commitment: your pacts and their cats (what used to be the home screen). */
export function Pacts() {
  const qc = useQueryClient();
  const me = useMe();
  const commitments = useCommitments(30_000);
  const [, setTick] = useState(0);
  const crossedRef = useRef<Set<string>>(new Set());
  const prevStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const t = now();
  const hour = localHour(t);
  const reduced = isReduced();
  const all = useMemo(() => commitments.data?.commitments ?? [], [commitments.data]);

  // Most urgent first: the featured cat is the one closest to its deadline.
  const active = all
    .filter(c => c.status === 'ACTIVE')
    .map(c => ({ c, view: commitmentView(c, t) }))
    .sort((a, b) => a.view.deadlineMs - b.view.deadlineMs);
  const [featured, ...others] = active;

  const meals = me.data?.balances.find(b => b.creditType === 'MEALS');

  useEffect(() => {
    if (!commitments.data) return;
    for (const c of all) {
      const prev = prevStatuses.current.get(c.id);
      if (prev === 'ACTIVE' && c.status === 'FAILED') notifyFailure(c.id);
      prevStatuses.current.set(c.id, c.status);
    }
  }, [commitments.data, all]);

  // A deadline passed while watching: ask the server to settle it.
  for (const { c, view } of active) {
    if (view.pending && !crossedRef.current.has(c.id)) {
      crossedRef.current.add(c.id);
      void qc.invalidateQueries({ queryKey: ['commitments'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    }
  }

  const hungry = active.find(a => a.view.phase === 'VERY_CLOSE');
  // The cat's pressure line ("you won't make it. i can smell it.") — not a stage celebration line.
  const taunt = hungry ? (catById(hungry.c.catId)?.config.quirks.closeLines[0] ?? null) : null;

  return (
    <main>
      <header style={{ marginBottom: 16 }}>
        <BackLink />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ margin: 0 }}>Commitments</h1>
        </div>
        <div className="chip-row" aria-label="Summary">
          <span className="chip" style={{ background: 'var(--paper-raised)', fontWeight: 600 }}>
            {active.length} active
          </span>
          <span className="chip" style={{ color: 'var(--stamp-red)', fontWeight: 600 }}>
            {meals?.stakedActive ?? 0} meals at stake
          </span>
          <span className="chip" style={{ color: '#2E6930', fontWeight: 600 }}>
            pantry: {meals?.available ?? 0}
          </span>
          <Link to="/shop" className="chip" style={{ textDecoration: 'none', fontWeight: 600 }}>
            <AppIcon name="purr" size={16} /> {me.data?.purr ?? 0} PURR
          </Link>
        </div>
        {taunt && hungry && (
          <p className="muted" style={{ marginTop: -8 }} role="status">
            {catNameOf(hungry.c.catId)}: “{taunt}”
          </p>
        )}
      </header>

      <section aria-label="Your cats">
        {commitments.isLoading ? (
          <div style={{ padding: 12, display: 'grid', gap: 12 }}>
            <Skeleton h={380} />
            <Skeleton h={18} w="70%" />
            <Skeleton h={18} w="50%" />
          </div>
        ) : commitments.isError ? (
          <SketchCard variant="b" className="error-box">
            <p>The cats scattered. Something went wrong on the way home.</p>
            <DoodleButton onClick={() => void commitments.refetch()}>Try again</DoodleButton>
          </SketchCard>
        ) : !featured ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CatScene catId="orange" state="SLEEPING" phaseRatio={0.05} seed={1234} reduced={reduced} hour={hour} items={me.data?.loadout} />
            <div style={{ marginTop: 14 }}>
              <p className="muted">
                A stray cat is waiting in its box.
                <br />
                Make a commitment to give it a better life!
              </p>
              <div style={{ marginTop: 14 }}>
                <DoodleButton href="/new" variant="primary" size="big">
                  + New Commitment
                </DoodleButton>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Not a link: tap the cat to pet it. The title below opens the pact. */}
            <div className="featured-scene">
              <CatScene
                catId={featured.c.catId}
                state={featured.view.sceneState}
                phaseRatio={featured.view.phaseRatio}
                seed={featured.view.seed}
                reduced={reduced}
                hour={hour}
                items={me.data?.loadout}
                interactive
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
              <Link to={`/commitment/${featured.c.id}`} style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                {featured.c.title} →
              </Link>
              <span className={`stamp ${moodLabel(featured.view.pending ? undefined : featured.view.phase).hot ? 'stamp-fed' : ''}`}>
                {featured.view.pending ? '…' : fmtRemaining(featured.view.remainingMs)}
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              {sceneCaption(featured.c.catId, featured.view.phase, featured.view.stage.label, featured.view.pending)}
            </p>
            <StagePath stage={featured.view.stage} nextStageInMs={featured.view.nextStageInMs} />

            {others.length > 0 && (
              <>
                <h2 style={{ marginBottom: 0 }}>Your other cats</h2>
                <div className="cat-grid">
                  {others.map(({ c, view }) => (
                    <CatCard key={c.id} c={c} view={view} hour={hour} items={me.data?.loadout} />
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 14 }}>
              <DoodleButton href="/new" variant="primary" size="big">
                + New Commitment
              </DoodleButton>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
