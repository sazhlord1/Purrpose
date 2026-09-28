import type { Prisma, PrismaClient } from '@prisma/client';
import {
  CAT_IDS,
  CAT_SEED,
  FREE_CAT_IDS,
  ITEM_IDS,
  PURR_PACKS,
  SHOP_ITEMS,
  catById,
  catItemId,
  itemById,
  itemLedgerId,
  purrPackById,
  sanitizeLoadout,
  type CatId,
  type ItemId,
  type ItemSlot,
  type Loadout,
  type PaymentsMode,
} from '@purrpose/shared';
import type { Role } from '../auth.js';
import { AppError } from '../errors.js';

type Db = PrismaClient | Prisma.TransactionClient;

export async function unlockedCatIds(db: Db, userId: string, role: Role | undefined): Promise<CatId[]> {
  if (role === 'ADMIN') return [...CAT_IDS];
  const rows = await db.catUnlock.findMany({ where: { userId }, select: { catId: true } });
  const owned = new Set<string>([...FREE_CAT_IDS, ...rows.map(r => r.catId)]);
  return CAT_IDS.filter(id => owned.has(id));
}

export async function assertCatUsable(db: Db, userId: string, role: Role | undefined, catId: string): Promise<void> {
  const cat = catById(catId);
  if (!cat) throw new AppError('NOT_FOUND', { catId }, 'Unknown cat');
  if (cat.pricePurr === 0 || role === 'ADMIN') return;
  const owned = await db.catUnlock.findUnique({ where: { userId_catId: { userId, catId } } });
  if (!owned) throw new AppError('CAT_LOCKED', { catId, pricePurr: cat.pricePurr }, `${cat.name} is locked`);
}

export async function ownedItemIds(db: Db, userId: string, role: Role | undefined): Promise<ItemId[]> {
  if (role === 'ADMIN') return [...ITEM_IDS];
  const rows = await db.itemUnlock.findMany({ where: { userId }, select: { itemId: true } });
  const owned = new Set(rows.map(r => r.itemId));
  return ITEM_IDS.filter(id => owned.has(id));
}

/** The equipped items, minus anything the user no longer owns or that isn't a real item. */
export async function userLoadout(db: Db, userId: string, role: Role | undefined): Promise<Loadout> {
  const [user, owned] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { loadout: true } }),
    ownedItemIds(db, userId, role),
  ]);
  const clean = sanitizeLoadout(user?.loadout);
  const ownedSet = new Set<string>(owned);
  for (const slot of Object.keys(clean) as ItemSlot[]) {
    if (!ownedSet.has(clean[slot] as string)) delete clean[slot];
  }
  return clean;
}

export async function shopView(prisma: PrismaClient, userId: string, role: Role | undefined, paymentsMode: PaymentsMode) {
  const [user, owned, items, loadout] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { purrBalance: true } }),
    unlockedCatIds(prisma, userId, role),
    ownedItemIds(prisma, userId, role),
    userLoadout(prisma, userId, role),
  ]);
  const ownedSet = new Set(owned);
  const ownedItems = new Set(items);
  return {
    purr: user?.purrBalance ?? 0,
    paymentsMode,
    packs: PURR_PACKS,
    loadout,
    items: SHOP_ITEMS.map(i => ({ ...i, owned: ownedItems.has(i.id) })),
    cats: CAT_SEED.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      personality: c.personality,
      pricePurr: c.pricePurr,
      owned: ownedSet.has(c.id),
    })),
  };
}

/** Spends PURR to unlock a cat. Atomic: balance check + debit + unlock + ledger in one txn. */
export async function unlockCat(prisma: PrismaClient, userId: string, role: Role | undefined, catId: CatId) {
  const cat = catById(catId);
  if (!cat) throw new AppError('NOT_FOUND', { catId }, 'Unknown cat');
  if (cat.pricePurr === 0 || role === 'ADMIN') {
    throw new AppError('ALREADY_OWNED', { catId }, `${cat.name} is already yours`);
  }

  return prisma.$transaction(async tx => {
    const already = await tx.catUnlock.findUnique({ where: { userId_catId: { userId, catId } } });
    if (already) throw new AppError('ALREADY_OWNED', { catId }, `${cat.name} is already yours`);
    await debitPurr(tx, userId, cat.pricePurr);
    // Composite primary key makes a double unlock impossible even under a race.
    await tx.catUnlock.create({ data: { userId, catId } });
    await tx.purrTransaction.create({
      data: { userId, type: 'SPEND', amount: cat.pricePurr, itemId: catItemId(catId) },
    });
    await tx.appEvent.create({ data: { userId, name: 'cat_unlocked', payload: { catId, price: cat.pricePurr } } });
    const after = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { purrBalance: true } });
    return { catId, purr: after.purrBalance };
  });
}

