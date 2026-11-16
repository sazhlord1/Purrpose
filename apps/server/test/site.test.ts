import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { checkDatabase, getPrisma } from '../src/db.js';
import { getEnv } from '../src/env.js';
import { ensureAdmin } from '../src/services/accounts.js';
import { persianMonth, publicName } from '../src/services/site.js';
import { wipeDatabase } from './helpers.js';

const prisma = getPrisma();
const dbReady = await checkDatabase(prisma);
let app: FastifyInstance;

async function call(method: 'GET' | 'POST' | 'DELETE', url: string, token?: string, body?: object, host?: string) {
  return app.inject({
    method,
    url,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(host ? { host } : {}) },
    payload: body,
  });
}
async function adminToken(): Promise<string> {
  const env = { ...getEnv(), ADMIN_EMAIL: 'boss@test.dev', ADMIN_PASSWORD: 'boss-pass-123' };
  await ensureAdmin(prisma, env);
  return (await call('POST', '/api/v1/auth/admin/login', undefined, { email: 'boss@test.dev', password: 'boss-pass-123' })).json().token;
}

describe('site helpers', () => {
  it('shows only a first name and an initial', () => {
    expect(publicName({ firstName: 'Sara', lastName: 'Karimi', name: null })).toBe('Sara K.');
    expect(publicName({ firstName: null, lastName: null, name: 'Ali Rezaei' })).toBe('Ali R.');
    expect(publicName({ firstName: 'نگار', lastName: null, name: null })).toBe('نگار');
    expect(publicName({ firstName: null, lastName: null, name: null })).toBeNull();
  });
  it('finds the start of the Persian month in Tehran', () => {
    // 16 Nov 2026 is 25 Aban 1405; 1 Aban was 23 Oct 2026 (midnight in Tehran = 20:30 UTC the day before).
    const m = persianMonth(new Date('2026-11-16T12:00:00Z'));
    expect(m.start.toISOString()).toBe('2026-10-22T20:30:00.000Z');
    expect(m.name).toContain('آبان');
  });
});

