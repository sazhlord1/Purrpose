import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cat, CatScene, ItemIcon } from '@purrpose/cats';
import {
  CATEGORY_FROM_STAGE,
  type CatId,
  type ItemCategory,
  type ItemId,
  type ItemSlot,
  type Loadout,
  type PaymentsMode,
  type PurrPack,
  type ShopItem,
} from '@purrpose/shared';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';

interface ShopResponse {
  purr: number;
  paymentsMode: PaymentsMode;
  packs: PurrPack[];
  cats: Array<{ id: CatId; name: string; type: string; personality: string; pricePurr: number; owned: boolean }>;
  items: Array<ShopItem & { owned: boolean }>;
  loadout: Loadout;
}

type Section = 'cats' | ItemCategory | 'purr';

/** Each section has its own colour, taken from its icon; Get PURR is always purple. */
const SECTION_META: Record<Section, { icon: string; title: string; hint: string; bg: string }> = {
  cats: { icon: '🐱', title: 'Cats', hint: 'Unlock new companions for your pacts', bg: '#FFF1C2' },
  toys: { icon: '🧶', title: 'Toys', hint: 'One toy at a time — drag it around the room', bg: '#FFDDC7' },
  bowls: { icon: '🥣', title: 'Bowls', hint: 'Its food bowl — shows from the yard (stage 2)', bg: '#D8E9FA' },
  comfort: { icon: '🛏️', title: 'Comfort', hint: 'Bed, blanket, scratcher — once it lives indoors (stage 3)', bg: '#DDEFD6' },
  wearables: { icon: '🎀', title: 'Wearables', hint: 'Collar or bow tie — once it has a home (stage 3)', bg: '#FADCE7' },
  decor: { icon: '🪴', title: 'Room decor', hint: 'Plant, fish tank, paintings, clock — drag to rearrange', bg: '#D7EFE8' },
  purr: { icon: '🪙', title: 'Get PURR', hint: 'Top up your balance', bg: '#7E57C2' },
};

const SECTION_ORDER: Section[] = ['cats', 'toys', 'bowls', 'comfort', 'wearables', 'decor', 'purr'];

/** Preview a stage where the category is visible. */
function previewRatio(category: ItemCategory): number {
  const stage = Math.max(CATEGORY_FROM_STAGE[category], 3);
  return stage === 3 ? 0.5 : 0.7;
}

function isSection(v: string | null): v is Section {
  return v !== null && (SECTION_ORDER as string[]).includes(v);
}

