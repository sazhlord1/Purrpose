import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CREDIT_TYPE_LABELS,
  type ConsequenceType,
  type HistoryEntry,
  type HistoryResponse,
} from '@purrpose/shared';
import { api } from '../lib/api.js';
import { fmtDate } from '../lib/format.js';
import { Chip, SketchCard, Stamp, Skeleton } from '../components/ui/index.js';
import { CanTin, CatFace, KibbleBag, VetCare } from '../components/doodles/index.js';

type FilterType = 'all' | 'fed' | 'topup';

const FILTERS: Array<{ id: FilterType; label: string }> = [
  { id: 'all', label: 'All Receipts' },
  { id: 'fed', label: 'Feast Receipts (Fed)' },
  { id: 'topup', label: 'Top-up History' },
];

const DOODLE_BY_TYPE = {
  MEALS: CanTin,
  DRY_FOOD: KibbleBag,
  VET_CARE: VetCare,
};

const PAGE_SIZE = 15;

function filterEntries(entries: HistoryEntry[], filter: FilterType): HistoryEntry[] {
  if (filter === 'fed') return entries.filter(e => e.type === 'FAILURE_DEDUCTION');
  if (filter === 'topup') return entries.filter(e => e.type === 'TOPUP' || e.type === 'STARTER_GRANT');
  return entries;
}

const EMPTY_COPY: Record<FilterType, string> = {
  all: 'Nothing here yet. Your first receipt appears when a cat eats or you top up.',
  fed: 'No fed receipts yet. Miss a deadline and your cat will leave one.',
  topup: 'No top-ups yet. Your pantry is waiting.',
};

const ENTRY_STAMP: Partial<Record<HistoryEntry['type'], { label: string; kind: 'fed' | 'kept'; bg: string }>> = {
  FAILURE_DEDUCTION: { label: 'FED', kind: 'fed', bg: '#FFFDF8' },
  TOPUP: { label: 'TOP-UP', kind: 'kept', bg: '#FFF8E7' },
  STARTER_GRANT: { label: 'STARTER', kind: 'kept', bg: '#FFF8E7' },
};

export function Impact() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);

  const history = useQuery({
    queryKey: ['history'],
    queryFn: () => api<HistoryResponse>('/history'),
  });

  const data = history.data;

  if (history.isLoading)
    return (
      <main>
        <h1>Your Impact</h1>
        <Skeleton h={110} />
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} h={52} />
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          counting kibble…
        </p>
      </main>
    );

  if (!data)
    return (
      <main>
        <h1>Your Impact</h1>
        <p className="muted">The ledger wandered off.</p>
      </main>
    );

  const { totals } = data;
  const donatedLines = Object.entries(totals.donatedByType).filter(([, v]) => v > 0);
  const filtered = filterEntries(data.entries, filter);
  const paged = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  return (
    <main>
      <h1>Your Impact</h1>

      <SketchCard variant="a">
        <div className="row">
          <strong style={{ fontSize: 20 }}>{totals.completed}</strong>
          <span>commitments kept</span>
        </div>
        <div className="row">
          <strong style={{ fontSize: 20, color: 'var(--stamp-red)' }}>{totals.failed}</strong>
          <span>times the cat won</span>
        </div>
        {donatedLines.length === 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>
            No cats fed yet. Keep procrastinating — this section fills up when you don't.
          </p>
        ) : (
          donatedLines.map(([type, amount]) => {
            const Icon = DOODLE_BY_TYPE[type as ConsequenceType] ?? CanTin;
            return (
              <div className="row" key={type}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={20} strokeWidth={2.2} />
                  {amount} {CREDIT_TYPE_LABELS[type as keyof typeof CREDIT_TYPE_LABELS]}
                </span>
                <Stamp kind="fed" />
              </div>
            );
          })
        )}
      </SketchCard>

      <div className="chip-row" role="group" aria-label="Filter history" style={{ marginTop: 16 }}>
        {FILTERS.map(f => (
          <Chip
            key={f.id}
            active={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setPage(0);
            }}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <section>
        {paged.length === 0 ? (
          <SketchCard variant="b" style={{ textAlign: 'center', padding: 32 }}>
            <CatFace size={48} />
            <p className="muted" style={{ marginTop: 12 }}>
              {EMPTY_COPY[filter]}
            </p>
          </SketchCard>
        ) : (
          <>
            {paged.map(e => {
              const stamp = ENTRY_STAMP[e.type];
              const Icon = DOODLE_BY_TYPE[e.creditType] ?? CanTin;
              return (
                <article
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: '1px dashed rgba(26,26,26,0.15)',
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50% 45% 55% 50%',
                      background: stamp?.bg ?? '#FFFDF8',
                      border: '2px solid var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 16 }}>
                        {e.amount} {CREDIT_TYPE_LABELS[e.creditType]}
                      </strong>
                      {stamp && (
                        <Stamp kind={stamp.kind} style={{ fontSize: 11, padding: '2px 8px' }}>
                          {stamp.label}
                        </Stamp>
                      )}
                    </div>
                    {e.title && (
                      <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>
                        "{e.title}"
                      </p>
                    )}
                    <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {fmtDate(e.atISO)}
                    </p>
                  </div>
                </article>
              );
            })}

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="btn" onClick={() => setPage(p => p + 1)}>
                  Load more ({filtered.length - paged.length} left)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
