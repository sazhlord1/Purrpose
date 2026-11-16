import type { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { blogPostInputSchema, blogPlainText, contactSchema, deliveryPostSchema, idParamsSchema } from '@purrpose/shared';
import { getPrisma } from '../db.js';
import { AppError } from '../errors.js';
import { createLimiter } from '../ratelimit.js';
import { MEDIA_BODY_LIMIT, MEDIA_TYPES, clearSiteStatsCache, sendMedia, siteStats } from '../services/site.js';
import { parse } from '../validate.js';

/** Contact form: 5 messages an hour per IP. */
const contactLimiter = createLimiter(5, 60 * 60_000);
export function resetContactLimit(): void {
  contactLimiter.reset();
}

/** New tables (2026-11-17): a database that hasn't been upgraded yet answers with empty lists. */
async function orEmpty<T>(p: Promise<T>, empty: T): Promise<T> {
  try {
    return await p;
  } catch {
    return empty;
  }
}

const mediaIdsSchema = z.array(z.string().regex(/^[a-z0-9]{5,40}$/)).max(30);

export function deliveryDto(p: {
  id: string;
  title: string;
  shelter: string;
  summary: string;
  caption: string;
  deliveredAt: Date;
  published: boolean;
  media: { order: number; media: { id: string; type: string } }[];
}) {
  return {
    id: p.id,
    title: p.title,
    shelter: p.shelter,
    summary: p.summary,
    caption: p.caption,
    deliveredAt: p.deliveredAt.toISOString(),
    published: p.published,
    media: [...p.media]
      .sort((a, b) => a.order - b.order)
      .map(m => ({ id: m.media.id, type: m.media.type, url: `/api/v1/public/media/${m.media.id}` })),
  };
}

const deliveryInclude = { media: { include: { media: { select: { id: true, type: true } } } } } as const;

/** Public: no sign-in. Used by purrpose.ir. */
export function registerPublicSiteRoutes(app: FastifyInstance): void {
  app.get('/api/v1/public/site', async () => orEmpty(siteStats(getPrisma()), null));

  app.get('/api/v1/public/deliveries', async () => {
    const rows = await orEmpty(
      getPrisma().deliveryPost.findMany({
        where: { published: true },
        orderBy: { deliveredAt: 'desc' },
        take: 60,
        include: deliveryInclude,
      }),
      [],
    );
    return { deliveries: rows.map(deliveryDto) };
  });

  app.get('/api/v1/public/media/:id', async (request, reply) => {
    const { id } = parse(idParamsSchema, request.params);
    if (await sendMedia(getPrisma(), id, request, reply)) return reply;
    throw new AppError('NOT_FOUND', undefined, 'Not found');
  });

  app.post('/api/v1/public/contact', async request => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    // A hidden field people don't see: bots fill it in. Pretend it worked.
    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true };
    const input = parse(contactSchema, body);
    contactLimiter.hit(`ip:${request.ip}`, 'Too many messages. Please try again later.');
    await getPrisma().contactMessage.create({ data: input });
    return { ok: true };
  });
}

