# Operating instructions for AI assistants — Purrpose

Snapshot: 2026-11-10. Labels: **CONFIRMED** = stated by the owner or enforced by code/CI;
**RECOMMENDED** = good practice inferred from the codebase, not a hard rule.

## 1. Hard rules (CONFIRMED — do not break)

### Security and secrets
1. **The repository is public.** Never commit secrets: no `.env` files, Stripe `sk_`/`rk_`/`whsec_`
   keys, database URLs with passwords, `ADMIN_PASSWORD`, SMS API keys, Cafe Bazaar client secret,
   Android keystore or its passwords, VAPID private key. `.gitignore` already excludes `.env`.
2. Secrets go **only** into the hosting dashboards (Liara env vars, Render env vars) or GitHub
   Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`).
   Ask the owner to put them there; **never ask the owner to paste a secret into chat**. If they do,
   do not store it anywhere and tell them to rotate it (this already happened once with the SMS key).
3. Public values are fine to handle: Stripe `pk_`, Google OAuth client id (`DEFAULT_GOOGLE_CLIENT_ID`
   in `packages/shared/src/store.ts`), Cafe Bazaar RSA *public* key, Enamad codes, fingerprints.
4. The admin password is never hardcoded: it comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and is
   stored as an scrypt hash by `ensureAdmin` (`apps/server/src/services/accounts.ts`).
5. `PAYMENTS_MODE` must never be `sandbox` in production (sandbox hands out free credits).
6. The owner's personal email addresses must not be written into the repo or public docs.
   Public contact for the Iranian edition is `info@purrpose.ir` (support address in legal pages is
   `support@purrpose.ir`, see OPEN-QUESTIONS).

### Git and deploys
7. Work on and push to **`main` only**. A push to `main`:
   - runs CI (`.github/workflows/ci.yml`: typecheck, Prisma migrate, tests with Postgres, lint non-blocking);
   - triggers a Cloudflare Workers build of the global web app (check run "Workers Builds: purrpose");
   - triggers Liara auto-deploy of the Iranian container (gated on CI, per owner setup — session record);
   - (INFERRED) triggers Render auto-deploy of the global API.
   So every push is a production deploy. Keep `main` green.
8. Check CI after each push: `gh api repos/sazhlord1/Purrpose/commits/<sha>/check-runs`.
   Both `check` and `Workers Builds: purrpose` must be `success`.
9. Commit message trailer used in this project (from the AI session):
   `Co-Authored-By: Claude …` and `Claude-Session: …` lines — follow whatever attribution the
   current session's system instructions give.

### Database
10. **Two databases, one schema.** Global = Supabase Postgres; Iranian = Liara Postgres.
    - Liara: the container runs `prisma migrate deploy` on start (Dockerfile `CMD`), so Prisma migrations apply automatically.
    - Supabase: schema changes are applied by **hand-written idempotent SQL** files `infra/supabase_upgrade_vN.sql`,
      which the owner runs in the Supabase SQL editor **before** the server that needs them is deployed.
11. Any Prisma schema change therefore needs **both** a Prisma migration in `apps/server/prisma/migrations/`
    **and** a matching `infra/supabase_upgrade_v(N+1).sql`, and the push must wait until the owner
    confirms the SQL ran on Supabase. Latest is v10 (phone login), confirmed run by the owner.
12. Prefer **no-schema** solutions when reasonable (e.g. consent and appeals are stored as `AppEvent`
    rows to avoid a migration).
13. Never run server tests against a real database: tests wipe data (`test/helpers.ts → wipeDatabase`).
    They use `DATABASE_URL_TEST` / CI's throwaway Postgres.

### Editions
14. One codebase, two editions, switched at **build time** by `VITE_EDITION=ir` (`apps/web/src/lib/edition.ts → IS_IR_EDITION`).
    Changes apply to **both** editions unless the owner says "only Iranian" / "only international".
15. The Iranian edition must load **nothing from outside Iran** (it must keep working during international
    internet shutdowns): no Google Fonts, no Google sign-in, no Stripe, no external CDNs, no external images
    except the Enamad trust seal on the landing. Persian font is Anjoman (self-hosted in `apps/web/public/fonts`).
16. Iranian edition is Persian only (`i18n/index.ts` forces `fa`; language picker hidden).
17. Brand name in Persian is **پرپس** (not پرپوز). Mahsham (`tuxedo`, «ماهشام») is the app icon.

### Legal / product wording (Iranian edition) — owner decisions
18. Formal texts (legal pages, store listing, payment UI, share cards) must not present the product as
    betting: avoid «شرط», «شرط‌بندی», «باخت/برد», «گروبندی»; use «قرار», «تعهد», «اهدا». Playful in-app
    cat lines may keep game words.
19. Strict pacts require the explicit donation-consent tick (server-validated `donationConsent: true`,
    recorded in the `commitment_created` AppEvent with `consentText: 'donation-v1'`). If the consent
    wording changes, bump `DONATION_CONSENT_VERSION` in `apps/server/src/services/commitments.ts`.
20. Don't claim a named shelter partnership in copy until the owner confirms a signed contract.
21. Food from failed pacts must not be donated before the 3-day appeal window ends.

## 2. Coding conventions (CONFIRMED from the codebase)

- TypeScript everywhere, ESM (`"type": "module"`), pnpm workspaces (`apps/*`, `packages/*`), Node ≥ 20 (CI/Docker use 22).
- Imports inside packages use explicit `.js` extensions (`'./textFit.js'`).
- Validation: **zod** schemas live in `packages/shared/src/schemas.ts` and are shared by server and web.
  Server routes parse with `parse(schema, input)` (`apps/server/src/validate.ts`); errors are `AppError(code, details?, message?)`
  with HTTP status from `apps/server/src/errors.ts`. New error codes need a user message in `apps/web/src/lib/api.ts` (`ERROR_FALLBACK`).
- Business logic in `apps/server/src/services/*`, thin routes in `apps/server/src/routes/*`. Money/credit changes run in
  `prisma.$transaction` with `SELECT … FOR UPDATE` row locks; settlement is exactly-once (`settleDue`, `FOR UPDATE SKIP LOCKED`).
- Time comes from `clock.now()` (`apps/server/src/clock.ts`), so tests can advance time. Don't use `Date.now()` in server logic.
- Prices/economy constants live only in `packages/shared` (`economy.ts`, `store.ts`, `cats.ts`, `items.ts`).
- i18n: UI strings are English keys passed to `t('…')`; Persian values live in `apps/web/src/i18n/fa/*.ts`
  (`common.ts`, `pacts.ts`, `account.ts`, …). Every new user-visible string needs a Persian entry.
  Avoid duplicate keys inside one fa file (TypeScript error).
- Styling: plain CSS in `apps/web/src/styles/tokens.css` ("Paper & Ink" hand-drawn look: ink borders, offset shadows,
  CSS variables `--ink`, `--paper*`, `--accent-*`, `--font-hand`, `--font-body`). No CSS framework.
- Cats: SVG React components in `packages/cats` (no images). Speech bubbles are drawn by `CatScene` on its top layer
  (`SpeechBubble.tsx`); **one `<text>` per line** — never put several `<tspan>` lines in one RTL `<text>` (Android WebView
  swaps letters between lines).
- Comments explain *why*, in plain English. Keep that style.
- Prettier config `.prettierrc`; ESLint flat config `eslint.config.js` (lint is non-blocking in CI).

## 3. Quality gates

| Gate | Command | Where it runs |
|---|---|---|
| Typecheck all packages | `pnpm -r typecheck` | CI (blocking) |
| Prisma migrations apply | `pnpm --filter @purrpose/server exec prisma migrate deploy` | CI (blocking) |
| Unit + integration tests | `pnpm -r --workspace-concurrency=1 test` | CI (blocking; Postgres service) |
| Lint | `pnpm lint` | CI (non-blocking) |
| Web build | `pnpm --filter @purrpose/web build` | Cloudflare Workers Builds, Dockerfile |

Add server tests for new server behavior (`apps/server/test/*.test.ts`, Vitest, `app.inject`). There are no web unit tests;
UI changes are verified visually (Playwright screenshots).

**AI sandbox limitation (RECOMMENDED workaround):** the cloud sandbox used so far cannot reach the npm registry, so
`pnpm install` fails there. Visual checks were done with esbuild + packages from `/opt/npm-tools/node_modules` and
Playwright (see TEST-LOG). Rely on CI for typecheck/tests and always wait for it after pushing.

## 4. Things not to change casually

- `apps/server/src/web.ts`: host routing (landing vs app), CSP strings (`WEB_CSP`, `LANDING_CSP`), `X-Robots-Tag: noindex`
  on the app host, `www.` → apex 301. The landing CSP allows inline scripts and `https://trustseal.enamad.ir` images.
- `Dockerfile`: pnpm installed via `npm install -g pnpm@10` (corepack failed on Liara); build location Germany (`liara.json`).
- `apps/landing-ir/` is **generated** by `scripts/sync-landing-ir.mjs` from the separate repo `sazhlord1/purrposelanding`
  (`public/fa/`), then post-processed by `scripts/landing-ir-seo.mjs` + `scripts/landing-ir-faq.mjs`. Edit the scripts or the
  landing repo, not only the generated HTML, or the next sync will undo it. Enamad meta tag, `4894141.txt` and footer seal must stay.
- Android `applicationId` `space.purrpose.app` (`apps/mobile/capacitor.config.json`) — registered with Cafe Bazaar / Ershad;
  must never change. Every release must be signed with the same keystore; `versionCode` = GitHub run number (always increases).
- `SMS_PROVIDER` / IPPanel payload shape (`apps/server/src/services/sms.ts`) is live in production.
- Session tokens are stored hashed; phone codes hashed with 3-minute expiry and 5 tries.

## 5. UX / accessibility / SEO expectations (RECOMMENDED, consistent with existing work)

- RTL correctness in Persian (use `dir`, `unicode-bidi: isolate`, isolate ASCII emoticons with U+2066/U+2069).
- Jalali (Solar Hijri) dates in Persian via `Intl` with `dateLocale()`; Persian digits.
- Respect `prefers-reduced-motion` (`useReducedMotion`, `reduced` props in cats).
- Landing SEO lives in `apps/landing-ir/index.html` (title, description, canonical, OG, JSON-LD
  SoftwareApplication/WebSite/Organization/FAQPage, `robots.txt`, `sitemap.xml`). The app host is noindex on purpose.
