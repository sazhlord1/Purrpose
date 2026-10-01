import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CAT_SEED, FREE_CAT_IDS, type CatId } from '@purrpose/shared';
import { api } from '../lib/api.js';
import { useCommitments, useMe } from '../lib/queries.js';
import { ambient } from '../lib/ambient.js';
import { FocusScene } from '../components/FocusScene.js';
import { AppIcon } from '@purrpose/cats';
import { DoodleButton, Chip, SketchCard, Field, Select } from '../components/ui/index.js';

type FocusStatus = 'idle' | 'focusing' | 'paused' | 'finished';

function fmtDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LEGACY_PREFIX = 'purrpose.focus_time.';

/** One-time move of focus minutes that older versions kept only in this browser. */
async function migrateLegacyFocusTime(): Promise<boolean> {
  let keys: string[] = [];
  try {
    keys = Object.keys(localStorage).filter(k => k.startsWith(LEGACY_PREFIX));
  } catch {
    return false;
  }
  for (const key of keys) {
    const secs = Math.min(12 * 3600, Math.floor(Number(localStorage.getItem(key)) || 0));
    const commitmentId = key.slice(LEGACY_PREFIX.length);
    if (secs > 0) {
      await api('/focus/sessions', {
        method: 'POST',
        body: {
          commitmentId,
          catId: 'orange',
          durationSec: secs,
          startedAtISO: new Date(Date.now() - secs * 1000).toISOString(),
        },
      }).catch(() => undefined); // commitment may be gone — nothing to keep then
    }
    localStorage.removeItem(key);
  }
  return keys.length > 0;
}

