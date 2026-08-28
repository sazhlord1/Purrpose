import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CatScene, quirkFor, seedFor, type CatState } from '@purrpose/cats';
import { computePhase, now, type CommitmentDto, type MeResponse } from '@purrpose/shared';
import { api } from '../lib/api.js';
import { fmtRemaining } from '../lib/format.js';
import { notifyFailure } from '../lib/notifications.js';
import { DoodleButton, Skeleton, SketchCard } from '../components/ui/index.js';

function greeting(): string {
  const h = new Date(now()).getHours();
  if (h < 5) return 'Up late.';
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
}

export function Home() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });
  const commitments = useQuery({
    queryKey: ['commitments'],
    queryFn: () => api<{ commitments: CommitmentDto[] }>('/commitments'),
    refetchInterval: 30_000,
  });
  const [, setTick] = useState(0);
  const crossedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const all = commitments.data?.commitments ?? [];
  const active = all.filter(c => c.status === 'ACTIVE');
  const mealsAtStake = me.data?.balances.find(b => b.creditType === 'MEALS')?.stakedActive ?? 0;
  const mealsAvailable = me.data?.balances.find(b => b.creditType === 'MEALS')?.available ?? 0;
  const t = now();
  const reduced = typeof localStorage !== 'undefined' && localStorage.getItem('purrpose.reducedMotion') === '1';

  const topActive = active[0];

  const prevStatuses = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!commitments.data) return;
    for (const c of all) {
      const prev = prevStatuses.current.get(c.id);
      if (prev === 'ACTIVE' && c.status === 'FAILED') notifyFailure(c.id);
      prevStatuses.current.set(c.id, c.status);
    }
  }, [commitments.data, all]);

  for (const c of active) {
    if (Date.parse(c.deadlineISO) <= t && !crossedRef.current.has(c.id)) {
      crossedRef.current.add(c.id);
      void qc.invalidateQueries({ queryKey: ['commitments'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    }
  }

  return (
    <main>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1>{greeting()}</h1>
          <Link to="/settings" className="muted" aria-label="Settings">
            ⚙ settings
          </Link>
        </div>
        <div className="chip-row" aria-label="Summary">
          <span className="chip" style={{ background: 'var(--paper-raised)', fontWeight: 600 }}>
            {active.length} active
          </span>
          <span className="chip" style={{ color: 'var(--stamp-red)', fontWeight: 600 }}>
            {mealsAtStake} meals at stake
          </span>
          <span className="chip" style={{ color: '#2E6930', fontWeight: 600 }}>
            pantry: {mealsAvailable}
          </span>
        </div>
        {(() => {
          const closeOne = active.find(c => c.phase === 'VERY_CLOSE');
          if (!closeOne) return null;
          const quip = quirkFor(closeOne.catId, 'VERY_CLOSE', 4);
          return quip ? (
            <p className="muted" style={{ marginTop: -8 }} role="status">
              "{quip}"
            </p>
          ) : null;
        })()}
      </header>

      <section aria-label="The cat world">
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
        ) : active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CatScene
              catId="orange"
              state="SLEEPING"
              phaseRatio={0.05}
              seed={1234}
              reduced={reduced}
              showMarkers={false}
            />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topActive && (
              <CatScene
                catId={topActive.catId}
                state={(
                  topActive.phase && ['INITIAL', 'WAITING', 'ANTICIPATING', 'VERY_CLOSE'].includes(topActive.phase)
                    ? topActive.phase
                    : computePhase({
                        status: topActive.status,
                        createdAtISO: topActive.createdAtISO,
                        deadlineISO: topActive.deadlineISO,
                        nowMs: t,
                      }) === 'PAST_DUE'
                      ? 'VERY_CLOSE'
                      : 'WAITING'
                ) as CatState}
                phaseRatio={Math.min(
                  1,
                  Math.max(0, (t - Date.parse(topActive.createdAtISO)) / Math.max(1, Date.parse(topActive.deadlineISO) - Date.parse(topActive.createdAtISO))),
                )}
                createdAtISO={topActive.createdAtISO}
                deadlineISO={topActive.deadlineISO}
                seed={seedFor(topActive.id, Date.parse(topActive.createdAtISO), t)}
                reduced={reduced}
                showMarkers={true}
              />
            )}
            <div style={{ padding: '0 4px 8px' }}>
              {active.map(c => {
                const crossed = Date.parse(c.deadlineISO) <= t;
                return (
                  <div className="row" key={c.id}>
                    <div>
                      <Link to={`/commitment/${c.id}`}>
                        <strong style={{ fontSize: 16 }}>{c.title}</strong>
                      </Link>
                      <div className="muted" style={{ marginTop: 2 }}>
                        {c.consequenceAmount} at stake ·{' '}
                        {crossed ? 'checking on your cat…' : fmtRemaining(Math.max(0, Date.parse(c.deadlineISO) - t))}
                      </div>
                    </div>
                    <span className={`stamp ${crossed || c.phase === 'VERY_CLOSE' ? 'stamp-fed' : ''}`}>
                      {crossed ? '…' : (c.phase ?? c.status)}
                    </span>
                  </div>
                );
              })}
              <div style={{ marginTop: 14 }}>
                <DoodleButton href="/new" variant="primary" size="big">
                  + New Commitment
                </DoodleButton>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