describe.skipIf(!dbReady)('website content', () => {
  beforeAll(async () => {
    app = await buildApp();
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(async () => {
    await wipeDatabase(prisma);
  });

  it('takes contact messages and lists them for the admin', async () => {
    expect((await call('POST', '/api/v1/public/contact', undefined, { name: 'S', email: 'x', message: '' })).statusCode).toBe(400);
    const ok = await call('POST', '/api/v1/public/contact', undefined, {
      name: 'پناهگاه مهر',
      email: 'Shelter@Example.com',
      kind: 'shelter',
      message: 'سلام، ما ۴۰ تا گربه داریم.',
    });
    expect(ok.json()).toEqual({ ok: true });
    // Bots fill the hidden field: accepted, not stored.
    await call('POST', '/api/v1/public/contact', undefined, { name: 'Bot', email: 'b@b.co', message: 'spam spam', website: 'x' });

    const admin = await adminToken();
    const list = (await call('GET', '/api/v1/admin/contact', admin)).json();
    expect(list.openCount).toBe(1);
    expect(list.messages[0]).toMatchObject({ name: 'پناهگاه مهر', email: 'shelter@example.com', kind: 'shelter' });
    await call('POST', `/api/v1/admin/contact/${list.messages[0].id}`, admin, { handled: true });
    expect((await call('GET', '/api/v1/admin/contact', admin)).json().openCount).toBe(0);
  });

  it('ranks people by pacts kept and sums the food given this month', async () => {
    const mk = async (firstName: string, lastName: string, wins: number) => {
      const u = await prisma.user.create({ data: { firstName, lastName, email: `${firstName}@t.dev` } });
      for (let i = 0; i < wins; i++) {
        await prisma.commitment.create({
          data: { userId: u.id, title: 't', deadline: new Date(), status: 'COMPLETED', catId: 'tuxedo', consequenceType: 'MEALS', consequenceAmount: 1 },
        });
      }
      return u;
    };
    await mk('Sara', 'Karimi', 3);
    const ali = await mk('Ali', 'Rezaei', 5);
    await prisma.creditTransaction.create({ data: { userId: ali.id, type: 'FAILURE_DEDUCTION', creditType: 'MEALS', amount: 4 } });
    await prisma.creditTransaction.create({ data: { userId: ali.id, type: 'FAILURE_DEDUCTION', creditType: 'DRY_FOOD', amount: 2 } });
    await prisma.creditTransaction.create({ data: { userId: ali.id, type: 'TOPUP', creditType: 'MEALS', amount: 9 } });

    const res = await call('GET', '/api/v1/public/site');
    expect(res.statusCode).toBe(200);
    const s = res.json();
    expect(s.leaders).toEqual([
      { name: 'Ali R.', wins: 5 },
      { name: 'Sara K.', wins: 3 },
    ]);
    expect(s.month).toMatchObject({ meals: 4, dryFood: 2, vetCare: 0 });
    expect(s.total.pactsKept).toBe(8);
    expect(JSON.stringify(s)).not.toContain('@t.dev');
  });

  it('publishes food delivery posts with uploaded pictures', async () => {
    const admin = await adminToken();
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
    const up = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/media?purpose=delivery',
      headers: { authorization: `Bearer ${admin}`, 'content-type': 'image/png' },
      payload: png,
    });
    expect(up.statusCode).toBe(200);
    const { id } = up.json();
    const bad = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/media?purpose=delivery',
      headers: { authorization: `Bearer ${admin}`, 'content-type': 'text/html' },
      payload: '<b>x</b>',
    });
    expect(bad.statusCode).toBeGreaterThanOrEqual(400);

    const saved = await call('POST', '/api/v1/admin/deliveries', admin, { title: 'تحویل آبان', shelter: 'پناهگاه وفا', mediaIds: [id] });
    expect(saved.statusCode).toBe(200);
    const pub = (await call('GET', '/api/v1/public/deliveries')).json();
    expect(pub.deliveries[0]).toMatchObject({ title: 'تحویل آبان', shelter: 'پناهگاه وفا' });
    expect(pub.deliveries[0].media[0]).toMatchObject({ id, type: 'image/png' });

    const file = await call('GET', `/api/v1/public/media/${id}`);
    expect(file.statusCode).toBe(200);
    expect(file.headers['content-type']).toBe('image/png');
    expect(file.headers['cache-control']).toContain('immutable');
    expect(file.rawPayload.equals(png)).toBe(true);
    const part = await app.inject({ method: 'GET', url: `/api/v1/public/media/${id}`, headers: { range: 'bytes=0-3' } });
    expect(part.statusCode).toBe(206);
    expect(part.rawPayload.length).toBe(4);

    await call('POST', `/api/v1/admin/deliveries/${saved.json().delivery.id}`, admin, { title: 'تحویل آبان', published: false, mediaIds: [id] });
    expect((await call('GET', '/api/v1/public/deliveries')).json().deliveries).toEqual([]);
  });

  it('writes blog posts and shows them on the blog address', async () => {
    const admin = await adminToken();
    const user = await call('POST', '/api/v1/admin/blog', undefined, { slug: 'x', title: 'x', content: [] });
    expect(user.statusCode).toBe(401);
    const post = {
      slug: 'سر-قول-موندن',
      title: 'چطوری سر قولمون بمونیم؟',
      content: [
        { type: 'heading', level: 2, text: 'قدم اول' },
        { type: 'paragraph', text: 'یه **قرار** با [پرپس](https://app.purrpose.ir) بذار. <script>alert(1)</script>', align: 'justify', font: 'anjoman', weight: 500 },
        { type: 'list', items: ['یک', 'دو'] },
        { type: 'paragraph', text: 'An English line.', dir: 'ltr', font: 'serif' },
      ],
      tags: ['عادت'],
      published: true,
    };
    const created = await call('POST', '/api/v1/admin/blog', admin, post);
    expect(created.statusCode).toBe(200);
    expect(created.json().post.excerpt).toContain('قدم اول');
    expect((await call('POST', '/api/v1/admin/blog', admin, post)).statusCode).toBe(409);

    const home = await call('GET', '/', undefined, undefined, 'blog.purrpose.ir');
    expect(home.statusCode).toBe(200);
    expect(home.body).toContain('چطوری سر قولمون بمونیم؟');
    const page = await call('GET', `/${encodeURIComponent(post.slug)}`, undefined, undefined, 'blog.purrpose.ir');
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('<strong>قرار</strong>');
    expect(page.body).toContain('&lt;script&gt;');
    expect(page.body).not.toContain('<script>alert');
    expect(page.body).toContain('"@type":"BlogPosting"');
    expect(page.body).toContain('dir="ltr"');
    expect(page.headers['content-security-policy']).toContain("script-src 'none'");
    expect((await call('GET', '/sitemap.xml', undefined, undefined, 'blog.purrpose.ir')).body).toContain(encodeURIComponent(post.slug));
    expect((await call('GET', '/nope', undefined, undefined, 'blog.purrpose.ir')).statusCode).toBe(404);

    const id = created.json().post.id;
    await call('POST', `/api/v1/admin/blog/${id}`, admin, { ...post, published: false });
    expect((await call('GET', `/${encodeURIComponent(post.slug)}`, undefined, undefined, 'blog.purrpose.ir')).statusCode).toBe(404);
  });
});
