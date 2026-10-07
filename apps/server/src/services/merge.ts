import type { Prisma } from '@prisma/client';
import { sanitizeLoadout } from '@purrpose/shared';

type Tx = Prisma.TransactionClient;

/**
 * Moves everything a guest did on this device into the account they just signed
 * in to, then deletes the guest. Only real guests (no email, no Google id, plain
 * USER) are ever merged — a signed-in account is never folded into another one.
 *
 * What moves: pacts, habits, focus sessions, credit history and balances, PURR and its
 * history, owned cats and items, push subscriptions, events. The guest's free
 * welcome credits are not counted twice: only what the guest has beyond them
 * (top-ups minus credits it already lost) is added to the account — except
 * that the credits backing the guest's open pacts always come along.
 *
 * Returns false (and does nothing) when `guestId` is not a mergeable guest.
 */
export async function mergeGuestInto(tx: Tx, guestId: string, targetId: string): Promise<boolean> {
  if (guestId === targetId) return false;
  const guest = await tx.user.findUnique({ where: { id: guestId }, include: { balances: true } });
  if (!guest || guest.email !== null || guest.googleId !== null || guest.role !== 'USER') return false;
  const target = await tx.user.findUnique({ where: { id: targetId } });
  if (!target) return false;

  // ── Credits: add the guest's balance minus its welcome gift (never negative) —
  // but always enough to back the guest's pacts that are moving over.
  const gifts = await tx.creditTransaction.groupBy({
    by: ['creditType'],
    where: { userId: guestId, type: 'STARTER_GRANT' },
    _sum: { amount: true },
  });
  const giftByType = new Map(gifts.map(g => [g.creditType, g._sum.amount ?? 0]));
  const stakes = await tx.commitment.groupBy({
    by: ['consequenceType'],
    where: { userId: guestId, status: 'ACTIVE' },
    _sum: { consequenceAmount: true },
  });
  const stakedByType = new Map(stakes.map(st => [st.consequenceType, st._sum.consequenceAmount ?? 0]));
  const habitStakes = await tx.habit.groupBy({
    by: ['consequenceType'],
    where: { userId: guestId, status: 'ACTIVE' },
    _sum: { stakeAmount: true },
  });
  for (const h of habitStakes) {
    stakedByType.set(h.consequenceType, (stakedByType.get(h.consequenceType) ?? 0) + (h._sum.stakeAmount ?? 0));
  }
  let creditsMoved = 0;
  for (const b of guest.balances) {
    const beyondGift = Math.max(0, b.amount - (giftByType.get(b.creditType) ?? 0));
    const backingStakes = Math.min(Math.max(0, b.amount), stakedByType.get(b.creditType) ?? 0);
    const extra = Math.max(beyondGift, backingStakes);
    if (extra === 0) continue;
    creditsMoved += extra;
    await tx.creditBalance.upsert({
      where: { userId_creditType: { userId: targetId, creditType: b.creditType } },
      update: { amount: { increment: extra } },
      create: { userId: targetId, creditType: b.creditType, amount: extra },
    });
  }
  await tx.creditBalance.deleteMany({ where: { userId: guestId } });
  await tx.creditTransaction.deleteMany({ where: { userId: guestId, type: 'STARTER_GRANT' } });

  // ── Rows that simply change owner.
  const move = { where: { userId: guestId }, data: { userId: targetId } };
  await tx.creditTransaction.updateMany(move);
  const pacts = await tx.commitment.updateMany(move);
  const focus = await tx.focusSession.updateMany(move);
  const habits = await tx.habit.updateMany(move);
  await tx.purrTransaction.updateMany(move);
  await tx.pushSubscription.updateMany(move);
  await tx.appEvent.updateMany(move);

  // ── Owned cats and items: union (the account may already own some).
  const cats = await tx.catUnlock.findMany({ where: { userId: guestId } });
  if (cats.length > 0) {
    await tx.catUnlock.createMany({
      data: cats.map(c => ({ userId: targetId, catId: c.catId, createdAt: c.createdAt })),
      skipDuplicates: true,
    });
  }
  await tx.catUnlock.deleteMany({ where: { userId: guestId } });
  const items = await tx.itemUnlock.findMany({ where: { userId: guestId } });
  if (items.length > 0) {
    await tx.itemUnlock.createMany({
      data: items.map(i => ({ userId: targetId, itemId: i.itemId, createdAt: i.createdAt })),
      skipDuplicates: true,
    });
  }
  await tx.itemUnlock.deleteMany({ where: { userId: guestId } });

  // ── PURR adds up; keep the account's room setup unless it has none yet.
  const targetLoadout = sanitizeLoadout(target.loadout);
  const guestLoadout = sanitizeLoadout(guest.loadout);
  await tx.user.update({
    where: { id: targetId },
    data: {
      purrBalance: { increment: guest.purrBalance },
      name: target.name ?? guest.name,
      ...(Object.keys(targetLoadout).length === 0 && Object.keys(guestLoadout).length > 0
        ? { loadout: guestLoadout as Prisma.InputJsonValue }
        : {}),
    },
  });

  await tx.session.deleteMany({ where: { userId: guestId } });
  // Only ever delete a user that is still a guest (it can't have registered meanwhile).
  const gone = await tx.user.deleteMany({ where: { id: guestId, email: null, googleId: null, role: 'USER' } });
  if (gone.count !== 1) throw new Error('Guest changed during sign-in; nothing was merged.');
  await tx.appEvent.create({
    data: {
      userId: targetId,
      name: 'guest_merged',
      payload: {
        pacts: pacts.count,
        focusSessions: focus.count,
        habits: habits.count,
        credits: creditsMoved,
        purr: guest.purrBalance,
        cats: cats.length,
        items: items.length,
      },
    },
  });
  return true;
}
