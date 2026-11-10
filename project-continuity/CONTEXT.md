# Purrpose — project context (snapshot 2026-11-10, commit `91c9360`)

Labels: **CONFIRMED** (seen in code/config/CI), **INFERRED**, **UNKNOWN**, *(session record)* = from the
working conversation with the owner, not verifiable from the repo.

---

## 1. Project overview

- **Name:** Purrpose (English), **پرپس** (Persian brand). Repo `sazhlord1/Purrpose` (public).
- **Purpose:** help people keep commitments. Procrastination "feeds a cat": a cartoon cat watches each pact; failing a
  strict pact donates real cat food to shelter cats. (CONFIRMED: README, code, legal pages.)
- **Audience:** individuals who procrastinate / want accountability; Persian-speaking users in Iran for the Iranian edition.
- **Stage:** live in production in two editions; Iranian Android app v1.0 built but **not yet published** on Cafe Bazaar;
  in-app purchases **not available** in the Iranian edition yet *(session record + CONFIRMED in code: `paymentsEnabled` false for IR)*.
- **Owner:** solo founder (GitHub `sazhlord1`), working with AI sessions.

## 2. Product and functional rules (CONFIRMED in `packages/shared` + `apps/server/src/services`)

### Pacts (commitments)
- Fields: title, optional description, deadline, cat, mode, stake. Deadline max 30 days ahead, min a few minutes.
- **HONOR** pact: stakes PURR (min `HONOR_MIN_STAKE` = 10). User marks it done themselves. Fail → PURR lost (`STAKE_LOST`).
  First `HONOR_STARTER_COUNT` = 3 pacts are "starter" pacts with stake 40 and +10 PURR bonus on success.
- **STRICT** pact: stakes food credits (`MEALS` = cans, `DRY_FOOD` = kg, `VET_CARE` = visits) from the pantry.
  Requires the **donation consent** tick (`donationConsent: true`). On completion user submits a **proof** (text + optional
  photo ≤ 600 KB jpeg/png/webp). A **witness** (email, or Iranian mobile `09xxxxxxxxx`) or the admin reviews it within
  `REVIEW_WINDOW_MS` = 48 h; no decision in 48 h → auto-approved by the sweep. Rejected → pact FAILED, food deducted
  (`FAILURE_DEDUCTION`) = "donated".
- **Appeals:** owner may appeal a rejected proof **once within 3 days** (`APPEAL_WINDOW_MS`). Admin overturns (pact →
  COMPLETED, deduction deleted, food back) or upholds. Stored as `AppEvent` `pact_appeal` / `pact_appeal_decided`.
- Missed deadline without completion → settled FAILED by the 1-minute sweep (`apps/server/src/sweep.ts`), exactly once.
- Grace delete: a pact can be deleted within `GRACE_WINDOW_MS` = 5 min of creation.
- Statuses: `ACTIVE`, `COMPLETED`, `FAILED`. Cat "life stages" 1–5 follow progress through the pact (`packages/cats/src/stages.ts`).

### Economy
- **PURR** currency: welcome gift `PURR_WELCOME` = 120; earned via starter bonuses; bought in packs (global: Stripe).
  Spent on cats (`packages/shared/src/cats.ts → pricePurr`: orange/Miso «کامبیز», tuxedo/Winston «ماهشام», black/Nyx «سیاه چرده»
  free; boba 150, mochi 150, oreo 200, pepper 200, yuki 250) and 18 cosmetic items (`items.ts`).
- **Food credits** bought for money (global: Stripe, `FOOD_PRICES` in USD cents). Iranian prices in code:
  `FOOD_PRICES_IRT` = MEALS 219 000, DRY_FOOD 2 190 000, VET_CARE 1 490 000 toman; costs `FOOD_COST_IRT` 150 000 /
  1 500 000 / 1 000 000. **Owner later chose different Bazaar prices — not yet in code** (see HANDOFF §5).
- `STARTER_FOOD=true` env gives new players 10 meals, 2 dry, 1 vet (off by default).

