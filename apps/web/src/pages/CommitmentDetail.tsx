import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppIcon, CatScene, type CatState, type LivingCatHandle } from '@purrpose/cats';
import { CREDIT_TYPE_LABELS, now, type CommitmentDto } from '@purrpose/shared';
import { GraceDelete } from '../components/GraceDelete.js';
import { StagePath } from '../components/StagePath.js';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { ambient } from '../lib/ambient.js';
import { api, ApiError } from '../lib/api.js';
import { commitmentView, localHour } from '../lib/commitmentView.js';
import { fmtDate, fmtRemaining } from '../lib/format.js';
import { catNameOf, sceneCaption } from '../lib/labels.js';
import { notifyFailure, notifySuccess } from '../lib/notifications.js';
import { useFocusSummary, useMe } from '../lib/queries.js';
import { shareResult } from '../lib/shareCard.js';

function isReduced(): boolean {
  try {
    return localStorage.getItem('purrpose.reducedMotion') === '1';
  } catch {
    return false;
  }
}

export function CommitmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const livingRef = useRef<LivingCatHandle | null>(null);
  const sceneRef = useRef<HTMLElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [banner, setBanner] = useState<'success' | 'failure' | null>(null);
  const [sceneOverride, setSceneOverride] = useState<CatState | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [, setTick] = useState(0);
  const prevStatusRef = useRef<string | null>(null);
  const prevSceneRef = useRef<CatState>('WAITING');
  const crossedRef = useRef(false);
  const reduced = isReduced();
  const focus = useFocusSummary();
  const me = useMe();

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
  const t = now();
  const view = c ? commitmentView(c, t) : null;
  const pending = Boolean(view?.pending);

  const invalidateAll = () => {
    for (const key of [['commitment', id], ['me'], ['history'], ['commitments']]) {
      void qc.invalidateQueries({ queryKey: key });
    }
  };

  const playEnding = (kind: 'success' | 'failure') => {
    if (reduced) {
      setBanner(kind);
      return;
    }
    setSceneOverride(kind === 'failure' ? 'VERY_CLOSE' : prevSceneRef.current);
    livingRef.current?.playScript(kind === 'failure' ? 'FAILURE' : 'SUCCESS');
    window.setTimeout(() => setBanner(kind), 2600);
  };

  useEffect(() => {
    if (!c) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = c.status;
    if (prev === null && c.status !== 'ACTIVE') {
      setBanner(c.status === 'FAILED' ? 'failure' : 'success');
      return;
    }
    if (prev === 'ACTIVE' && c.status === 'FAILED') {
      notifyFailure(c.id);
      playEnding('failure');
      invalidateAll();
    }
  }, [c]);

  useEffect(() => {
    if (pending && !crossedRef.current) {
      crossedRef.current = true;
      const timer = window.setTimeout(() => void qc.invalidateQueries({ queryKey: ['commitment', id] }), 1200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [pending, id, qc]);

  const complete = useMutation({
    mutationFn: () => api<{ commitment: CommitmentDto }>(`/commitments/${id}/complete`, { method: 'POST' }),
    onSuccess: () => {
      notifySuccess(id ?? '');
      playEnding('success');
      invalidateAll();
    },
    onError: e => {
      if (e instanceof ApiError && e.code === 'FAILED_AT_DEADLINE') {
        notifyFailure(id ?? '');
        playEnding('failure');
        invalidateAll();
      } else if (e instanceof ApiError && e.code === 'ALREADY_SETTLED') {
        void qc.invalidateQueries({ queryKey: ['commitment', id] });
      }
    },
  });

  const remove = useMutation({
    mutationFn: () => api<void>(`/commitments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['commitments'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      navigate('/pacts');
    },
  });

  if (query.isLoading) return <main><p className="muted">fetching the cat…</p></main>;
  if (query.isError || !c || !view) return <main><p className="muted">This commitment wandered off.</p></main>;

  prevSceneRef.current = view.sceneState;
  const sceneState = sceneOverride ?? view.sceneState;
  const creditLabel = CREDIT_TYPE_LABELS[c.consequenceType];
  const amountLabel = `${c.consequenceAmount} ${creditLabel}`;
  const catName = catNameOf(c.catId);
  const focusMins = Math.round((focus.data?.byCommitment[c.id] ?? 0) / 60);

  const showBanner =
    banner ?? (pending ? null : c.status === 'COMPLETED' ? 'success' : c.status === 'FAILED' ? 'failure' : null);

  const onShare = async () => {
    if (!showBanner) return;
    setShareState('busy');
    try {
      await shareResult({
        sceneSvg: sceneRef.current?.querySelector('svg') ?? null,
        title: c.title,
        outcome: showBanner,
        amountLabel,
        catName,
      });
      setShareState('done');
    } catch {
      setShareState('idle');
    }
  };

  return (
    <main>
      <h1>{c.title}</h1>
      <div className="chip-row">
        <span className="chip">{fmtDate(c.deadlineISO)}</span>
        <span className="chip">{amountLabel}</span>
        {c.status === 'ACTIVE' && !pending && <span className="chip tabular">{fmtRemaining(view.remainingMs)} left</span>}
        {focusMins > 0 && (
          <span className="chip" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
            ⏱ {focusMins}m focused
          </span>
        )}
        {c.status === 'ACTIVE' && !pending && (
          <Link
            to={`/focus?commitment=${c.id}`}
            className="chip"
            style={{ background: 'var(--paper-warm)', color: 'var(--ink)', textDecoration: 'none' }}
          >
            <AppIcon name="focus" size={16} /> Focus Room →
          </Link>
        )}
        {pending && <span className="chip">checking on {catName}…</span>}
      </div>

      {showBanner === 'success' && (
        <SketchCard variant="a" className="success-card">
          <h2>You did it.</h2>
          <p>Your {amountLabel} are safe.</p>
          <div style={{ marginTop: 8 }}>
            <span className="stamp">KEPT</span>
          </div>
          <p className="muted">“…maybe next time.” — {catName}, walking away</p>
        </SketchCard>
      )}
      {showBanner === 'failure' && (
        <SketchCard variant="a" className="error-box">
          <h2>The cat won.</h2>
          <p>You didn't do it. But your {amountLabel} will feed a cat.</p>
          <span className="stamp stamp-fed">FED</span>
        </SketchCard>
      )}

      {showBanner && (
        <div className="result-actions">
          <DoodleButton href={`/new?cat=${c.catId}`} variant="primary">
            <AppIcon name="paw" size={18} /> New pact with {catName}
          </DoodleButton>
          <DoodleButton onClick={() => void onShare()} disabled={shareState === 'busy'}>
            {shareState === 'busy' ? 'Drawing…' : shareState === 'done' ? '✓ Shared' : <><AppIcon name="share" size={18} /> Share</>}
          </DoodleButton>
          <DoodleButton href="/pacts">All commitments</DoodleButton>
        </div>
      )}

      <section
        ref={sceneRef}
        className="stage"
        aria-label={`${catName} in ${view.stage.label}`}
        style={{ padding: 4 }}
      >
        <CatScene
          catId={c.catId}
          state={sceneState}
          phaseRatio={view.phaseRatio}
          seed={view.seed}
          reduced={reduced}
          hour={localHour(t)}
          animateStages={c.status === 'ACTIVE' && !pending && !sceneOverride}
          livingRef={livingRef}
          items={me.data?.loadout}
          interactive
          onSceneEvent={e => {
            if (e === 'script:done') setSceneOverride(null);
            if (e.startsWith('speech:') || e.startsWith('display:')) ambient.playOccasionalMeow(10000);
          }}
        />
        <p className="muted" style={{ textAlign: 'center', marginTop: 6 }}>
          {sceneCaption(c.catId, pending ? '' : c.status === 'ACTIVE' ? view.phase : c.status, view.stage.label, pending)}
        </p>
      </section>

      {c.status === 'ACTIVE' && !pending && (
        <StagePath stage={view.stage} nextStageInMs={view.nextStageInMs} />
      )}

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
                  disabled={complete.isPending}
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

      {c.status === 'ACTIVE' && !pending && (
        <GraceDelete createdMs={view.createdMs} nowMs={t} busy={remove.isPending} onDelete={() => remove.mutate()} />
      )}
    </main>
  );
}