/** Guarded debit: only succeeds if the balance covers the price (no negative balances, no races). */
async function debitPurr(tx: Prisma.TransactionClient, userId: string, price: number): Promise<void> {
  const debit = await tx.user.updateMany({
    where: { id: userId, purrBalance: { gte: price } },
    data: { purrBalance: { decrement: price } },
  });
  if (debit.count !== 1) {
    const u = await tx.user.findUnique({ where: { id: userId }, select: { purrBalance: true } });
    throw new AppError('INSUFFICIENT_PURR', { needed: price, balance: u?.purrBalance ?? 0 }, `You need ${price} PURR`);
  }
}

/** Buys a shop item with PURR and equips it straight away. Same atomic pattern as unlockCat. */
export async function buyItem(prisma: PrismaClient, userId: string, role: Role | undefined, itemId: ItemId) {
  const item = itemById(itemId);
  if (!item) throw new AppError('NOT_FOUND', { itemId }, 'Unknown item');
  if (role === 'ADMIN') throw new AppError('ALREADY_OWNED', { itemId }, `${item.name} is already yours`);

  return prisma.$transaction(async tx => {
    const already = await tx.itemUnlock.findUnique({ where: { userId_itemId: { userId, itemId } } });
    if (already) throw new AppError('ALREADY_OWNED', { itemId }, `${item.name} is already yours`);
    await debitPurr(tx, userId, item.pricePurr);
    await tx.itemUnlock.create({ data: { userId, itemId } });
    await tx.purrTransaction.create({
      data: { userId, type: 'SPEND', amount: item.pricePurr, itemId: itemLedgerId(itemId) },
    });
    const loadout = await userLoadout(tx, userId, role);
    loadout[item.slot] = item.id;
    const after = await tx.user.update({
      where: { id: userId },
      data: { loadout },
      select: { purrBalance: true },
    });
    await tx.appEvent.create({ data: { userId, name: 'item_bought', payload: { itemId, price: item.pricePurr } } });
    return { itemId, purr: after.purrBalance, loadout };
  });
}

/** Puts an owned item in its slot, or empties the slot when itemId is null. */
export async function equipItem(
  prisma: PrismaClient,
  userId: string,
  role: Role | undefined,
  slot: ItemSlot,
  itemId: ItemId | null,
) {
  const loadout = await userLoadout(prisma, userId, role);
  if (itemId === null) {
    delete loadout[slot];
  } else {
    const item = itemById(itemId);
    if (!item || item.slot !== slot) throw new AppError('INVALID_INPUT', { slot, itemId }, 'That item does not go there');
    const owned = await ownedItemIds(prisma, userId, role);
    if (!owned.includes(itemId)) {
      throw new AppError('ITEM_LOCKED', { itemId, pricePurr: item.pricePurr }, `${item.name} is not yours yet`);
    }
    loadout[slot] = itemId;
  }
  await prisma.user.update({ where: { id: userId }, data: { loadout } });
  return { loadout };
}

/** Credits PURR. `reference` (payment id) is unique, so a retried webhook can never double-credit. */
export async function creditPurr(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  type: 'PURCHASE' | 'SANDBOX_PURCHASE' | 'ADMIN_GRANT',
  meta: { itemId?: string; reference?: string } = {},
) {
  return prisma.$transaction(async tx => {
    await tx.purrTransaction.create({
      data: { userId, type, amount, itemId: meta.itemId, reference: meta.reference },
    });
    const user = await tx.user.update({
      where: { id: userId },
      data: { purrBalance: { increment: amount } },
      select: { purrBalance: true },
    });
    await tx.appEvent.create({ data: { userId, name: 'purr_credited', payload: { type, amount } } });
    return user.purrBalance;
  });
}

/**
 * Starts a PURR pack purchase.
 *  - sandbox: credits immediately (for testing — never enable in production).
 *  - live:    this is where a payment provider (Stripe, Zarinpal, …) plugs in: create a
 *             checkout session, return its URL, and credit in the provider's webhook
 *             with creditPurr(..., 'PURCHASE', { reference: providerPaymentId }).
 */
export async function checkout(prisma: PrismaClient, userId: string, packId: string, mode: PaymentsMode) {
  const pack = purrPackById(packId);
  if (!pack) throw new AppError('NOT_FOUND', { packId }, 'Unknown pack');
  if (mode === 'sandbox') {
    const purr = await creditPurr(prisma, userId, pack.purr, 'SANDBOX_PURCHASE', { itemId: `pack:${pack.id}` });
    return { status: 'credited' as const, purr };
  }
  throw new AppError('PAYMENTS_UNAVAILABLE', { mode }, 'Purchases are not available yet');
}
