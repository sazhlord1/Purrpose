import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CatScene, seedFor, type CatState, type LivingCatHandle } from '@purrpose/cats';
import { CREDIT_TYPE_LABELS, now, type CommitmentDto } from '@purrpose/shared';
import { api, ApiError } from '../lib/api.js';
import { ambient } from '../lib/ambient.js';
import { notifyFailure, notifySuccess } from '../lib/notifications.js';
import { fmtDate, fmtRemaining } from '../lib/format.js';
import { DoodleButton, SketchCard } from '../components/ui/index.js';

const PHASE_STATES: Array<string> = ['INITIAL', 'WAITING', 'ANTICIPATING', 'VERY_CLOSE'];

export function CommitmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const livingRef = useRef<LivingCatHandle | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [banner, setBanner] = useState<'success' | 'failure' | null>(null);
  const [sceneOverride, setSceneOverride] = useState<CatState | null>(null);
  const [, setTick] = useState(0);
  const prevStatusRef = useRef<string | null>(null);
  const prevSceneRef = useRef<CatState>('WAITING');
  const crossedRef = useRef(false);
  const reduced =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('purrpose.reducedMotion') === '1';

  const trackedFocusSecs = Number(
    typeof localStorage !== 'undefined' && id
      ? localStorage.getItem(`purrpose.focus_time.${id}`) || '0'
      : '0',
  );
  const focusMins = Math.round(trackedFocusSecs / 60);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const query = useQuery({
    queryKey: ['commitment', id],
    queryFn: () => api<{ commitment: CommitmentDto }>(`/commitments/${id}`),
    refetchInterval: 30_000,
    enabled: Boolean(id),
  });

  const c = query.data?.commitment;
  const remainingMs = c ? Date.parse(c.deadlineISO) - now() : 0;
  const pending = Boolean(c && c.status === 'ACTIVE' && remainingMs <= 0);

  useEffect(() => {
    if (!c) return;
    const status = c.status;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prev === null && status !== 'ACTIVE') {
      setBanner(status === 'FAILED' ? 'failure' : 'success');
      if (status === 'FAILED') notifyFailure(c.id);
      return;
    }
    if (prev === 'ACTIVE' && status === 'FAILED') {
      notifyFailure(c.id);
      if (reduced) {
        setBanner('failure');
      } else {
        setSceneOverride('VERY_CLOSE');
        livingRef.current?.playScript('FAILURE');
        window.setTimeout(() => setBanner('failure'), 2600);
      }
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['history'] });
      void qc.invalidateQueries({ queryKey: ['commitments'] });
    }
  }, [c, qc, reduced]);

  useEffect(() => {
    if (pending && !crossedRef.current) {
      crossedRef.current = true;
      const t = window.setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ['commitment', id] });
      }, 1200);
      return () => window.clearTimeout(t);
    }
  }, [pending, id, qc]);

  const complete = useMutation({
    mutationFn: () =>
      api<{ commitment: CommitmentDto }>(`/commitments/${id}/complete`, { method: 'POST' }),
    onSuccess: () => {
      notifySuccess(id ?? '');
      if (reduced) {
        setBanner('success');
      } else {
        setSceneOverride(prevSceneRef.current);
        livingRef.current?.playScript('SUCCESS');
        window.setTimeout(() => setBanner('success'), 2600);
      }
      void qc.invalidateQueries({ queryKey: ['commitment', id] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['history'] });
      void qc.invalidateQueries({ queryKey: ['commitments'] });
    },
    onError: e => {
      if (e instanceof ApiError && e.code === 'FAILED_AT_DEADLINE') {
        notifyFailure(id ?? '');
        if (reduced) {
          setBanner('failure');
        } else {
          setSceneOverride('VERY_CLOSE');
          livingRef.current?.playScript('FAILURE');
          window.setTimeout(() => setBanner('failure'), 2600);
        }
        void qc.invalidateQueries({ queryKey: ['commitment', id] });
        void qc.invalidateQueries({ queryKey: ['me'] });
        void qc.invalidateQueries({ queryKey: ['history'] });
      } else if (e instanceof ApiError && e.code === 'ALREADY_SETTLED') {
        void qc.invalidateQueries({ queryKey: ['commitment', id] });
      }
    },
  });

  const remove = useMutation({
    mutationFn: () => api<void>(`/commitments/${id}`, { method: 'DELETE' }),
    onSuccess: () => navigate('/'),
  });

  if (query.isLoading) return <main><p className="muted">fetching the cat…</p></main>;
  if (query.isError || !c)
    return <main><p className="muted">This commitment wandered off.</p></main>;

  const createdMs = Date.parse(c.createdAtISO);
  const inGrace = createdMs + 5 * 60_000 > now();
  const phaseRatio = Math.min(1, Math.max(0, (now() - createdMs) / Math.max(1, Date.parse(c.deadlineISO) - createdMs)));

  const derivedScene: CatState = pending
    ? 'VERY_CLOSE'
    : c.status === 'COMPLETED'
      ? 'SLEEPING'
      : c.status === 'FAILED'
        ? 'SATISFIED'
        : PHASE_STATES.includes(c.phase ?? '')
          ? (c.phase as CatState)
          : 'WAITING';
  prevSceneRef.current = derivedScene;
  const sceneState = sceneOverride ?? derivedScene;

  const showBanner =
    banner ?? (pending ? null : c.status === 'COMPLETED' ? 'success' : c.status === 'FAILED' ? 'failure' : null);

  return (
    <main>
      <h1>{c.title}</h1>
      <div className="chip-row">
        <span className="chip">{fmtDate(c.deadlineISO)}</span>
        <span className="chip">
          {c.consequenceAmount} {CREDIT_TYPE_LABELS[c.consequenceType as keyof typeof CREDIT_TYPE_LABELS]}
        </span>
        {c.status === 'ACTIVE' && !pending && (
          <span className="chip">{fmtRemaining(remainingMs)}</span>
        )}
        {focusMins > 0 && (
          <span className="chip" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
            ⏱ {focusMins}m focused
          </span>
        )}
        {c.status === 'ACTIVE' && !pending && (
          <Link to="/focus" className="chip" style={{ background: 'var(--paper-warm)', color: 'var(--ink)', textDecoration: 'none' }}>
            🌙 Focus Room →
          </Link>
        )}
        {pending && <span className="chip">checking on your cat…</span>}
      </div>

      {showBanner === 'success' && (
        <SketchCard variant="a" className="success-card">
          <h2>You did it.</h2>
          <p>
            Your {c.consequenceAmount}{' '}
            {CREDIT_TYPE_LABELS[c.consequenceType as keyof typeof CREDIT_TYPE_LABELS]} are safe.
          </p>
          <div style={{ marginTop: 8 }}>
            <span className="stamp">KEPT</span>
          </div>
          <p className="muted">"…maybe next time." — your cat, walking away</p>
        </SketchCard>
      )}
      {showBanner === 'failure' && (
        <SketchCard variant="a" className="error-box">
          <h2>The cat won.</h2>
          <p>
            You didn't do it. But your {c.consequenceAmount}{' '}
            {CREDIT_TYPE_LABELS[c.consequenceType as keyof typeof CREDIT_TYPE_LABELS]} will feed a cat.
          </p>
          <span className="stamp stamp-fed">FED</span>
        </SketchCard>
      )}

      <section className="stage" aria-label={`Scene: ${c.catId} cat, ${sceneState.toLowerCase()}`} style={{ padding: 4 }}>
        <CatScene
          catId={c.catId}
          state={sceneState}
          phaseRatio={phaseRatio}
          createdAtISO={c.createdAtISO}
          deadlineISO={c.deadlineISO}
          seed={seedFor(c.id, createdMs, now())}
          reduced={reduced}
          livingRef={livingRef}
          onSceneEvent={e => {
            if (e === 'script:done') setSceneOverride(null);
            if (e.startsWith('speech:') || e.startsWith('display:')) {
              ambient.playOccasionalMeow(10000);
            }
          }}
        />
        <p className="muted" style={{ textAlign: 'center', marginTop: -6 }}>
          {pending
            ? 'time is up. checking on your cat…'
            : c.status === 'ACTIVE'
              ? `${c.phase} · the cat is waiting…`
              : c.status === 'COMPLETED'
                ? 'sleeping it off.'
                : 'satisfied. for now.'}
        </p>
      </section>

      {c.status === 'ACTIVE' && !pending && !showBanner && (
        <>
          {!confirming ? (
            <DoodleButton variant="primary" size="big" onClick={() => setConfirming(true)}>
              I DID IT
            </DoodleButton>
          ) : (
            <SketchCard variant="c">
              <h3>Did you actually finish it?</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <DoodleButton
                  variant="primary"
                  onClick={() => {
                    setConfirming(false);
                    complete.mutate();
                  }}
                >
                  Yes, I did
                </DoodleButton>
                <DoodleButton onClick={() => setConfirming(false)}>Not yet</DoodleButton>
              </div>
            </SketchCard>
          )}
        </>
      )}

      {inGrace && c.status === 'ACTIVE' && !pending && (
        <p style={{ marginTop: 16 }}>
          <button className="chip" onClick={() => remove.mutate()}>
            delete (grace window)
          </button>
        </p>
      )}
    </main>
  );
}
