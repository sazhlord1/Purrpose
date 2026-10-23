import type { FastifyInstance } from 'fastify';
import { buyItemSchema, checkoutSchema, equipItemSchema, unlockCatSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv, paymentsMode } from '../env.js';
import { startPurrCheckout } from '../services/payments.js';
import { buyItem, checkout, equipItem, shopView, unlockCat } from '../services/shop.js';
import { parse } from '../validate.js';

export function registerShopRoutes(app: FastifyInstance): void {
  app.get('/api/v1/shop', async request => {
    const env = getEnv();
    const mode = paymentsMode(env);
    const test = mode === 'stripe' && /_test_/.test(env.STRIPE_SECRET_KEY ?? '');
    return shopView(getPrisma(), userIdOf(request), request.role, mode, test);
  });

  app.post('/api/v1/shop/unlock', async request => {
    const { catId } = parse(unlockCatSchema, request.body);
    return unlockCat(getPrisma(), userIdOf(request), request.role, catId);
  });

  app.post('/api/v1/shop/items/buy', async request => {
    const { itemId } = parse(buyItemSchema, request.body);
    return buyItem(getPrisma(), userIdOf(request), request.role, itemId);
  });

  app.post('/api/v1/shop/items/equip', async request => {
    const { slot, itemId } = parse(equipItemSchema, request.body);
    return equipItem(getPrisma(), userIdOf(request), request.role, slot, itemId);
  });

  app.post('/api/v1/shop/checkout', async request => {
    const { packId } = parse(checkoutSchema, request.body);
    const env = getEnv();
    const mode = paymentsMode(env);
    if (mode === 'stripe') return startPurrCheckout(getPrisma(), env, userIdOf(request), packId, request.headers.origin);
    return checkout(getPrisma(), userIdOf(request), packId, mode);
  });
}
