# Decision register — Purrpose

Chronological. Dates are commit dates on `main` or, for *(session record)* items, the date the owner decided in the AI session.
Status: CONFIRMED · INFERRED · NEEDS CONFIRMATION · SUPERSEDED.

| # | Date | Decision | Context / reason | Status | Affected | Revisit? |
|---|---|---|---|---|---|---|
| 1 | 2026-08 (init migration) | pnpm monorepo: React/Vite web, Fastify/Prisma/Postgres server, shared zod package, SVG cats package | Original MVP plan (`PURRPOSE_MVP_PLAN.md`) | CONFIRMED | all | No |
| 2 | 2026-09-27 | Accounts, PURR currency, cat unlocks, web push; Supabase schema via hand SQL (`infra/supabase_upgrade_vN.sql`) with RLS | Supabase hosted DB; owner runs SQL in its editor | CONFIRMED | `infra/`, `apps/server` | No |
| 3 | 2026-10 (v4) | Supabase SQL must run **before** deploying the server that needs it | Avoid 500s during deploy | CONFIRMED (README) | process | No |
| 4 | 2026-10-08 | Persian language with RTL and Anjoman font | Persian audience | CONFIRMED | web i18n, cats | No |
| 5 | 2026-10-14 | Android via Capacitor, built and signed in GitHub Actions; package `space.purrpose.app` | No local Android toolchain needed | CONFIRMED | `apps/mobile`, workflows | No — package must never change |
| 6 | 2026-10-23 | Two pact modes: HONOR (PURR) and STRICT (food + proof + witness); 48h auto-approve; welcome PURR 120 instead of free food (`STARTER_FOOD` opt-in) | Make real stakes meaningful, keep onboarding free | CONFIRMED | shared/economy, server | No |
| 7 | 2026-10-24 | Stripe Checkout for the global edition | Payments outside Iran | CONFIRMED | `services/stripe.ts` | No |
| 8 | 2026-10 (INFERRED date) | Global web moved to Cloudflare Workers static assets (README still says Vercel) | Evidence: `wrangler.jsonc`, "Workers Builds" check | INFERRED | hosting | Update README |
| 9 | 2026-11-01 | **Iranian edition on Liara**: one Docker container serves API + web (`WEB_DIST`) + landing (`LANDING_DIST`, host-based) | Must work during international internet cuts; one origin = no CORS | CONFIRMED | `Dockerfile`, `web.ts`, `env.ts` | No |
| 10 | 2026-11-01 | `VITE_EDITION=ir` build: Persian only, no Stripe, no Google login, no Google Fonts | Nothing loaded from abroad | CONFIRMED | `apps/web/src/lib/edition.ts`, vite config | No |
| 11 | 2026-11-01 | pnpm installed with `npm install -g pnpm@10` in Docker; Liara build location Germany | Corepack download failed on Liara; npm blocked from Iran | CONFIRMED | `Dockerfile`, `liara.json` | No |
| 12 | 2026-11-01 *(session record)* | Same `main` branch for both editions; changes go to both unless owner says otherwise | Single codebase | CONFIRMED | process | No |
| 13 | 2026-11-02 | Persian brand **پرپس** (was پرپوز) | Owner choice | CONFIRMED | i18n, Android label, landing | No |
| 14 | 2026-11-02 | Phone + SMS code login for IR (`09` + 11 digits), 5-digit code, 3-min expiry, 5 tries; guest progress merges | Google unavailable in Iran | CONFIRMED | `auth.ts`, `phoneCodes.ts`, Prisma `PhoneCode` | No |
| 15 | 2026-11-02 | Android reminders as **local** notifications (no push server) | Works offline / without Google services | CONFIRMED | `localReminders.ts` | No |
| 16 | 2026-11-03 | SMS provider IPPanel/Artapayamak (pattern send) | Owner's SMS vendor | CONFIRMED | `services/sms.ts` | No |
| 17 | 2026-11-03 | Witness may be an Iranian mobile number; witness signs in with that number | No email culture for IR users | CONFIRMED | commitments service/route | No |
| 18 | 2026-11-03 | Removed "items have no cash value" clause (food is bought for real) | Owner request | CONFIRMED | `Legal.tsx` | No |
| 19 | 2026-11-03 | Enamad: meta tag + `4894141.txt` + 56px footer seal on purrpose.ir | Iranian e-commerce trust | CONFIRMED | `sync-landing-ir.mjs`, `LANDING_CSP` | No |
| 20 | 2026-11-04 | Speech bubbles drawn by `CatScene` on top layer; one `<text>` per line | Overlaps and Android bidi bug | CONFIRMED | `packages/cats` | No |
| 21 | 2026-11-04 | Custom Jalali deadline picker (day strip + wheels, 5-min grid, max 30 days) replacing native datetime input | Owner: native picker poor, must be Shamsi | CONFIRMED | `DeadlinePicker.tsx` | No |
| 22 | 2026-11-04 | High-five card uses the real `Cat` with a `highFive` paw action + drawn human hand | Old figures looked wrong | CONFIRMED | `HighFiveArt.tsx`, FaceKit | No |
| 23 | 2026-11-04 | Explicit **donation consent** for strict pacts (server-enforced, logged with version `donation-v1`) | Legal risk reduction | CONFIRMED (owner approved) | schemas, commitments service, NewCommitment | No |
| 24 | 2026-11-04 | Avoid betting words in formal texts (terms, store, share cards) | Iranian law treats gambling/betting as void/criminal; owner approved | CONFIRMED | i18n, legal pages | No |
| 25 | 2026-11-04 | **Appeals**: one per pact within 3 days of a rejected proof; admin overturn restores food; stored as AppEvent (no migration) | Fairness, legal risk; avoid DB migration | CONFIRMED | commitments service, admin | No |
| 26 | 2026-11-04 *(session record)* | Owner will handle "shelter transparency" and "fundraising licence" items himself | Owner choice | CONFIRMED | — | Follow up |
| 27 | 2026-11-04 *(session record)* | Refund policy for unused food | Proposed; **no decision** | NEEDS CONFIRMATION | terms, admin | Yes |
| 28 | 2026-11-05 | Android build takes a `version` input; tags `android-<edition>-v<version>-b<run>` | Ershad/Bazaar need version 1.0 | CONFIRMED | `android-build.yml` | No |
| 29 | 2026-11-05 *(session record)* | Keep package `space.purrpose.app` for the Bazaar app (shared with global) | Already entered in the Ershad form | CONFIRMED | mobile | No |
| 30 | 2026-11-05 *(session record)* | Publish v1.0 only **with** Cafe Bazaar billing (not a free-food-only release); upload privately first | Owner judged the no-purchase version pointless | CONFIRMED | roadmap | No |
| 31 | 2026-11-05 *(session record)* | Bazaar SKUs `food_meals`, `food_dry`, `food_vet`, `purr_150`, `purr_250`, `purr_500`, `purr_1000`, all consumable; prices 189k/749k/1.49M and 39k/59k/99k/169k toman | Owner chose food prices; PURR prices proposed by AI and adopted | CONFIRMED (in panel: NEEDS VERIFICATION) | store.ts (pending) | Yes — food prices may be below cost after commission |
| 32 | 2026-11-05 | Mahsham (tuxedo) on a warm gradient as the app icon everywhere | Owner request | CONFIRMED | icons | No |
| 33 | 2026-11-06 | purrpose.ir SEO: www→apex 301, app host noindex, richer JSON-LD | Indexing | CONFIRMED | `web.ts`, landing scripts | No |
| 34 | 2026-11-07 | Landing FAQ (12 Q&A) + FAQPage JSON-LD, generated by script | SEO + trust | CONFIRMED | `landing-ir-faq.mjs` | Update Q6/Q10 later |
