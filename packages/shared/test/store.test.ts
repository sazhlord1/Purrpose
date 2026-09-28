import { describe, expect, it } from 'vitest';
import { CAT_SEED, FREE_CAT_IDS, isFreeCat } from '../src/cats.js';
import { credentialsSchema, focusSessionSchema, pushSubscribeSchema } from '../src/schemas.js';
import { PURR_PACKS, purrPackById } from '../src/store.js';

describe('cat catalog & PURR', () => {
  it('keeps Miso, Winston and Nyx free and prices the rest', () => {
    expect([...FREE_CAT_IDS].sort()).toEqual(['black', 'orange', 'tuxedo']);
    for (const cat of CAT_SEED) {
      expect(isFreeCat(cat.id)).toBe(cat.pricePurr === 0);
      if (!FREE_CAT_IDS.includes(cat.id)) expect(cat.pricePurr).toBeGreaterThan(0);
    }
  });

  it('has unique purchasable packs', () => {
    expect(new Set(PURR_PACKS.map(p => p.id)).size).toBe(PURR_PACKS.length);
    expect(purrPackById('purr_150')?.purr).toBe(150);
    expect(purrPackById('nope')).toBeUndefined();
  });
});

describe('account & focus schemas', () => {
  it('normalizes emails and enforces password length', () => {
    expect(credentialsSchema.parse({ email: '  Me@Example.COM ', password: '12345678' }).email).toBe('me@example.com');
    expect(credentialsSchema.safeParse({ email: 'me@example.com', password: 'short' }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: 'not-an-email', password: '12345678' }).success).toBe(false);
  });

  it('caps a focus session at 12 hours', () => {
    const base = { catId: 'orange', startedAtISO: new Date().toISOString() };
    expect(focusSessionSchema.safeParse({ ...base, durationSec: 1500 }).success).toBe(true);
    expect(focusSessionSchema.safeParse({ ...base, durationSec: 13 * 3600 }).success).toBe(false);
  });

  it('only accepts https push endpoints', () => {
    const keys = { p256dh: 'x'.repeat(87), auth: 'y'.repeat(22) };
    expect(pushSubscribeSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/x', keys }).success).toBe(true);
    expect(pushSubscribeSchema.safeParse({ endpoint: 'http://evil.local/x', keys }).success).toBe(false);
  });
});