### Other features
- **Focus Room** (`/focus`): timer with seamless rain + purr Web Audio loops (`apps/web/src/lib/ambient.ts`); sessions saved (`FocusSession`).
- **Detective Cheat** (`/detective`, habits): quit a habit for 7/14/30/60 days, allow 2–10 slips, stake food; each confessed
  slip locks stake/maxSlips; at the end locked share is donated and rest returned; hitting the limit donates all.
- **Shop** (`/shop`): unlock cats, buy/equip items with PURR; buy packs/food (global only today).
- **Impact** (`/impact`): history of results and donated food.
- **Share cards** (`apps/web/src/lib/shareCard.ts`): PNG cards when a pact starts, wins or loses.
- **Notifications:** global web push (VAPID, 24h/1h/failed) via sweep; Android app schedules **local** reminders on the phone
  (`apps/web/src/lib/localReminders.ts`, Capacitor LocalNotifications).
- **Guided tours / onboarding**, admin-only dev pages `/lab`, `/cats`, `/design`.
- **Accounts:** guest session created automatically (`POST /api/v1/session`); upgrade to account via email+password,
  Google (global), or phone+SMS (Iranian). Guest progress merges into the account (`services/merge.ts`).
- **Admin** (`/admin`): stats, user list/search/detail, PURR grant, proof review queue, appeals queue.

## 3. Technology stack (CONFIRMED from manifests)

| Layer | Tech |
|---|---|
| Monorepo | pnpm 10 workspaces, TypeScript ^5.7, Node 22 (engines ≥ 20), ESM |
| Web | React 18.3, Vite 6, react-router-dom 6.28, @tanstack/react-query 5, framer-motion 13, howler 2 (+ Web Audio), PWA (`public/sw.js`, manifest) |
| Cats | `@purrpose/cats`: hand-built SVG React components, seeded behavior engine |
| Shared | `@purrpose/shared`: zod 3.24 schemas, economy, catalog, phases, i18n helpers |
| Server | Fastify 5, @fastify/cors, Prisma 6 (PostgreSQL), zod, tsx (dev), Vitest 3 |
| Mobile | Capacitor 8 (android, app, filesystem, keyboard, local-notifications, preferences, share, splash-screen, status-bar) |
| Global hosting | Web: Cloudflare Workers static assets (`wrangler.jsonc`, project `purrpose-web`). API: Render (INFERRED from README/Dockerfile comment). DB: Supabase Postgres. |
| Iranian hosting | Liara: Docker app (`liara.json`, port 3000, build in Germany) serving API + web + landing; Liara Postgres (`purrpose-db`, private network) *(session record)*. DNS zone `purrpose.ir` on Liara nameservers *(session record)*. |
| Payments | Stripe Checkout (global). Cafe Bazaar in-app billing (Iranian) — **planned, not implemented**. |
| SMS (Iranian) | IPPanel / Artapayamak (`SMS_PROVIDER=ippanel`), also supports Kavenegar, sms.ir, console |
| CI/CD | GitHub Actions: `ci.yml`, `android-build.yml`, `android-bootstrap.yml`; Cloudflare Workers Builds on push |

## 4. Architecture

```mermaid
flowchart LR
  subgraph Global edition
    W1[Web app<br/>Cloudflare Workers<br/>app.purrpose.space] -->|HTTPS /api/v1| A1[API server<br/>Fastify on Render]
    A1 --> D1[(Supabase Postgres)]
    A1 --> S1[Stripe Checkout]
    L1[Landing purrpose.space<br/>separate repo purrposelanding]
  end
  subgraph Iranian edition — one Liara container
    C[Fastify server] -->|host = purrpose.ir / www| L2[apps/landing-ir static]
    C -->|host = app.purrpose.ir| W2[Web app VITE_EDITION=ir]
    C --> D2[(Liara Postgres)]
    C --> SMS[IPPanel SMS]
  end
  APK[Android app Capacitor<br/>global or ir build] -->|API URL baked at build| A1
  APK -->|ir build| C
```

- **Request flow (Iranian):** browser → `app.purrpose.ir` → Fastify. `/api/*` and `/healthz` go to routes; other GETs go to
  `serveWeb` (`apps/server/src/web.ts`) which serves files from `WEB_DIST` (SPA fallback to `index.html`) or, for
  `LANDING_HOSTS`, from `LANDING_DIST`. Per-site CSP; app host gets `X-Robots-Tag: noindex, nofollow`; `www.` 301 → apex.
