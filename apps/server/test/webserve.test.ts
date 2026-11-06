import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { makeWebHandler } from '../src/web.js';

function site(name: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `purrpose-${name}-`));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), `<html>${name}</html>`);
  return dir;
}

describe('serving the app and the landing', () => {
  const serve = makeWebHandler(site('app'), { dir: site('landing'), hosts: ['purrpose.ir', 'www.purrpose.ir'] });
  const app = Fastify();
  app.setNotFoundHandler(async (req, reply) => {
    if (!(await serve(req, reply))) await reply.code(404).send();
  });

  it('sends www to the bare domain, keeps the landing indexable and the app out of search', async () => {
    const www = await app.inject({ url: '/?a=1', headers: { host: 'www.purrpose.ir' } });
    expect(www.statusCode).toBe(301);
    expect(www.headers.location).toBe('https://purrpose.ir/?a=1');

    const landing = await app.inject({ url: '/', headers: { host: 'purrpose.ir' } });
    expect(landing.body).toContain('landing');
    expect(landing.headers['x-robots-tag']).toBeUndefined();

    const pact = await app.inject({ url: '/commitment/abc', headers: { host: 'app.purrpose.ir' } });
    expect(pact.body).toContain('app');
    expect(pact.headers['x-robots-tag']).toBe('noindex, nofollow');
  });
});
