/**
 * Minimal, dependency-free Web Push sender.
 *   - Payload encryption: RFC 8291 (aes128gcm content coding, RFC 8188)
 *   - Sender auth:        RFC 8292 (VAPID, ES256 JWT)
 * Verified against the RFC 8291 §5 test vector in test/webpush.test.ts.
 */
import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
  sign,
} from 'node:crypto';

const b64u = (buf: Buffer): string => buf.toString('base64url');
const unb64u = (s: string): Buffer => Buffer.from(s, 'base64url');
const hmac = (key: Buffer, data: Buffer): Buffer => createHmac('sha256', key).update(data).digest();

export interface PushTarget {
  endpoint: string;
  p256dh: string; // client public key, base64url, 65-byte uncompressed P-256 point
  auth: string; // client auth secret, base64url, 16 bytes
}

export interface VapidKeys {
  publicKey: string; // base64url, 65-byte uncompressed point
  privateKey: string; // base64url, 32-byte scalar
  subject: string; // mailto: or https: contact
}

/** Deterministic hooks for tests (RFC test vector). Never set in production. */
export interface EncryptOverrides {
  asPrivateKey?: Buffer;
  salt?: Buffer;
}

export function encryptPayload(
  plaintext: Buffer,
  uaPublicB64: string,
  authSecretB64: string,
  overrides: EncryptOverrides = {},
): Buffer {
  const uaPublic = unb64u(uaPublicB64);
  const authSecret = unb64u(authSecretB64);
  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) throw new Error('Invalid p256dh key');
  if (authSecret.length < 16) throw new Error('Invalid auth secret');

  const ecdh = createECDH('prime256v1');
  if (overrides.asPrivateKey) ecdh.setPrivateKey(overrides.asPrivateKey);
  else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey(); // uncompressed, 65 bytes
  const ecdhSecret = ecdh.computeSecret(uaPublic);

  // RFC 8291 §3.3/3.4
  const prkKey = hmac(authSecret, ecdhSecret);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0', 'latin1'), uaPublic, asPublic]);
  const ikm = hmac(prkKey, Buffer.concat([keyInfo, Buffer.from([1])]));

  const salt = overrides.salt ?? randomBytes(16);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01', 'latin1')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01', 'latin1')).subarray(0, 12);

  // Single record: plaintext followed by the 0x02 "last record" delimiter.
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([cipher.update(Buffer.concat([plaintext, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);

  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  const header = Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic]);
  return Buffer.concat([header, body]);
}

/** Signed VAPID JWT for the endpoint's origin (RFC 8292). */
export function vapidAuthorization(endpoint: string, keys: VapidKeys, nowSec = Math.floor(Date.now() / 1000)): string {
  const pub = unb64u(keys.publicKey);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: keys.privateKey,
    x: b64u(pub.subarray(1, 33)),
    y: b64u(pub.subarray(33, 65)),
  };
  const key = createPrivateKey({ key: jwk, format: 'jwk' });
  const header = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(
    Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: nowSec + 12 * 3600, sub: keys.subject })),
  );
  const unsigned = `${header}.${claims}`;
  const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${unsigned}.${b64u(signature)}, k=${keys.publicKey}`;
}

export type PushResult = 'sent' | 'gone' | 'failed';

export async function sendWebPush(
  target: PushTarget,
  payload: unknown,
  keys: VapidKeys,
  opts: { ttlSec?: number; urgency?: 'low' | 'normal' | 'high'; topic?: string } = {},
): Promise<PushResult> {
  const body = encryptPayload(Buffer.from(JSON.stringify(payload), 'utf8'), target.p256dh, target.auth);
  const headers: Record<string, string> = {
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(opts.ttlSec ?? 3600),
    Urgency: opts.urgency ?? 'normal',
    Authorization: vapidAuthorization(target.endpoint, keys),
  };
  // Topic lets the push service replace an older undelivered message with the same topic.
  if (opts.topic) headers.Topic = opts.topic.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);

  const res = await fetch(target.endpoint, { method: 'POST', headers, body });
  if (res.status === 404 || res.status === 410) return 'gone'; // subscription expired/unsubscribed
  return res.ok ? 'sent' : 'failed';
}

/** One-off helper to create a VAPID key pair (see `pnpm vapid:generate`). */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });
  const raw = Buffer.concat([Buffer.from([4]), unb64u(pubJwk.x as string), unb64u(pubJwk.y as string)]);
  return { publicKey: b64u(raw), privateKey: privJwk.d as string };
}
