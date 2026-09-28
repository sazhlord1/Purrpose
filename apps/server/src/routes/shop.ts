import type { FastifyInstance } from 'fastify';
import { buyItemSchema, checkoutSchema, equipItemSchema, unlockCatSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { getPrisma } from '../db.js';
import { getEnv } from '../env.js';
import { buyItem, checkout, equipItem, shopView, unlockCat } from '../services/shop.js';
import { parse } from '../validate.js';

export function registerShopRoutes(app: FastifyInstance): void {
  app.get('/api/v1/shop', async request =>
    shopView(getPrisma(), userIdOf(request), request.role, getEnv().PAYMENTS_MODE),
  );

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
    return checkout(getPrisma(), userIdOf(request), packId, getEnv().PAYMENTS_MODE);
  });
}
