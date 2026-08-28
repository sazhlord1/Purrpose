# Purrpose

A commitment engine where procrastination feeds a cat. See `PURRPOSE_MVP_PLAN.md` for the full plan.

## Layout

- `apps/web` — React + Vite PWA (emotional layer UI)
- `apps/server` — Fastify + Prisma + Postgres (productivity + economy layers)
- `packages/shared` — zod schemas, phase math, economy rules
- `infra/` — docker-compose Postgres

## Quick start

```powershell
pnpm install          # also runs prisma generate
pnpm db:up            # start postgres (docker)
pnpm db:migrate       # apply migrations
pnpm db:seed          # seed the three cats

pnpm dev:server       # http://127.0.0.1:3000
pnpm dev:web          # http://localhost:5173 (proxies /api)

pnpm smoke            # API smoke test against running server
```

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

`/lab` is the Cat Lab (dev tool): pick cat/state/phase, trigger any behavior or terminal script, tune speed/seed, inspect the event log.

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
