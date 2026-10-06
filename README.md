# Purrpose

A commitment engine where procrastination feeds a cat. See `PURRPOSE_MVP_PLAN.md` for the full plan.

## Layout

- `apps/web` — React + Vite PWA (emotional layer UI)
- `apps/server` — Fastify + Prisma + Postgres (productivity + economy layers)
- `packages/shared` — zod schemas, phase math, economy rules, cat catalog & PURR prices
- `packages/cats` — the SVG cats, behavior engine, 5 life-stage scenes
- `infra/` — docker-compose Postgres

## Quick start

```powershell
pnpm install          # also runs prisma generate
pnpm db:up            # start postgres (docker)
pnpm db:migrate       # apply migrations
pnpm db:seed          # create/update the admin account from ADMIN_EMAIL / ADMIN_PASSWORD

pnpm dev:server       # http://127.0.0.1:3000
pnpm dev:web          # http://localhost:5173 (proxies /api)

pnpm smoke            # API smoke test against running server
```

## v2: accounts, admin, PURR, focus sync, web push

### Server environment variables (Render)

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | yes | Supabase Postgres connection string |
| `NODE_ENV` | yes | **Must be `production`** on Render. `development` exposes `/api/v1/dev/*` (time travel, *wipe database*). If unset it now defaults to `production`. |
| `WEB_ORIGIN` | yes (prod) | Your Vercel URL(s), comma-separated, e.g. `https://purrpose.vercel.app`. In production CORS only allows these. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for admin | The admin account is created/updated from these on every server start. The password is stored only as an scrypt hash. To change it, change the variable and redeploy. |
| `PAYMENTS_MODE` | no | `disabled` (default), `sandbox` (PURR packs are free — testing only), `live` (needs a payment provider, see `services/shop.ts → checkout`). |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | for push | Web-push keys. Generate once with `pnpm --filter @purrpose/server vapid:generate`. |
| `TRUST_PROXY` | no | Defaults to `true` in production so rate limits see the real client IP. |

### Upgrading an existing deployment (order matters)

1. **Deploy the server** (Render) with the new code and env vars above. Until step 2 runs, requests fail with 500 — that is expected and harmless (clients keep their session).
2. **Immediately run `infra/supabase_upgrade_v2.sql`** in the Supabase SQL editor. It is idempotent (safe to run twice). It:
   - adds accounts/roles/PURR to `User`, and the `PurrTransaction`, `CatUnlock`, `FocusSession`, `PushSubscription`, `NotificationLog` tables;
   - hashes existing session tokens in place (everyone stays signed in);
   - drops the old `Cat` table (the catalog lives in `packages/shared/src/cats.ts`);
   - enables row-level security on every table so Supabase's public REST API can't read them (the server connects as the table owner and is unaffected).
   If your Render start command runs `prisma migrate deploy` and your database has a `_prisma_migrations` table, the same migration is applied automatically instead.
3. **Deploy the web app** (Vercel). `vercel.json` now also sends security headers (CSP, HSTS, frame blocking).

Fresh database: run `infra/supabase_setup.sql`, then `infra/supabase_upgrade_v2.sql` (or `pnpm db:migrate` locally).

### What's new

- **Accounts.** Guests can create an account (`/login`) — everything they did as a guest moves into it. Sign in from any device. Separate admin entrance at `/admin/login`; `/admin` shows stats and can grant PURR. Dev tools (`/lab`, `/cats`, `/design`) are admin-only in production.
- **PURR & cat unlocks.** Miso, Winston and Nyx are free; Boba, Mochi, Oreo, Pepper and Yuki are unlocked with PURR in the Cat Shop (`/shop`). Prices live in `packages/shared/src/cats.ts` (`pricePurr`), packs in `packages/shared/src/store.ts`. Admins have every cat.
- **Focus Room → server.** Sessions are stored in `FocusSession`; old browser-only minutes are migrated automatically the first time the Focus Room opens.
- **Web push.** 24h-left, 1h-left and "the cat won" notifications are sent by the 1-minute sweep, even when the app is closed (on iPhone: after "Add to Home Screen"). Each notification is sent at most once (`NotificationLog`). Dependency-free implementation of RFC 8291/8292 in `services/webpush.ts`.
- **Design.** Friendly labels instead of internal phase names; a 📦→🌿→🛋️→🏰→👑 stage path with a countdown to the next stage; a "moving day" animation when the cat reaches a new stage; scene lighting that follows the viewer's local time (dawn / dusk / night); "New pact with …" and **Share** (PNG receipt) after a result; Home shows the most urgent cat large and the rest as cards; a live countdown for the free-cancel window.
- **Security.** Hashed session tokens with expiry for logged-in sessions, scrypt passwords, per-IP/per-email login throttling, guest-creation throttling, strict CORS, security headers, 32 KB body limit, RLS on Supabase.

