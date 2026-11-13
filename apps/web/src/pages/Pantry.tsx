import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FC } from 'react';
import {
  BAZAAR_FOOD_SKU,
  FOOD_PRICES,
  FOOD_PRICES_IRT,
  usd,
  type ConsequenceType,
  type HistoryResponse,
} from '@purrpose/shared';
import { Link } from 'react-router-dom';
import { AppIcon, type IconName } from '@purrpose/cats';
import { api, ApiError } from '../lib/api.js';
import { canBuyHere, goToCheckout } from '../lib/payments.js';
import { bazaarApp, bazaarFailure, buyWithBazaar, restoreBazaarPurchases } from '../lib/bazaar.js';
import { IS_IR_EDITION } from '../lib/edition.js';
import { WebPayNote } from '../components/WebPayNote.js';
import { toman } from '../lib/format.js';
import { TestCardNote } from '../components/TestCardNote.js';
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
import { Tour } from '../components/Tour.js';
import { pantryTour } from '../lib/tours.js';

/** Coloured doodles for the three credit types (same look as the landing page). */
const CREDIT_ICON: Record<ConsequenceType, IconName> = { MEALS: 'meals', DRY_FOOD: 'dryFood', VET_CARE: 'vetCare' };
const MealsIcon: FC<DoodleProps> = ({ size }) => <AppIcon name="meals" size={size} />;
const DryFoodIcon: FC<DoodleProps> = ({ size }) => <AppIcon name="dryFood" size={size} />;
const VetCareIcon: FC<DoodleProps> = ({ size }) => <AppIcon name="vetCare" size={size} />;

interface PantryItemMeta {
  id: string;
  name: string;
  badge: string;
  icon: FC<DoodleProps>;
  creditType?: ConsequenceType;
  stock?: number;
}

/** Each item wears its icon's colour: the can's orange, the kibble bag's blue, the vet kit's red. */
const CONSEQUENCE_META: Record<ConsequenceType, { badge: string; icon: FC<DoodleProps>; accent: string; tint: string }> = {
  MEALS: { badge: 'Primary Stake', icon: MealsIcon, accent: '#E86A3A', tint: 'rgba(232, 106, 58, 0.10)' },
  DRY_FOOD: { badge: 'Daily Ration', icon: DryFoodIcon, accent: '#5B8FD6', tint: 'rgba(91, 143, 214, 0.12)' },
  VET_CARE: { badge: 'High Stakes', icon: VetCareIcon, accent: '#E0533C', tint: 'rgba(224, 83, 60, 0.10)' },
};

interface Purchase {
  n: number;
  kind: string;
  item: string;
  quantity: number;
  amountCents: number;
  currency: string;
  atISO: string;
}

const purchaseIcon = (p: Purchase): IconName =>
  p.kind === 'food' ? (CREDIT_ICON[p.item as ConsequenceType] ?? 'meals') : 'purr';
function purchaseName(p: Purchase): string {
  if (p.kind === 'food') {
    const name = foodName(p.item as ConsequenceType);
    return p.quantity > 1 ? t('{food} × {n}', { food: name, n: p.quantity }) : name;
  }
  return t('{n} PURR', { n: Number(p.item.replace('purr_', '')) || 0 });
}
function purchasePrice(p: Purchase): string {
  if (p.currency === 'irr') return toman(Math.round(p.amountCents / 10));
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.amountCents / 100);
}