export function Focus() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const me = useMe();
  const unlocked: readonly string[] = me.data?.unlockedCatIds ?? FREE_CAT_IDS;
  const [status, setStatus] = useState<FocusStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const [selectedCat, setSelectedCat] = useState<CatId>(() => {
    if (typeof localStorage === 'undefined') return 'orange';
    const saved = localStorage.getItem('purrpose.focus_cat') as CatId;
    return (FREE_CAT_IDS as readonly string[]).includes(saved) ? saved : 'orange';
  });
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string>(() => params.get('commitment') ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const savedCatRef = useRef<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('purrpose.focus_cat') : null,
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [sessionSavedTime, setSessionSavedTime] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const commitments = useCommitments();
  const activeCommitments = (commitments.data?.commitments ?? []).filter(c => c.status === 'ACTIVE');

  useEffect(() => {
    void migrateLegacyFocusTime().then(moved => {
      if (moved) void qc.invalidateQueries({ queryKey: ['focus-summary'] });
    });
  }, [qc]);

  // Restore a saved premium companion once we know it's unlocked.
  useEffect(() => {
    const saved = savedCatRef.current;
    if (saved && unlocked.includes(saved)) setSelectedCat(saved as CatId);
  }, [me.data]);

  // Persist selected cat
  useEffect(() => {
    localStorage.setItem('purrpose.focus_cat', selectedCat);
  }, [selectedCat]);

  // Zen Mode toggle class on body
  useEffect(() => {
    if (zenMode) {
      document.body.classList.add('zen-active');
    } else {
      document.body.classList.remove('zen-active');
    }
    return () => document.body.classList.remove('zen-active');
  }, [zenMode]);

  // Stopwatch interval
  useEffect(() => {
    if (status === 'focusing') {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      ambient.stop();
    };
  }, []);

  const startFocus = () => {
    setStatus('focusing');
    setSessionSavedTime(null);
    setSaveError(null);
    startedAtRef.current = Date.now();
    if (soundEnabled) {
      ambient.startFocus();
    }
  };

  const pauseFocus = () => {
    setStatus('paused');
    if (soundEnabled) {
      ambient.pauseFocus();
    }
  };

  const resumeFocus = () => {
    setStatus('focusing');
    if (soundEnabled) {
      ambient.resumeFocus();
    }
  };

  const finishFocus = () => {
    const finalSeconds = seconds;
    setStatus('finished');
    setSessionSavedTime(finalSeconds);

    if (soundEnabled) {
      ambient.finishFocus();
    } else {
      ambient.stop();
    }

    // Save the session on the server (linked to a commitment if one was picked).
    if (finalSeconds > 0) {
      const startedAt = startedAtRef.current ?? Date.now() - finalSeconds * 1000;
      api('/focus/sessions', {
        method: 'POST',
        body: {
          ...(selectedCommitmentId ? { commitmentId: selectedCommitmentId } : {}),
          catId: selectedCat,
          durationSec: Math.min(finalSeconds, 12 * 3600),
          startedAtISO: new Date(startedAt).toISOString(),
        },
      })
        .then(() => qc.invalidateQueries({ queryKey: ['focus-summary'] }))
        .catch(() => setSaveError('Could not save this session. Check your connection.'));
    }
  };

  const resetSession = () => {
    startedAtRef.current = null;
    setStatus('idle');
    setSeconds(0);
    setSessionSavedTime(null);
    ambient.stop();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (!next) {
      ambient.stop();
    } else if (status === 'focusing') {
      ambient.startFocus();
    } else if (status === 'paused') {
      ambient.resumeFocus();
    }
  };

  const isFocusing = status === 'focusing';
  const isFinished = status === 'finished';

  return (
    <main style={{ maxWidth: 440, margin: '0 auto', paddingBottom: zenMode ? 20 : undefined }}>
      {/* Floating Zen Toggle Button */}
      {zenMode && (
        <button
          className="btn btn-primary zen-floating-toggle"
          onClick={() => setZenMode(false)}
          aria-label="Exit Zen Mode"
        >
          ✕ Exit Zen
        </button>
      )}

      {/* Header (Hidden in Zen Mode) */}
      {!zenMode && (
        <header style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0 }}>Focus Room</h1>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="chip"
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Mute ambient sound' : 'Enable ambient sound'}
                style={{ fontWeight: 600 }}
              >
                {soundEnabled ? <><AppIcon name="sound" size={16} /> Sound on</> : <><AppIcon name="mute" size={16} /> Muted</>}
              </button>
              <button
                className="chip"
                onClick={() => setZenMode(z => !z)}
                aria-label="Toggle Zen mode"
              >
                <AppIcon name="expand" size={16} /> Zen
              </button>
            </div>
          </div>
          <p className="muted" style={{ margin: '4px 0 10px', fontSize: 13.5 }}>
            Open-ended cozy focus. Rainy window, warm lamp, and soothing purrs.
          </p>
        </header>
      )}

      {/* Main Focus Window Scene */}
      <section style={{ position: 'relative', marginBottom: 14 }}>
        <FocusScene
          catId={selectedCat}
          isFocusing={isFocusing}
          isFinished={isFinished}
          wear={{ collar: me.data?.loadout.neck === 'collar-bell', bow: me.data?.loadout.neck === 'bow-tie' }}
        />
      </section>

      {/* Stopwatch Timer Display */}
      <div
        style={{
          textAlign: 'center',
          padding: '12px 16px',
          background: 'var(--paper-raised)',
          border: '2px solid var(--ink)',
          borderRadius: 'var(--radius-sketch-a)',
          boxShadow: 'var(--shadow)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 48,
            fontWeight: 'bold',
            letterSpacing: '2px',
            color: isFocusing ? 'var(--accent-coral)' : isFinished ? 'var(--accent-green)' : 'var(--ink)',
            lineHeight: 1,
            margin: '4px 0 8px',
          }}
        >
          {fmtDuration(seconds)}
        </div>

        {/* Stopwatch Action Controls */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {status === 'idle' && (
            <DoodleButton variant="primary" size="big" onClick={startFocus}>
              ▶ Start Focus
            </DoodleButton>
          )}

          {status === 'focusing' && (
            <>
              <DoodleButton onClick={pauseFocus}>
                ⏸ Pause
              </DoodleButton>
              <DoodleButton variant="primary" size="big" onClick={finishFocus}>
                ✓ Finish
              </DoodleButton>
            </>
          )}

          {status === 'paused' && (
            <>
              <DoodleButton variant="primary" onClick={resumeFocus}>
                ▶ Resume
              </DoodleButton>
              <DoodleButton onClick={finishFocus}>
                ✓ Finish
              </DoodleButton>
            </>
          )}

          {status === 'finished' && (
            <DoodleButton variant="primary" onClick={resetSession}>
              + New Session
            </DoodleButton>
          )}
        </div>
      </div>

      {/* Post-Focus Summary & Fireflies Lore Card */}
      {isFinished && sessionSavedTime !== null && (
        <SketchCard variant="a" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, color: 'var(--accent-green)', margin: '0 0 4px' }}>
            <AppIcon name="sparkle" size={22} /> Focus complete!
          </h2>
          <p style={{ margin: '0 0 8px', fontSize: 14.5 }}>
            You stayed in deep flow for <strong>{fmtDuration(sessionSavedTime)}</strong>. The rain has stopped and fireflies are dancing outside the window.
          </p>
          {saveError && <p className="form-error">{saveError}</p>}
          {selectedCommitmentId && (
            <p className="chip" style={{ display: 'inline-block', background: 'var(--paper-warm)', fontSize: 12 }}>
              ⏱ Time added to: {activeCommitments.find(c => c.id === selectedCommitmentId)?.title}
            </p>
          )}
        </SketchCard>
      )}

      {/* Settings & Options (Only when not actively focusing & not in Zen) */}
      {!zenMode && status === 'idle' && (
        <div className="card card-b" style={{ padding: '14px 16px' }}>
          {/* 1. Companion Cat Selector */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
              Choose your focus companion:
            </span>
            <div className="chip-row" style={{ margin: 0 }}>
              {CAT_SEED.map(c =>
                unlocked.includes(c.id) ? (
                  <Chip key={c.id} active={selectedCat === c.id} onClick={() => setSelectedCat(c.id)}>
                    {c.name} ({c.type.toLowerCase()})
                  </Chip>
                ) : (
                  <Chip key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
                    🔒 {c.name} · {c.pricePurr}
                  </Chip>
                ),
              )}
            </div>
          </div>

          {/* 2. Link to Active Commitment */}
          {activeCommitments.length > 0 && (
            <Field label="Link this focus session to a task (optional):">
              <Select
                value={selectedCommitmentId}
                onChange={e => setSelectedCommitmentId(e.target.value)}
              >
                <option value="">-- No specific task (Pure Focus) --</option>
                {activeCommitments.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.consequenceAmount} meals at stake)
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}
    </main>
  );
}
