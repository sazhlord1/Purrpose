import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppIcon, CatScene, type CatState, type LivingCatHandle } from '@purrpose/cats';
import { HONOR_STARTER_BONUS, now, type CommitmentDto } from '@purrpose/shared';
import { GraceDelete } from '../components/GraceDelete.js';
import { ProofForm } from '../components/pact/ProofForm.js';
import { WitnessLink } from '../components/pact/WitnessLink.js';
import { StagePath } from '../components/StagePath.js';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { ambient } from '../lib/ambient.js';
import { api, apiImage, ApiError } from '../lib/api.js';
import { commitmentView, localHour } from '../lib/commitmentView.js';
import { fmtDate, fmtRemaining } from '../lib/format.js';
import { catNameOf, isUnderReview, sceneCaption, stakeLabel } from '../lib/labels.js';
import { notifyFailure, notifySuccess } from '../lib/notifications.js';
import { useFocusSummary, useMe } from '../lib/queries.js';
import { shareResult } from '../lib/shareCard.js';
import { fmtDateTime, fwdArrow, t } from '../i18n/index.js';
import { Tour } from '../components/Tour.js';
import { pactTour } from '../lib/tours.js';

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
  const [proofOpen, setProofOpen] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
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
    const timer = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const query = useQuery({
    queryKey: ['commitment', id],
    queryFn: () => api<{ commitment: CommitmentDto }>(`/commitments/${id}`),
    refetchInterval: 30_000,
    enabled: Boolean(id),
  });

  const c = query.data?.commitment;
  const nowMs = now();
  const reviewing = c ? isUnderReview(c) : false;

  useEffect(() => {
    if (!c?.proofSubmittedAtISO || !c.proofRequired) return undefined;
    let url: string | null = null;
    apiImage(`/commitments/${c.id}/proof-image`)
      .then(u => {
        url = u;
        setProofPhoto(u);
      })
      .catch(() => setProofPhoto(null));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [c?.id, c?.proofSubmittedAtISO]);
  const view = c ? commitmentView(c, nowMs) : null;
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
    if (prev === 'ACTIVE' && c.status === 'COMPLETED' && c.proofRequired) {
      playEnding('success');
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

  if (query.isLoading) return <main><p className="muted">{t('fetching the cat…')}</p></main>;
  if (query.isError || !c || !view) return <main><p className="muted">{t('This commitment wandered off.')}</p></main>;

  prevSceneRef.current = view.sceneState;
  const sceneState = sceneOverride ?? view.sceneState;
  // Built with t() so the share card (a canvas) gets Persian digits too.
  const amountLabel = stakeLabel(c);
  const honor = c.mode === 'HONOR';
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
      {c.status === 'ACTIVE' && !pending && !reviewing && (
        <Tour id="pact" steps={pactTour(c.mode ?? 'STRICT', Boolean(c.proofRequired))} delayMs={1200} />
      )}
      <h1>{c.title}</h1>
      <div className="chip-row" data-tour="pact-chips">
        <span className="chip">{fmtDate(c.deadlineISO)}</span>
        <span className="chip">{amountLabel}</span>
        <span className={`chip mode-chip ${honor ? '' : 'mode-chip-strict'}`}>{honor ? t('On my word') : c.proofRequired ? t('Strict') : t('Food pact')}</span>
        {c.status === 'ACTIVE' && !pending && !reviewing && <span className="chip tabular">{t('{time} left', { time: fmtRemaining(view.remainingMs) })}</span>}
        {reviewing && <span className="chip">{t('proof under review')}</span>}
        {focusMins > 0 && (
          <span className="chip" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
            {t('⏱ {n}m focused', { n: focusMins })}
          </span>
        )}
        {c.status === 'ACTIVE' && !pending && (
          <Link
            to={`/focus?commitment=${c.id}`}
            className="chip"
            style={{ background: 'var(--paper-warm)', color: 'var(--ink)', textDecoration: 'none' }}
          >
            <AppIcon name="focus" size={16} /> {t('Focus Room')} {fwdArrow()}
          </Link>
        )}
        {pending && <span className="chip">{t('checking on {name}…', { name: catName })}</span>}
      </div>

      {showBanner === 'success' && (
        <SketchCard variant="a" className="success-card">
          <h2>{t('You did it.')}</h2>
          <p>{t('Your {amount} are safe.', { amount: amountLabel })}</p>
          {honor && c.starter && <p>{t('+{n} PURR for keeping a starter pact.', { n: HONOR_STARTER_BONUS })}</p>}
          {c.reviewedBy === 'witness' && <p className="muted">{t('Your witness approved your proof.')}</p>}
          {c.reviewedBy === 'admin' && <p className="muted">{t('The Purrpose team approved your proof.')}</p>}
          {c.reviewedBy === 'auto' && <p className="muted">{t('Nobody objected within 48 hours, so it counts.')}</p>}
          <div style={{ marginTop: 8 }}>
            <span className="stamp">{t('KEPT')}</span>
          </div>
          <p className="muted">{t('“…maybe next time.” — {name}, walking away', { name: catName })}</p>
        </SketchCard>
      )}
      {showBanner === 'failure' && (
        <SketchCard variant="a" className="error-box">
          <h2>{t('The cat won.')}</h2>
          <p>
            {honor
              ? t('You didn’t make it. {name} took your {amount}.', { name: catName, amount: amountLabel })
              : t("You didn't do it. But your {amount} will feed a cat.", { amount: amountLabel })}
          </p>
          {c.reviewedBy && c.reviewedBy !== 'auto' && (
            <p className="muted">
              {c.reviewedBy === 'witness' ? t('Your witness didn’t accept the proof.') : t('The Purrpose team didn’t accept the proof.')}
              {c.reviewNote ? ` ${t('“{note}”', { note: c.reviewNote })}` : ''}
            </p>
          )}
          <span className="stamp stamp-fed">{t('FED')}</span>
        </SketchCard>
      )}

      {showBanner && (
        <div className="result-actions">
          <DoodleButton href={`/new?cat=${c.catId}`} variant="primary">
            <AppIcon name="paw" size={18} /> {t('New pact with {name}', { name: catName })}
          </DoodleButton>
          <DoodleButton onClick={() => void onShare()} disabled={shareState === 'busy'}>
            {shareState === 'busy' ? t('Drawing…') : shareState === 'done' ? t('✓ Shared') : <><AppIcon name="share" size={18} /> {t('Share')}</>}
          </DoodleButton>
          <DoodleButton href="/pacts">{t('All commitments')}</DoodleButton>
        </div>
      )}

      {reviewing && (
        <SketchCard variant="b" className="review-card">
          <h3 style={{ marginTop: 0 }}>{t('Proof sent')}</h3>
          <p style={{ margin: '0 0 6px' }}>
            {c.witnessEmail
              ? t('Waiting for your witness to say yes or no.')
              : t('Waiting for the Purrpose team to check it.')}
          </p>
          {c.reviewDueAtISO && (
            <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
              {t('If nobody answers by {date}, it counts.', { date: fmtDateTime(c.reviewDueAtISO, { dateStyle: 'medium', timeStyle: 'short' }) })}
            </p>
          )}
          {proofPhoto && <img className="proof-thumb" src={proofPhoto} alt={t('Your photo')} />}
        </SketchCard>
      )}

      {c.status === 'ACTIVE' && c.witnessEmail && c.witnessToken && (
        <WitnessLink token={c.witnessToken} email={c.witnessEmail} title={c.title} />
      )}

      <section
        ref={sceneRef}
        data-tour="pact-scene"
        className="stage"
        aria-label={t('{name} in {room}', { name: catName, room: t(view.stage.label) })}
        style={{ padding: 4 }}
      >
        <CatScene
          catId={c.catId}
          state={sceneState}
          phaseRatio={view.phaseRatio}
          seed={view.seed}
          reduced={reduced}
          hour={localHour(nowMs)}
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

      {c.status === 'ACTIVE' && !pending && !reviewing && (
        <div data-tour="pact-stages">
          <StagePath stage={view.stage} nextStageInMs={view.nextStageInMs} />
        </div>
      )}

      {c.status === 'ACTIVE' && !pending && !reviewing && !showBanner && (
        <>
          {c.proofRequired ? (
            <div data-tour="pact-did-it">
              <DoodleButton variant="primary" size="big" onClick={() => setProofOpen(true)}>
                {t('I DID IT')}
              </DoodleButton>
              <ProofForm
                open={proofOpen}
                commitment={c}
                onClose={() => setProofOpen(false)}
                onSent={() => {
                  setProofOpen(false);
                  invalidateAll();
                }}
                onLate={() => {
                  setProofOpen(false);
                  notifyFailure(id ?? '');
                  playEnding('failure');
                  invalidateAll();
                }}
              />
            </div>
          ) : !confirming ? (
            <div data-tour="pact-did-it">
              <DoodleButton variant="primary" size="big" onClick={() => setConfirming(true)}>
                {t('I DID IT')}
              </DoodleButton>
            </div>
          ) : (
            <SketchCard variant="c">
              <h3>{t('Did you actually finish it?')}</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <DoodleButton
                  variant="primary"
                  disabled={complete.isPending}
                  onClick={() => {
                    setConfirming(false);
                    complete.mutate();
                  }}
                >
                  {t('Yes, I did')}
                </DoodleButton>
                <DoodleButton onClick={() => setConfirming(false)}>{t('Not yet')}</DoodleButton>
              </div>
            </SketchCard>
          )}
        </>
      )}

      {c.status === 'ACTIVE' && !pending && !reviewing && (
        <GraceDelete createdMs={view.createdMs} nowMs={nowMs} busy={remove.isPending} onDelete={() => remove.mutate()} />
      )}
    </main>
  );
}