- **Android app:** loads the built web app from the APK (`webDir ../web/dist`, origin label `https://app.purrpose.space`,
  UA suffix `PurrposeApp/1`) and calls the API at `VITE_API_URL` baked in at build time (ir: `vars.VITE_API_URL_IR`
  default `https://app.purrpose.ir`).
- **Sweep:** every 60 s in the server process: settle overdue pacts, auto-approve stale proofs, close finished habits,
  send web-push; hourly purge of proof photos 30 days after decision.

## 5. Repository map (CONFIRMED paths)

```
apps/
  server/            Fastify API
    src/app.ts         buildApp: plugins, routes, onSend headers, notFound → serveWeb
    src/index.ts       entry (listen, ensureAdmin, startSweep)
    src/env.ts         all env vars (zod)        src/web.ts  static web/landing serving, CSP
    src/routes/*.ts    admin auth cats commitments dev focus habits history me payments push session shop wallet
    src/services/*.ts  accounts commitments google habits merge payments phoneCodes purr push shop sms stripe wallet webpush
    src/sweep.ts       1-minute background jobs    src/clock.ts  test-controllable time
    prisma/schema.prisma, prisma/migrations/*  (10 migrations, latest 20261102000000_phone_login)
    test/*.test.ts     Vitest integration tests (need Postgres)
  web/               React app
    src/App.tsx        routes      src/lib/edition.ts IS_IR_EDITION
    src/pages/*        Home Pacts NewCommitment CommitmentDetail Focus Detective Shop Pantry Impact Settings Login Witness Admin AdminUser AdminLogin Legal LegalIr CatLab CatsGallery DesignSystem
    src/components/*   DeadlinePicker PawShake HighFiveArt PhoneLogin ReviewQueue AppealQueue pact/AppealBox pact/ProofForm …
    src/lib/*          api auth queries payments notifications localReminders shareCard shareLink ambient tours …
    src/i18n/          index.ts (t, locale, digits) + fa/*.ts Persian strings
    src/styles/tokens.css   all CSS
    public/            fonts (Anjoman woff2; Latin fonts come from Google Fonts in the global edition only), icons, audio, sw.js, manifest, _headers (Cloudflare)
  mobile/            Capacitor config + android/ project (icons in android/app/src/main/res/mipmap-*)
  landing-ir/        GENERATED Persian landing (index.html, fonts, icons, img, og-fa.png, robots.txt, sitemap.xml, 4894141.txt)
packages/
  shared/src/        schemas.ts economy.ts store.ts cats.ts catsFa.ts items.ts habits.ts phases.ts time.ts i18n.ts catText.ts enums.ts
  shared/test/       unit tests (economy, habits, phases, schemas, store)
  cats/src/          Cat.tsx CatScene.tsx LivingCat.tsx FaceKit.tsx SpeechBubble.tsx engine.ts items.tsx stages.ts textFit.ts …
infra/               docker-compose.yml (local Postgres), supabase_setup.sql, supabase_upgrade_v2…v10.sql
scripts/             e2e-*.mjs, a11y-audit, lighthouse-a11y, responsive-sweep, chaos-check, capture-*, smoke-api,
                     sync-landing-ir.mjs, landing-ir-seo.mjs, landing-ir-faq.mjs
docs/                SHIP_CHECKLIST.md, PHASE8_REVIEW.md, gallery/, concept-locations/, e2e/
Dockerfile, liara.json, wrangler.jsonc, README.md, PURRPOSE_MVP_PLAN.md
```

## 6. Data and persistence (CONFIRMED: `apps/server/prisma/schema.prisma`)

