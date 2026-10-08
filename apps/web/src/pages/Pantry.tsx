import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FC } from 'react';
import {
  type ConsequenceType,
  type HistoryResponse,
} from '@purrpose/shared';
import { AppIcon, type IconName } from '@purrpose/cats';
import { api } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { fmtDate } from '../lib/format.js';
import { foodName, fwdArrow, t } from '../i18n/index.js';
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
  type DoodleProps,
} from '../components/doodles/index.js';

/** Coloured doodles for the three credit types (same look as the landing page). */
const CREDIT_ICON: Record<ConsequenceType, IconName> = { MEALS: 'meals', DRY_FOOD: 'dryFood', VET_CARE: 'vetCare' };
const MealsIcon: FC<DoodleProps> = ({ size }) => <AppIcon name="meals" size={size} />;
const DryFoodIcon: FC<DoodleProps> = ({ size }) => <AppIcon name="dryFood" size={size} />;
const VetCareIcon: FC<DoodleProps> = ({ size }) => <AppIcon name="vetCare" size={size} />;

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
    icon: MealsIcon,
  },
  DRY_FOOD: {
    description: 'Crispy crunchy kibble that keeps feline energy steady for long stakeouts.',
    badge: 'Daily Ration',
    icon: DryFoodIcon,
  },
  VET_CARE: {
    description: 'Comprehensive medical wellness and checkups for absolute peace of mind.',
    badge: 'High Stakes',
    icon: VetCareIcon,
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
      setNote(t('{food} topped up to {n}.', { food: foodName(creditType), n: res.amount }));
      setSelectedItem(null);
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['history'] });
    },
    onError: () => setNote(t('Top-up failed. Even imaginary economies have banks.')),
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
      name: foodName(creditType),
      badge: t(meta.badge),
      description: t(meta.description),
      icon: meta.icon,
      creditType,
      stock: balance?.amount ?? 0,
    });
  };

  const recent = (history.data?.entries ?? []).slice(0, 5);

  return (
    <main>
      <h1>
        {t('Your Pantry')}{' '}
        {fallKey > 0 && (
          <span key={fallKey} className="falling-bowl" aria-hidden>
            <BowlEmpty size={26} />
          </span>
        )}
      </h1>
      <div className="chip-row">
        <DoodleButton href="/shop" variant="primary">
          <AppIcon name="purr" size={18} /> {t('{n} PURR · Cat Shop', { n: me.data?.purr ?? 0 })} {fwdArrow()}
        </DoodleButton>
        <span className="chip">{t('click any item to inspect')}</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>{t('Consequence Supplies')}</h2>
        <p className="muted" style={{ marginTop: -6 }}>
          {t('Items staked in your commitments. When you procrastinate, your cat feasts on these.')}
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
          <p>{t('The pantry door is stuck.')}</p>
          <DoodleButton onClick={() => void me.refetch()}>{t('Try again')}</DoodleButton>
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
                  <strong style={{ fontSize: 17 }}>{foodName(b.creditType)}</strong>
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <AnimatedNumber value={b.amount} className="hand" style={{ fontSize: 24 }} />
                <button
                  className="chip chip-active"
                  aria-label={t('Top up {food}', { food: foodName(b.creditType) })}
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
                {t(meta.badge)}
              </span>
              <span className="muted" style={{ fontSize: 13, lineHeight: 1.35 }}>
                {t(meta.description)}
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
                {t('at stake:')} <strong>{b.stakedActive}</strong>
              </span>
              <span>
                {t('available:')} <strong>{b.available}</strong>
              </span>
              <span style={{ marginInlineStart: 'auto', textDecoration: 'underline' }}>
                {t('tap to top up')} {fwdArrow()}
              </span>
            </div>
          </div>
        );
      })}

      <p className="muted" style={{ fontSize: 13 }}>
        {t("Available = balance − active stakes. That's the part you can still promise to cats.")}
      </p>

      <SketchCard variant="a">
        <h2>{t('Recent activity')}</h2>
        {recent.length === 0 && <p className="muted">{t('Nothing yet.')}</p>}
        {recent.map(e => (
          <div className="row" key={e.id}>
            <span>
              <AppIcon name={CREDIT_ICON[e.creditType]} size={16} /> {e.amount > 0 ? e.amount : ''}{' '}
              {foodName(e.creditType)}
              {e.type === 'FAILURE_DEDUCTION' && ` — ${t('fed a cat')}`}
              {e.type === 'TOPUP' && ` — ${t('top-up')}`}
              {e.type === 'STARTER_GRANT' && ` — ${t('starter pantry')}`}
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
        title={selectedItem?.name ?? t('Item Details')}
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
                <span className="chip">{t('In Pantry: {n}', { n: selectedItem.stock })}</span>
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
                  {t('Select top-up amount for {name}:', { name: selectedItem.name })}
                </p>
                <AmountPicker value={amount} onChange={setAmount} />
                <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <DoodleButton
                    variant="primary"
                    size="big"
                    onClick={() => selectedItem.creditType && topUp.mutate(selectedItem.creditType)}
                  >
                    {t('Add {n} to pantry', { n: amount })}
                  </DoodleButton>
                  <DoodleButton onClick={() => setSelectedItem(null)}>{t('Close')}</DoodleButton>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </main>
  );
}