export function Shop() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const focusCat = params.get('cat');
  const raw = params.get('section');
  const section: Section | null = isSection(raw) ? raw : focusCat ? 'cats' : null;
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [trying, setTrying] = useState<ShopItem | null>(null);
  const shop = useQuery({ queryKey: ['shop'], queryFn: () => api<ShopResponse>('/shop') });

  const open = (s: Section | null) => {
    setMessage(null);
    setTrying(null);
    setParams(s ? { section: s } : {});
    window.scrollTo({ top: 0 });
  };

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['shop'] });
    void qc.invalidateQueries({ queryKey: ['me'] });
  };
  const fail = (e: unknown) => setMessage({ kind: 'err', text: e instanceof ApiError ? e.message : 'Something went wrong.' });

  const unlock = useMutation({
    mutationFn: (catId: CatId) => api<{ catId: CatId; purr: number }>('/shop/unlock', { method: 'POST', body: { catId } }),
    onSuccess: res => {
      const name = shop.data?.cats.find(c => c.id === res.catId)?.name ?? 'Your new cat';
      setMessage({ kind: 'ok', text: `${name} moved in! Pick them for your next pact.` });
      refresh();
    },
    onError: fail,
  });

  const buyItem = useMutation({
    mutationFn: (itemId: ItemId) =>
      api<{ itemId: ItemId; purr: number; loadout: Loadout }>('/shop/items/buy', { method: 'POST', body: { itemId } }),
    onSuccess: res => {
      const name = shop.data?.items.find(i => i.id === res.itemId)?.name ?? 'Your item';
      setMessage({ kind: 'ok', text: `${name} is yours and in use.` });
      setTrying(null);
      refresh();
    },
    onError: fail,
  });

  const equip = useMutation({
    mutationFn: (v: { slot: ItemSlot; itemId: ItemId | null }) =>
      api<{ loadout: Loadout }>('/shop/items/equip', { method: 'POST', body: v }),
    onSuccess: () => refresh(),
    onError: fail,
  });

  const buyPack = useMutation({
    mutationFn: (packId: string) => api<{ status: string; purr: number }>('/shop/checkout', { method: 'POST', body: { packId } }),
    onSuccess: res => {
      setMessage({ kind: 'ok', text: `Done! You now have ${res.purr} PURR.` });
      refresh();
    },
    onError: e =>
      setMessage({
        kind: 'err',
        text: e instanceof ApiError && e.code === 'PAYMENTS_UNAVAILABLE' ? 'Buying PURR is coming soon.' : 'Purchase failed.',
      }),
  });

  if (shop.isLoading) return <main><p className="muted">opening the shop…</p></main>;
  if (shop.isError || !shop.data) return <main><p className="muted">The shop is closed for a nap. Try again soon.</p></main>;

  const { purr, cats, packs, paymentsMode, items, loadout } = shop.data;

  const balance = (
    <div className="shop-balance">
      <span className="purr-balance">🪙 {purr}</span>
      <span className="muted">PURR</span>
      {section !== 'purr' && (
        <button type="button" className="chip chip-purr" onClick={() => open('purr')}>
          + Get PURR
        </button>
      )}
    </div>
  );

  const status = message && (
    <p role="status" className={message.kind === 'err' ? 'form-error' : 'muted'} style={{ fontWeight: 600 }}>
      {message.text}
    </p>
  );

  // ── Menu ──────────────────────────────────────────────────────────────────
  if (!section) {
    const countFor = (s: Section): string => {
      if (s === 'cats') return `${cats.filter(c => c.owned).length}/${cats.length}`;
      if (s === 'purr') return '';
      const list = items.filter(i => i.category === s);
      return `${list.filter(i => i.owned).length}/${list.length}`;
    };
    return (
      <main>
        <h1>Cat Shop</h1>
        {balance}
        <nav className="shop-menu" aria-label="Shop sections">
          {SECTION_ORDER.map(s => (
            <button
              key={s}
              type="button"
              className={`shop-menu-row ${s === 'purr' ? 'shop-menu-purr' : ''}`}
              style={{ background: SECTION_META[s].bg }}
              onClick={() => open(s)}
            >
              <span className="shop-menu-icon" aria-hidden>
                {SECTION_META[s].icon}
              </span>
              <span className="shop-menu-text">
                <strong>{SECTION_META[s].title}</strong>
                <span className="muted">{SECTION_META[s].hint}</span>
              </span>
              {countFor(s) && <span className="chip">{countFor(s)}</span>}
              <span aria-hidden>›</span>
            </button>
          ))}
        </nav>
        <p className="muted" style={{ fontSize: 13 }}>
          Items are just for fun — they never change your stakes or deadlines.
        </p>
      </main>
    );
  }

  const meta = SECTION_META[section];
  const header = (
    <>
      <button type="button" className="linklike shop-back" onClick={() => open(null)}>
        ← Shop
      </button>
      <h1 className="shop-section-title" style={{ marginTop: 4, background: meta.bg }} data-purr={section === 'purr' || undefined}>
        {meta.icon} {meta.title}
      </h1>
      {balance}
      {status}
    </>
  );

  // ── Cats ──────────────────────────────────────────────────────────────────
  if (section === 'cats') {
    return (
      <main>
        {header}
        <div className="shop-grid">
          {cats.map(cat => {
            const affordable = purr >= cat.pricePurr;
            return (
              <div key={cat.id} id={`shop-cat-${cat.id}`} className={`shop-cat ${cat.owned ? '' : 'locked'} ${focusCat === cat.id ? 'equipped' : ''}`}>
                <Cat catId={cat.id} state="WAITING" size={100} />
                <strong>{cat.name}</strong>
                <span className="muted" style={{ fontSize: 12 }}>{cat.personality}</span>
                {cat.owned ? (
                  <span className="stamp" style={{ fontSize: 13 }}>{cat.pricePurr === 0 ? 'FREE' : 'OWNED'}</span>
                ) : (
                  <DoodleButton
                    variant={affordable ? 'primary' : 'ghost'}
                    disabled={!affordable || unlock.isPending}
                    onClick={() => unlock.mutate(cat.id)}
                    ariaLabel={`Unlock ${cat.name} for ${cat.pricePurr} PURR`}
                  >
                    🔓 {cat.pricePurr}
                  </DoodleButton>
                )}
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // ── PURR packs ────────────────────────────────────────────────────────────
  if (section === 'purr') {
    return (
      <main>
        {header}
        {paymentsMode === 'disabled' && <p className="muted">Buying PURR is coming soon.</p>}
        {paymentsMode === 'sandbox' && <p className="muted">Test mode: purchases are free and nothing is charged.</p>}
        <div className="shop-grid">
          {packs.map(pack => (
            <div key={pack.id} className="shop-cat">
              <div className="purr-balance" style={{ fontSize: 26 }}>🪙 {pack.purr}</div>
              {pack.bonusLabel && <span className="chip">{pack.bonusLabel}</span>}
              <DoodleButton variant="primary" disabled={paymentsMode === 'disabled' || buyPack.isPending} onClick={() => buyPack.mutate(pack.id)}>
                {pack.priceLabel}
              </DoodleButton>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── An item category ──────────────────────────────────────────────────────
  const list = items.filter(i => i.category === section);
  const previewCat = cats.find(c => c.owned)?.id ?? 'orange';
  const previewLoadout: Loadout = trying ? { ...loadout, [trying.slot]: trying.id } : loadout;
  return (
    <main>
      {header}
      <p className="muted" style={{ marginTop: -4 }}>{meta.hint}.</p>
      <SketchCard variant="b" className="shop-preview">
        <CatScene catId={previewCat} state="WAITING" phaseRatio={previewRatio(section)} seed={4242} animateStages={false} items={previewLoadout} interactive />
        {trying && (
          <p className="muted" role="status" style={{ textAlign: 'center', margin: '6px 0 0' }}>
            Trying on <strong>{trying.name}</strong> ·{' '}
            <button type="button" className="linklike" onClick={() => setTrying(null)}>
              stop
            </button>
          </p>
        )}
      </SketchCard>
      <ul className="shop-list">
        {list.map(item => {
          const equipped = loadout[item.slot] === item.id;
          const affordable = purr >= item.pricePurr;
          return (
            <li key={item.id} className={`shop-row ${equipped ? 'equipped' : ''} ${trying?.id === item.id ? 'trying' : ''}`}>
              <button
                type="button"
                className="shop-row-main"
                onClick={() => setTrying(trying?.id === item.id ? null : item)}
                aria-label={`Preview ${item.name}`}
              >
                <span className="shop-icon-tile" style={{ background: meta.bg }}>
                  <ItemIcon id={item.id} size={48} />
                </span>
                <span className="shop-menu-text">
                  <strong>{item.name}</strong>
                  <span className="muted">{item.blurb}</span>
                </span>
              </button>
              {item.owned ? (
                <DoodleButton
                  variant={equipped ? 'ghost' : 'primary'}
                  disabled={equip.isPending}
                  onClick={() => equip.mutate({ slot: item.slot, itemId: equipped ? null : item.id })}
                >
                  {equipped ? 'Remove' : 'Use'}
                </DoodleButton>
              ) : (
                <DoodleButton
                  variant={affordable ? 'primary' : 'ghost'}
                  disabled={!affordable || buyItem.isPending}
                  onClick={() => buyItem.mutate(item.id)}
                  ariaLabel={`Buy ${item.name} for ${item.pricePurr} PURR`}
                >
                  🪙 {item.pricePurr}
                </DoodleButton>
              )}
            </li>
          );
        })}
      </ul>
      <p className="muted" style={{ fontSize: 13 }}>
        Tap an item to see it in the room before buying. <Link to="/">Back home</Link>
      </p>
    </main>
  );
}