export function Pantry() {
  const qc = useQueryClient();
  const me = useMe();
  const history = useQuery({ queryKey: ['history'], queryFn: () => api<HistoryResponse>('/history') });
  // Food is bought, not handed out: free top-ups only exist in sandbox (test) mode.
  const shop = useQuery({ queryKey: ['shop'], queryFn: () => api<{ paymentsMode: string; paymentsTest?: boolean }>('/shop') });
  const isAdmin = me.data?.user.role === 'ADMIN';
  // Real food for real money: Stripe, English version only.
  const canBuy = shop.data?.paymentsMode === 'stripe' && canBuyHere();
  // Iranian Android app: real food through Cafe Bazaar, one unit per purchase.
  const bazaar = useQuery({ queryKey: ['bazaar'], queryFn: () => api<{ enabled: boolean }>('/bazaar'), enabled: bazaarApp() });
  const canBuyBazaar = bazaarApp() && bazaar.data?.enabled === true;
  const canTopUp = !canBuy && !canBuyBazaar && (shop.data?.paymentsMode === 'sandbox' || isAdmin);

  const [selectedItem, setSelectedItem] = useState<PantryItemMeta | null>(null);
  const [showPurchases, setShowPurchases] = useState(false);
  const purchases = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api<{ purchases: Purchase[] }>('/purchases'),
    enabled: showPurchases,
  });
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

  const [needsAccount, setNeedsAccount] = useState(false);
  const buyFood = useMutation({
    mutationFn: (creditType: ConsequenceType) =>
      api<{ status: 'redirect'; url: string }>('/wallet/checkout', { method: 'POST', body: { creditType, quantity: amount } }),
    onSuccess: res => goToCheckout(res.url),
    onError: e => {
      if (e instanceof ApiError && e.code === 'ACCOUNT_REQUIRED') {
        setNeedsAccount(true);
        setNote(t('Create an account first, so what you buy is safe.'));
        return;
      }
      setNote(e instanceof ApiError ? e.message : t('Purchase failed.'));
    },
  });

  const refreshFood = () => {
    void qc.invalidateQueries({ queryKey: ['me'] });
    void qc.invalidateQueries({ queryKey: ['history'] });
  };
  // A Bazaar purchase that was paid but never credited (the app closed): finish it now.
  useEffect(() => {
    if (!canBuyBazaar) return;
    void restoreBazaarPurchases().then(done => {
      if (done.some(d => d.credited)) refreshFood();
    });
  }, [canBuyBazaar]);
  const buyBazaarFood = useMutation({
    mutationFn: (creditType: ConsequenceType) => buyWithBazaar(BAZAAR_FOOD_SKU[creditType]),
    onSuccess: (_res, creditType) => {
      setNote(t('{food}: one more in your pantry. Thank you!', { food: foodName(creditType) }));
      refreshFood();
    },
    onError: e => {
      const f = bazaarFailure(e);
      setNeedsAccount(Boolean(f.needsAccount));
      setNote(f.text);
    },
  });

  const openItemDetail = (item: PantryItemMeta) => {
    setAmount(canBuy ? 1 : 10);
    setNote(null);
    setNeedsAccount(false);
    setSelectedItem(item);
  };

  const openCreditSheet = (creditType: ConsequenceType) => {
    const meta = CONSEQUENCE_META[creditType];
    const balance = me.data?.balances.find(b => b.creditType === creditType);
    openItemDetail({
      id: creditType,
      name: foodName(creditType),
      badge: t(meta.badge),
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
        <DoodleButton onClick={() => setShowPurchases(true)}>{t('My purchases')}</DoodleButton>
      </div>

      <Tour id="pantry" steps={pantryTour()} />
      <div style={{ marginBottom: 20 }} data-tour="pantry-supplies">
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
              backgroundImage: `linear-gradient(${meta.tint}, ${meta.tint})`,
              transition: 'transform 110ms ease-out, box-shadow 110ms ease-out',
            }}
            onClick={() => openCreditSheet(b.creditType)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  flex: 'none',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: `2px solid ${meta.accent}`,
                  background: 'var(--paper)',
                }}
              >
                <Icon size={24} strokeWidth={2.2} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 17 }}>{foodName(b.creditType)}</strong>
                  <span
                    className="chip"
                    style={{ fontSize: 12, padding: '1px 9px', borderColor: meta.accent, color: meta.accent, background: 'transparent' }}
                  >
                    {t(meta.badge)}
                  </span>
                </span>
                <span style={{ fontSize: 14, color: 'var(--ink-soft, inherit)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span>
                    {t('at stake:')} <strong>{b.stakedActive}</strong>
                  </span>
                  <span>
                    {t('available:')} <strong>{b.available}</strong>
                  </span>
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                <AnimatedNumber value={b.amount} className="hand" style={{ fontSize: 26, color: meta.accent }} />
                <button
                  className="chip chip-active"
                  aria-label={t('Top up {food}', { food: foodName(b.creditType) })}
                  onClick={e => {
                    e.stopPropagation();
                    openCreditSheet(b.creditType);
                  }}
                  style={{ fontWeight: 'bold', fontSize: 15, padding: '2px 10px', background: meta.accent, borderColor: meta.accent, color: '#fff' }}
                >
                  +
                </button>
              </span>
            </div>
          </div>
        );
      })}


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

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <span className="chip chip-active">{selectedItem.badge}</span>
              {selectedItem.stock !== undefined && (
                <span className="chip">{t('In Pantry: {n}', { n: selectedItem.stock })}</span>
              )}
            </div>
            {selectedItem.creditType && canBuy && (() => {
              const price = FOOD_PRICES[selectedItem.creditType as ConsequenceType];
              const unit = { can: t('per can'), kg: t('per kg'), visit: t('per visit') }[price.unit];
              return (
                <div style={{ width: '100%', marginTop: 8 }}>
                  {shop.data?.paymentsTest && <TestCardNote />}
                  <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                    <span className="ltr">{usd(price.cents)}</span> {unit}
                  </p>
                  <AmountPicker value={amount} onChange={setAmount} max={price.maxQty} />
                  {note && (
                    <p className="form-error" role="status" style={{ marginTop: 10 }}>
                      {note} {needsAccount && <Link to="/login">{t('Create account / Sign in')}</Link>}
                    </p>
                  )}
                  <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <DoodleButton
                      variant="primary"
                      size="big"
                      disabled={buyFood.isPending}
                      onClick={() => selectedItem.creditType && buyFood.mutate(selectedItem.creditType)}
                    >
                      {buyFood.isPending ? '…' : t('Checkout · {total}', { total: usd(price.cents * amount) })}
                    </DoodleButton>
                    <DoodleButton onClick={() => setSelectedItem(null)}>{t('Close')}</DoodleButton>
                  </div>
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                    {t('Secure checkout by Stripe. Prices in US dollars.')}
                  </p>
                </div>
              );
            })()}
            {selectedItem.creditType && canBuyBazaar && (() => {
              const creditType = selectedItem.creditType as ConsequenceType;
              const unit = { can: t('per can'), kg: t('per kg'), visit: t('per visit') }[FOOD_PRICES[creditType].unit];
              return (
                <div style={{ width: '100%', marginTop: 8 }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                    {toman(FOOD_PRICES_IRT[creditType])} {unit}
                  </p>
                  {note && (
                    <p className="form-error" role="status" style={{ marginTop: 10 }}>
                      {note} {needsAccount && <Link to="/login">{t('Create account / Sign in')}</Link>}
                    </p>
                  )}
                  <div style={{ marginTop: 14, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <DoodleButton variant="primary" size="big" disabled={buyBazaarFood.isPending} onClick={() => buyBazaarFood.mutate(creditType)}>
                      {buyBazaarFood.isPending ? '…' : t('Buy one · {price}', { price: toman(FOOD_PRICES_IRT[creditType]) })}
                    </DoodleButton>
                    <DoodleButton onClick={() => setSelectedItem(null)}>{t('Close')}</DoodleButton>
                  </div>
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>{t('Paid securely through Cafe Bazaar.')}</p>
                </div>
              );
            })()}
            {selectedItem.creditType && !canTopUp && !canBuy && !canBuyBazaar && (
              <div style={{ width: '100%', marginTop: 8 }}>
                {IS_IR_EDITION && !bazaarApp() ? (
                  <WebPayNote />
                ) : (
                  <p className="card card-c" style={{ padding: '10px 12px', fontSize: 14 }} role="status">
                    {t('Buying real cat food opens soon. Until then, “on my word” pacts work with PURR.')}
                  </p>
                )}
                <DoodleButton onClick={() => setSelectedItem(null)}>{t('Close')}</DoodleButton>
              </div>
            )}
            {selectedItem.creditType && canTopUp && (
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

      <Sheet open={showPurchases} onClose={() => setShowPurchases(false)} title={t('My purchases')}>
        {purchases.isLoading && <Skeleton h={40} />}
        {purchases.isError && <p className="form-error">{t('Could not load your purchases. Try again.')}</p>}
        {purchases.data?.purchases.length === 0 && <p className="muted">{t('You haven’t bought anything yet.')}</p>}
        {purchases.data?.purchases.map(p => (
          <div className="row" key={p.n}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppIcon name={purchaseIcon(p)} size={20} />
              <span>
                <strong>{purchaseName(p)}</strong>
                <span className="muted" style={{ display: 'block', fontSize: 12.5 }}>
                  {fmtDate(p.atISO)}
                </span>
              </span>
            </span>
            <span style={{ fontWeight: 600 }}>{purchasePrice(p)}</span>
          </div>
        ))}
      </Sheet>
    </main>
  );
}