/** Admin only (registered inside the admin scope). */
export async function registerSiteAdminRoutes(scope: FastifyInstance): Promise<void> {
  const prisma = getPrisma;

  // ---- Uploads: the raw file is the body (Content-Type says what it is). ----
  await scope.register(async function uploads(s) {
    s.addContentTypeParser(Object.keys(MEDIA_TYPES), { parseAs: 'buffer', bodyLimit: MEDIA_BODY_LIMIT }, (_req, body, done) =>
      done(null, body),
    );
    s.post('/api/v1/admin/media', { bodyLimit: MEDIA_BODY_LIMIT }, async request => {
      const { purpose } = parse(z.object({ purpose: z.enum(['delivery', 'blog']) }), request.query);
      const type = String(request.headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase();
      const rule = MEDIA_TYPES[type];
      const data = request.body;
      if (!rule || !Buffer.isBuffer(data) || data.length === 0) {
        throw new AppError('INVALID_INPUT', undefined, 'Send a picture (JPG, PNG, WebP, GIF) or a video (MP4, WebM, MOV).');
      }
      if (data.length > rule.max) {
        throw new AppError('INVALID_INPUT', undefined, `That file is too big (most ${Math.round(rule.max / 1024 / 1024)} MB).`);
      }
      const media = await prisma().storedMedia.create({ data: { type, data: new Uint8Array(data), size: data.length, purpose } });
      return { id: media.id, type, size: media.size, url: `/api/v1/public/media/${media.id}` };
    });
  });

  // ---- Food delivery posts ----
  scope.get('/api/v1/admin/deliveries', async () => {
    const rows = await prisma().deliveryPost.findMany({ orderBy: { deliveredAt: 'desc' }, include: deliveryInclude });
    return { deliveries: rows.map(deliveryDto) };
  });

  const deliveryBody = deliveryPostSchema.extend({ mediaIds: mediaIdsSchema.default([]) });
  async function saveDelivery(id: string | null, raw: unknown) {
    const { mediaIds, deliveredAt, ...fields } = parse(deliveryBody, raw);
    const data = { ...fields, ...(deliveredAt ? { deliveredAt: new Date(deliveredAt) } : {}) };
    const post = await prisma().$transaction(async tx => {
      const p = id ? await tx.deliveryPost.update({ where: { id }, data }) : await tx.deliveryPost.create({ data });
      await tx.deliveryMedia.deleteMany({ where: { postId: p.id } });
      if (mediaIds.length) {
        const found = await tx.storedMedia.findMany({ where: { id: { in: mediaIds } }, select: { id: true } });
        const ok = new Set(found.map(f => f.id));
        await tx.deliveryMedia.createMany({
          data: mediaIds.filter(m => ok.has(m)).map((mediaId, order) => ({ postId: p.id, mediaId, order })),
        });
      }
      return tx.deliveryPost.findUniqueOrThrow({ where: { id: p.id }, include: deliveryInclude });
    });
    return { delivery: deliveryDto(post) };
  }
  scope.post('/api/v1/admin/deliveries', async request => saveDelivery(null, request.body));
  scope.post('/api/v1/admin/deliveries/:id', async request => {
    const { id } = parse(idParamsSchema, request.params);
    if (!(await prisma().deliveryPost.findUnique({ where: { id }, select: { id: true } }))) {
      throw new AppError('NOT_FOUND', undefined, 'Not found');
    }
    return saveDelivery(id, request.body);
  });
  scope.delete('/api/v1/admin/deliveries/:id', async request => {
    const { id } = parse(idParamsSchema, request.params);
    const links = await prisma().deliveryMedia.findMany({ where: { postId: id }, select: { mediaId: true } });
    await prisma().deliveryPost.deleteMany({ where: { id } });
    await prisma().storedMedia.deleteMany({ where: { id: { in: links.map(l => l.mediaId) }, purpose: 'delivery' } });
    return { ok: true };
  });

  // ---- Contact messages ----
  scope.get('/api/v1/admin/contact', async request => {
    const { open } = parse(z.object({ open: z.enum(['0', '1']).default('1') }), request.query);
    const rows = await prisma().contactMessage.findMany({
      where: open === '1' ? { handledAt: null } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const openCount = await prisma().contactMessage.count({ where: { handledAt: null } });
    return {
      openCount,
      messages: rows.map(m => ({ ...m, createdAt: m.createdAt.toISOString(), handledAt: m.handledAt?.toISOString() ?? null })),
    };
  });
  scope.post('/api/v1/admin/contact/:id', async request => {
    const { id } = parse(idParamsSchema, request.params);
    const { handled } = parse(z.object({ handled: z.boolean() }), request.body);
    await prisma().contactMessage.update({ where: { id }, data: { handledAt: handled ? new Date() : null } });
    return { ok: true };
  });
  scope.delete('/api/v1/admin/contact/:id', async request => {
    const { id } = parse(idParamsSchema, request.params);
    await prisma().contactMessage.deleteMany({ where: { id } });
    return { ok: true };
  });

  // ---- Blog (blog.purrpose.ir) ----
  const listSelect = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    lang: true,
    coverMediaId: true,
    tags: true,
    published: true,
    publishedAt: true,
    updatedAt: true,
  } as const;
  scope.get('/api/v1/admin/blog', async () => {
    const posts = await prisma().blogPost.findMany({ orderBy: { updatedAt: 'desc' }, select: listSelect });
    return { posts };
  });
  scope.get('/api/v1/admin/blog/:id', async request => {
    const { id } = parse(idParamsSchema, request.params);
    const post = await prisma().blogPost.findUnique({ where: { id } });
    if (!post) throw new AppError('NOT_FOUND', undefined, 'Not found');
    return { post };
  });

  async function saveBlog(id: string | null, raw: unknown) {
    const input = parse(blogPostInputSchema, raw);
    const clash = await prisma().blogPost.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (clash && clash.id !== id) throw new AppError('CONFLICT', undefined, 'Another post already uses that address.');
    const before = id ? await prisma().blogPost.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
    if (id && !before) throw new AppError('NOT_FOUND', undefined, 'Not found');
    const excerpt = input.excerpt || blogPlainText(input.content).replace(/\s+/g, ' ').slice(0, 220);
    const data = {
      ...input,
      excerpt,
      content: input.content as unknown as Prisma.InputJsonValue,
      publishedAt: input.published ? (before?.publishedAt ?? new Date()) : (before?.publishedAt ?? null),
    };
    const post = id ? await prisma().blogPost.update({ where: { id }, data }) : await prisma().blogPost.create({ data });
    return { post };
  }
  const blogOpts = { bodyLimit: 2 * 1024 * 1024 };
  scope.post('/api/v1/admin/blog', blogOpts, async request => saveBlog(null, request.body));
  scope.post('/api/v1/admin/blog/:id', blogOpts, async request => {
    const { id } = parse(idParamsSchema, request.params);
    return saveBlog(id, request.body);
  });
  scope.delete('/api/v1/admin/blog/:id', async request => {
    const { id } = parse(idParamsSchema, request.params);
    await prisma().blogPost.deleteMany({ where: { id } });
    return { ok: true };
  });

  // Fresh numbers on the home page after an admin changes something.
  scope.addHook('onResponse', async request => {
    if (request.method !== 'GET' && request.url.startsWith('/api/v1/admin/')) clearSiteStatsCache();
  });
}
