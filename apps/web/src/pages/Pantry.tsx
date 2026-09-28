import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FC } from 'react';
import {
  CREDIT_TYPE_ICONS,
  CREDIT_TYPE_LABELS,
  type ConsequenceType,
  type HistoryResponse,
} from '@purrpose/shared';
import { api } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { fmtDate } from '../lib/format.js';
import {
  AmountPicker,
  AnimatedNumber,
  DoodleButton,
  Sheet,
  SketchCard,
  Skeleton,
} from '../components/ui/index.js';
import {
  BowlEmpty,
  CanTin,
  KibbleBag,
  VetCare,
  type DoodleProps,
} from '../components/doodles/index.js';

interface PantryItemMeta {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: FC<DoodleProps>;
  creditType?: ConsequenceType;
  stock?: number;
}

const CONSEQUENCE_META: Record<ConsequenceType, { description: string; badge: string; icon: FC<DoodleProps> }> = {
  MEALS: {
    description: 'Gourmet wet food feast — your prime currency staked against procrastination.',
    badge: 'Primary Stake',
    icon: CanTin,
  },
  DRY_FOOD: {
    description: 'Crispy crunchy kibble that keeps feline energy steady for long stakeouts.',
    badge: 'Daily Ration',
    icon: KibbleBag,
  },
  VET_CARE: {
    description: 'Comprehensive medical wellness and checkups for absolute peace of mind.',
    badge: 'High Stakes',
    icon: VetCare,
  },
};