Models: `User` (role USER/ADMIN, purrBalance, loadout JSON, email/passwordHash/googleId, phone/phoneVerifiedAt, names),
`Session` (hashed token, expiry), `Commitment` (+ mode, purrStake, starter, proofRequired, witnessEmail, witnessToken,
proofSubmittedAt, reviewDueAt, reviewedAt, reviewedBy `witness|admin|auto`, reviewNote), `CommitmentProof` (text, image bytes),
`CreditBalance` (per user × ConsequenceType), `CreditTransaction` (STARTER_GRANT/TOPUP/FAILURE_DEDUCTION, commitmentId/habitId),
`PurrTransaction` (PURCHASE, SANDBOX_PURCHASE, ADMIN_GRANT, SPEND, WELCOME, STAKE_LOST, PACT_BONUS), `CatUnlock`, `ItemUnlock`,
`FocusSession`, `PushSubscription` (+locale), `NotificationLog` (T24H/T1H/FAILED, once each), `AppEvent` (analytics + consent +
appeals, JSON payload), `Habit` (ACTIVE/KEPT/BROKEN) + `HabitSlip`, `Payment` (Stripe), `PhoneCode` (hashed code, expiry, attempts).

- `witnessEmail` holds either an email or a normalized `09…` mobile number (Iranian witness by phone).
- Proof photos stored in the DB, purged 30 days after review.
- Supabase has RLS enabled on every table (v2 SQL); the server connects as table owner.

## 7. API (REST, `/api/v1`, JSON, zod-validated; CONFIRMED from route files)

- Session/auth: `POST /session`, `POST /auth/register|login|logout|google|admin/login`, `GET /auth/phone`, `POST /auth/phone/send|verify`
- Me: `GET /me`, `POST /me/name`, `POST /me/welcome-seen`
- Pacts: `POST|GET /commitments`, `GET|DELETE /commitments/:id`, `POST /commitments/:id/complete|proof|appeal`, `GET /commitments/:id/proof-image`
- Witness: `GET /witness/:token`, `GET /witness/:token/image`, `POST /witness/:token/review`
- Habits: `GET|POST /habits`, `POST /habits/:id/slip`, `DELETE /habits/:id`
- Shop/wallet/payments: `GET /shop`, `POST /shop/unlock|items/buy|items/equip|checkout`, `POST /wallet/topup|checkout`,
  `POST /payments/confirm`, `POST /stripe/webhook`
- Focus/history/cats/push: `POST /focus/sessions`, `GET /focus/summary`, `GET /history`, `GET /cats`,
  `GET /push/public-key`, `POST /push/subscribe|unsubscribe`
- Admin (role ADMIN): `GET /admin/stats|users|users/:id|reviews|reviews/:id/image|appeals`, `POST /admin/reviews/:id|appeals/:id|purr/grant`
- Dev (NODE_ENV=development only): `GET /dev/time-travel`, `POST /dev/reset-demo`, `GET /dev/events`
- Health: `GET /healthz`, `GET /api/v1/healthz`

Error shape: `{ error: { code, message, details? } }`; codes in `apps/server/src/errors.ts`.

## 8. Configuration (names only — values live in dashboards)

