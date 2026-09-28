import { createPublicKey, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptPayload, generateVapidKeys, vapidAuthorization } from '../src/services/webpush.js';

describe('web push crypto', () => {
  it('matches the RFC 8291 §5 test vector exactly', () => {
    const out = encryptPayload(
      Buffer.from('When I grow up, I want to be a watermelon'),
      'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
      'BTBZMqHH6r4Tts7J_aSIgg',
      {
        asPrivateKey: Buffer.from('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', 'base64url'),
        salt: Buffer.from('DGv6ra1nlYgDCS1FRnbzlw', 'base64url'),
      },
    );
    expect(out.toString('base64url')).toBe(
      'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
    );
  });

  it('produces a verifiable ES256 VAPID token for the endpoint origin', () => {
    const keys = { ...generateVapidKeys(), subject: 'mailto:test@example.com' };
    const header = vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc', keys);
    const m = header.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/);
    expect(m).not.toBeNull();
    const [, h, c, sig, k] = m as RegExpMatchArray;
    expect(k).toBe(keys.publicKey);
    expect(JSON.parse(Buffer.from(c, 'base64url').toString()).aud).toBe('https://fcm.googleapis.com');
    const pub = Buffer.from(keys.publicKey, 'base64url');
    const key = createPublicKey({
      key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') },
      format: 'jwk',
    });
    expect(verify('sha256', Buffer.from(`${h}.${c}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'))).toBe(true);
  });
});