## v3: shop items

Toys, comfort items, bowls, wearables and room decor, bought with PURR in the Cat Shop and shown in every cat scene. They are cosmetic only — they never touch stakes, credits or deadlines.

- Catalog and prices: `packages/shared/src/items.ts`. Drawings: `packages/cats/src/items.tsx` (each piece is drawn around its floor point, so a hand-made PNG can replace one drawing 1:1 — see `ITEM_FOOTPRINT`).
- Where things stand in each stage: `ITEM_LAYOUT` in `packages/cats/src/CatScene.tsx`. Stages 1–2 (street, yard) show only toys, the bowl and wearables; furniture and decor appear from stage 3.
- Rules that keep it physically believable: one item per slot (one toy, one bowl, one scratcher, one neck item, one painting…; decor in different slots can be out together); the cat never walks anywhere — everything it uses is within reach where it sits (toy on the floor by its right paw in stages 2–4, scratcher at its left in stages 3–4, bed and blanket under it). A stray owns little: stage 1 shows only a toy, the bowl appears in stage 2, everything else from stage 3. The eyes follow the mouse or finger, and tapping the cat (home, pact page, shop preview) pets it; it only *looks* at the bowl, fish tank and clock; plant and paintings are pure background. In stage 4 the cat sits on the floor beside the cat tree (a bought post replaces the tree).
- What the cat does with them: `itemMacros` in `packages/cats/src/engine.ts` (when) and the item cases in `LivingCat.tsx` (how). Try them in `/lab` → "Shop items" / "Item behaviors".
- API: `GET /api/v1/shop` now lists `items` + `loadout`; `POST /api/v1/shop/items/buy {itemId}` (buys and equips); `POST /api/v1/shop/items/equip {slot, itemId|null}`. `/me` includes `ownedItemIds` and `loadout`. Admins own every item.

**Upgrading:** deploy the server, then immediately run `infra/supabase_upgrade_v3.sql` in Supabase (idempotent; adds `User.loadout` and the `ItemUnlock` table with RLS on), then deploy the web app. Locally: `pnpm db:migrate`, then restart `pnpm dev`.

**Upgrading to Google sign-in (v4):** run `infra/supabase_upgrade_v4.sql` in Supabase **before** deploying the server (it only adds two nullable columns, so the old server keeps working). The Google OAuth client id is built in (`DEFAULT_GOOGLE_CLIENT_ID` in `packages/shared`); override it with `GOOGLE_CLIENT_ID` on the server and `VITE_GOOGLE_CLIENT_ID` on the web app if it ever changes. The page origin (e.g. `https://app.purrpose.space`) must be listed under *Authorized JavaScript origins* in the Google Cloud console.

## Tests

```powershell
pnpm --filter @purrpose/shared test     # unit tests, no DB needed
pnpm --filter @purrpose/server test     # integration tests, need postgres up; skip cleanly otherwise
```

Integration tests run against `DATABASE_URL_TEST` or the dev database. They wipe data — never point them at a database you care about.

## Dev-only tools (development NODE_ENV only)

- `GET /api/v1/dev/time-travel?addMinutes=N`
- `POST /api/v1/dev/reset-demo`

## Cat gallery

`/cats` renders the 24 static pose combos (3 cats × 8 states) — the reduced-motion canon and future animation keyframes' source of truth.

`/lab` is the Cat Lab (admin / dev tool): pick cat/state/phase, trigger any behavior or terminal script, tune speed/seed, inspect the event log.

Regenerate the screenshot grid after anatomy changes:

```powershell
pnpm build && pnpm gallery:capture   # writes docs/gallery/*.png
```

Living-scene captures (boots API + preview, seeds demo commitments):

```powershell
node scripts/capture-living.mjs
```

Playwright's CDN is geo-blocked on this machine; capture scripts use the installed Chrome channel (`BROWSER_CHANNEL=msedge` to override).

## E2E suites

```powershell
node scripts/e2e-create-flow.mjs    # create flow ≤45s + overstake 409 path
node scripts/e2e-deadline.mjs       # time-travel failure: settle-once, wallet drain, FED receipt
node scripts/e2e-onboarding.mjs     # onboarding ≤30s + success/failure notifications (stubbed)
node scripts/e2e-keyboard.mjs       # keyboard-only journey (Tab/Enter through the whole loop)
node scripts/a11y-audit.mjs         # axe-core across all routes (must be 0 violations)
node scripts/lighthouse-a11y.mjs    # Lighthouse a11y score (must be ≥95)
node scripts/responsive-sweep.mjs   # overflow check + screenshots at 4 breakpoints
node scripts/chaos-check.mjs        # kill DB mid-settle → clean recovery, exactly-once
node scripts/capture-living.mjs     # living-scene screenshots
```