export function Pantry() {
  const qc = useQueryClient();
  const me = useMe();
  const history = useQuery({ queryKey: ['history'], queryFn: () => api<HistoryResponse>('/history') });

  const [selectedItem, setSelectedItem] = useState<PantryItemMeta | null>(null);
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState<string | null>(null);
  const [fallKey, setFallKey] = useState(0);
  const prevBalances = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    if (!me.data) return;
    const cur = Object.fromEntries(me.data.balances.map(b => [b.creditType, b.amount]));
    const prev = prevBalances.current;
    if (prev && Object.keys(cur).some(k => cur[k] < (prev[k] ?? 0))) {
      setFallKey(k => k + 1);
    }
    prevBalances.current = cur;
  }, [me.data]);

  const topUp = useMutation({
    mutationFn: (creditType: ConsequenceType) =>
      api<{ amount: number }>('/wallet/topup', {
        method: 'POST',
        body: { creditType, amount },
      }),
    onSuccess: (res, creditType) => {
      setNote(`${CREDIT_TYPE_LABELS[creditType]} topped up to ${res.amount}.`);
      setSelectedItem(null);
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['history'] });
    },
    onError: () => setNote('Top-up failed. Even imaginary economies have banks.'),
  });

  const openItemDetail = (item: PantryItemMeta) => {
    setAmount(10);
    setNote(null);
    setSelectedItem(item);
  };

  const openCreditSheet = (creditType: ConsequenceType) => {
    const meta = CONSEQUENCE_META[creditType];
    const balance = me.data?.balances.find(b => b.creditType === creditType);
    openItemDetail({
      id: creditType,
      name: CREDIT_TYPE_LABELS[creditType],
      badge: meta.badge,
      description: meta.description,
      icon: meta.icon,
      creditType,
      stock: balance?.amount ?? 0,
    });
  };

  const recent = (history.data?.entries ?? []).slice(0, 5);

  return (
    <main>
      <h1>
        Your Pantry{' '}
        {fallKey > 0 && (
          <span key={fallKey} className="falling-bowl" aria-hidden>
            <BowlEmpty size={26} />
          </span>
        )}
      </h1>
      <div className="chip-row">
        <DoodleButton href="/shop" variant="primary">
          🪙 {me.data?.purr ?? 0} PURR · Cat Shop →
        </DoodleButton>
        <span className="chip">click any item to inspect</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>Consequence Supplies</h2>
        <p className="muted" style={{ marginTop: -6 }}>
          Items staked in your commitments. When you procrastinate, your cat feasts on these.
        </p>
      </div>

      {me.isLoading &&
        [0, 1, 2].map(i => (
          <div className="card card-b" key={i} style={{ padding: '12px 16px' }}>
            <Skeleton h={26} w="45%" />
            <div style={{ marginTop: 8 }}>
              <Skeleton h={13} w="60%" />
            </div>
          </div>
        ))}

      {me.isError && (
        <SketchCard variant="b" className="error-box">
          <p>The pantry door is stuck.</p>
          <DoodleButton onClick={() => void me.refetch()}>Try again</DoodleButton>
        </SketchCard>
      )}

      {(me.data?.balances ?? []).map(b => {
        const meta = CONSEQUENCE_META[b.creditType];
        const Icon = meta.icon;
        return (
          <div
            className="card card-b"
            key={b.creditType}
            style={{
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'transform 110ms ease-out, box-shadow 110ms ease-out',
            }}
            onClick={() => openCreditSheet(b.creditType)}
          >
            <div className="row" style={{ borderBottom: 'none', padding: '2px 0', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: '50% 45% 55% 50%',
                    border: '1.5px solid var(--ink)',
                    background: 'var(--paper)',
                  }}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <span>
                  <strong style={{ fontSize: 17 }}>{CREDIT_TYPE_LABELS[b.creditType]}</strong>
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <AnimatedNumber value={b.amount} className="hand" style={{ fontSize: 24 }} />
                <button
                  className="chip chip-active"
                  aria-label={`Top up ${CREDIT_TYPE_LABELS[b.creditType]}`}
                  onClick={e => {
                    e.stopPropagation();
                    openCreditSheet(b.creditType);
                  }}
                  style={{ fontWeight: 'bold', fontSize: 15, padding: '2px 10px' }}
                >
                  +
                </button>
              </span>
            </div>
            <div style={{ margin: '4px 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="chip" style={{ fontSize: 11, padding: '1px 8px' }}>
                {meta.badge}
              </span>
              <span className="muted" style={{ fontSize: 13, lineHeight: 1.35 }}>
                {meta.description}
              </span>
            </div>
            <div
              className="muted"
              style={{
                fontSize: 12.5,
                display: 'flex',
                gap: 16,
                borderTop: '1px dashed rgba(26,26,26,0.2)',
                paddingTop: 6,
              }}
            >
              <span>
                at stake: <strong>{b.stakedActive}</strong>
              </span>
              <span>
                available: <strong>{b.available}</strong>
              </span>
              <span style={{ marginLeft: 'auto', textDecoration: 'underline' }}>tap to top up →</span>
            </div>
          </div>
        );
      })}

      <p className="muted" style={{ fontSize: 13 }}>
        Available = balance − active stakes. That's the part you can still promise to cats.
      </p>

      <SketchCard variant="a">
        <h2>Recent activity</h2>
        {recent.length === 0 && <p className="muted">Nothing yet.</p>}
        {recent.map(e => (
          <div className="row" key={e.id}>
            <span>
              {CREDIT_TYPE_ICONS[e.creditType]} {e.amount > 0 ? e.amount : ''}{' '}
              {CREDIT_TYPE_LABELS[e.creditType]}
              {e.type === 'FAILURE_DEDUCTION' && ' — fed a cat'}
              {e.type === 'TOPUP' && ' — top-up'}
              {e.type === 'STARTER_GRANT' && ' — starter pantry'}
              <span className="muted"> · {fmtDate(e.atISO)}</span>
            </span>
          </div>
        ))}
        {note && (
          <p className="muted" role="status">
            {note}
          </p>
        )}
      </SketchCard>

      {/* Rich Item Detail & Preview Sheet */}
      <Sheet
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name ?? 'Item Details'}
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: 110,
                height: 110,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--paper)',
                border: '2.5px solid var(--ink)',
                borderRadius: '50% 46% 54% 50%',
                boxShadow: 'var(--shadow)',
                margin: '8px 0 16px',
              }}
            >
              <selectedItem.icon size={68} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span className="chip chip-active">{selectedItem.badge}</span>
              {selectedItem.stock !== undefined && (
                <span className="chip">In Pantry: {selectedItem.stock}</span>
              )}
            </div>

            <p
              style={{
                fontSize: 15,
                lineHeight: 1.45,
                color: 'var(--ink)',
                maxWidth: 380,
                margin: '4px 0 16px',
                fontWeight: 500,
              }}
            >
              {selectedItem.description}
            </p>

            {selectedItem.creditType && (
              <div style={{ width: '100%', marginTop: 8 }}>
                <p className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
                  Select top-up amount for {selectedItem.name}:
                </p>
                <AmountPicker value={amount} onChange={setAmount} />
                <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <DoodleButton
                    variant="primary"
                    size="big"
                    onClick={() => selectedItem.creditType && topUp.mutate(selectedItem.creditType)}
                  >
                    Add {amount} to pantry
                  </DoodleButton>
                  <DoodleButton onClick={() => setSelectedItem(null)}>Close</DoodleButton>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </main>
  );
}