Server (`apps/server/src/env.ts`): `NODE_ENV` (default production), `PORT`, `HOST`, `DATABASE_URL`*, `WEB_ORIGIN`, `TRUST_PROXY`,
`WEB_DIST`, `LANDING_DIST`, `LANDING_HOSTS` (default `purrpose.ir,www.purrpose.ir`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`GOOGLE_CLIENT_ID`, `PAYMENTS_MODE` (disabled|sandbox|stripe|live), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STARTER_FOOD`,
`SMS_PROVIDER`, `SMS_API_KEY`, `SMS_TEMPLATE`, `SMS_CODE_PARAM` (default CODE), `SMS_FROM`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`. Tests: `DATABASE_URL_TEST`.
Planned (not in code yet): `BAZAAR_CLIENT_ID`, `BAZAAR_CLIENT_SECRET` (Cafe Bazaar developer API) *(session record)*.

Iranian Liara values set by the owner *(session record)*: `SMS_PROVIDER=ippanel`, `SMS_API_KEY`, `SMS_TEMPLATE` (pattern code),
`SMS_FROM` (sender line), `SMS_CODE_PARAM=code`, `PAYMENTS_MODE=disabled`, `NODE_ENV=production`, `DATABASE_URL`, admin vars.

Web build: `VITE_EDITION` (`ir` for Iranian), `VITE_API_URL` (empty = same origin), `VITE_GOOGLE_CLIENT_ID`.
GitHub: secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`; variables `VITE_API_URL_IR`,
`VITE_API_URL` (global API URL for the global APK), `VITE_GOOGLE_CLIENT_ID`.

## 9. Design and implementation decisions
See [`DECISIONS.md`](DECISIONS.md). Key ones: one codebase/two build-time editions; Iranian edition self-contained inside Iran;
Supabase schema via hand SQL before deploy; consent/appeals in AppEvent (no migration); bubbles on scene top layer, one `<text>`
per line; Jalali deadline picker; real-cat high-five art; Mahsham icon.

## 10. Current implementation state
See [`HANDOFF-2026-11-10.md`](HANDOFF-2026-11-10.md) §3–§6.

## 11. Known limitations / technical debt
- Root `README.md` still says the web app is on **Vercel**; the global web app now deploys to **Cloudflare Workers** (wrangler + Workers Builds). README is partially outdated.
- `PURRPOSE_MVP_PLAN.md` describes the original MVP; many later features (editions, phone login, appeals, Bazaar) are not in it.
- No web unit tests; UI verified manually/screenshots.
- `apps/landing-ir` is generated; manual edits get lost unless encoded in the sync/seo/faq scripts.
- Duplicate Persian landing content on `purrpose.space/fa/` and `purrpose.ir` (SEO: Google reported "Crawled – currently not indexed" for purrpose.ir) *(session record)*.
- Witness notification is manual (owner shares the link); no SMS to witness.
- Iranian edition cannot sell anything until Bazaar billing is built.
- Food price constants in code don't match the prices the owner set in Cafe Bazaar *(session record)*.

## 12. Operational knowledge
- Local dev: `pnpm install`, `pnpm db:up` (docker Postgres), `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev:server` (:3000), `pnpm dev:web` (:5173).
- Tests: `pnpm --filter @purrpose/shared test` (no DB), `pnpm --filter @purrpose/server test` (Postgres; wipes data).
- Iranian deploy: push to `main` → Liara builds `Dockerfile` (auto-deploy gated on CI) → container runs `prisma migrate deploy`.
- Global deploy: push to `main` → Cloudflare Workers Builds (web); Render (API, INFERRED auto-deploy); Supabase SQL first if schema changed.
- Android APK: Actions → **Android build** → inputs `release` (GitHub Release), `edition` (`global`|`ir`), `version` (e.g. `1.0`).
  Output artifact `purrpose-android-<version>` and, if release, tag `android-<edition>-v<version>-b<run>`.
- Landing re-sync: `node scripts/sync-landing-ir.mjs ../purrposelanding` (needs that repo cloned next to this one); re-apply SEO/FAQ by hand: `node scripts/landing-ir-seo.mjs apps/landing-ir/index.html`.

## 13. Glossary
- **Pact** = commitment. **Honor** (PURR stake, self-reported) vs **Strict** (food stake, proof, witness).
- **PURR / میو** = in-app currency. **Pantry / انبار** = food credits. **MEALS** = cans (کنسرو), **DRY_FOOD** = kg, **VET_CARE** = vet visit.
- **Witness / شاهد** = person who approves a proof via `/witness/:token`.
- **Detective Cheat / کارآگاه چیت** = habit quitting; **slip / چیت** = a confessed lapse.
- **Sweep** = 1-minute background job. **Edition** = global vs `ir` build. **IR** = Iranian.
- **Mahsham / ماهشام** = the tuxedo cat (app icon). Cats: Miso/کامبیز (orange), Winston/ماهشام (tuxedo), Nyx/سیاه چرده (black), Boba/هالو, Mochi/کاچی, Oreo/کت‌من, Pepper/مماس الملوک, Yuki/یوکی.
- **Enamad / اینماد** = Iranian e-commerce trust seal (code 4894141 verification, seal id 8506135).
- **Liara / لیارا** = Iranian PaaS. **Cafe Bazaar / کافه‌بازار** = Iranian Android store. **Ershad** = digital works registration form (filled with package `space.purrpose.app`).
