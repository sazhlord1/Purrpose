# Test and validation log — Purrpose

## Environments

| Environment | Details |
|---|---|
| GitHub Actions CI (`.github/workflows/ci.yml`) | ubuntu-latest, Node 22, pnpm 10, Postgres 16 service; runs `pnpm -r typecheck`, `prisma migrate deploy`, `pnpm -r --workspace-concurrency=1 test`, `pnpm lint` (non-blocking) on every push to `main` |
| Cloudflare Workers Builds | builds the global web app on push (check run "Workers Builds: purrpose") |
| AI cloud sandbox (used for this handoff) | Linux, Node v22.23.4, TypeScript 6.0.3 and esbuild in `/opt/npm-tools/node_modules`, Playwright + Chromium. **No npm registry access** → `pnpm install` impossible; no access to `*.purrpose.ir`, `*.purrpose.space`. |

## Results recorded on 2026-11-10

| Check | Command / source | Result | Notes / what it proves |
|---|---|---|---|
| CI on HEAD `91c9360` | `gh api repos/sazhlord1/Purrpose/commits/91c9360/check-runs` | PASSED (`check` 2026-11-07T08:46:05Z, `Workers Builds: purrpose` 08:45:27Z) | Full typecheck + migrations + Vitest suites (shared unit tests; server integration tests incl. `pacts.test.ts` consent + appeal flow, `phone.test.ts`, `webserve.test.ts`) passed in CI |
| CI history | `gh run list --limit 8` | PASSED for `4194932`, `73cbd50`, `16231c5`, `dcdb8f4`, `a0c8936`, `5eb8cb6` | — |
| Android build | run on `16231c5`, 2026-11-05T13:50Z, release `android-ir-v1.0-b3` | PASSED | Signed ir APK (~5.2 MB). Predates icon change. Not installed on a device by the AI. |
| Shared typecheck | `tsc -p packages/shared/tsconfig.json --noEmit` in a sandbox copy with zod linked | PASSED | Uses TS 6.0.3 (repo pins ^5.7.2) — weaker evidence than CI |
| Workflow syntax | Python `yaml.safe_load` on 3 workflow files | PASSED | Syntax only |
| Landing SEO script idempotency | `node scripts/landing-ir-seo.mjs <copy>`; `cmp` with original | PASSED | Re-running changes nothing |
| Landing structured data | parse all `application/ld+json` blocks | PASSED | 4 blocks: SoftwareApplication, WebSite, Organization, FAQPage |
| Full install/test/build in sandbox | `pnpm install` | BLOCKED | npm registry unreachable |
| Live site checks (redirect, headers, FAQ, Enamad) | — | NOT RUN | host unreachable from sandbox |

## Earlier session checks (2026-11-03 … 11-07, sandbox, visual — *session record*)
- Speech bubbles: all 128 Persian cat lines rendered without overflow; text unchanged after per-line `<text>` change (Chromium). PASSED.
  The original cross-line letter swap could **not** be reproduced in headless Chromium (seen only on the owner's Android WebView).
- Deadline picker: wheel scroll picks hour, today clamps to min, keyboard arrows work (Playwright). PASSED.
- High-five art for 8 cats, dream snacks, gasp variants, scene bubbles across 5 stages: visual review PASSED.
- Store screenshots: the real built web app from APK 1.0 run against a **mocked API** in Playwright — fine for marketing, not a functional test.
- Landing FAQ rendering desktop/mobile: visual PASSED.

## Known coverage gaps
- No web/React unit tests; UI correctness relies on manual/visual checks.
- No automated test on a real Android device/WebView (RTL bidi issues showed up only there).
- No tests for Cafe Bazaar billing (not implemented).
- `scripts/e2e-*.mjs`, `a11y-audit.mjs`, `lighthouse-a11y.mjs` exist but were **NOT RUN** recently (need a running server + web).

## How to record future results
Add a row: date (ISO), commit SHA, command or CI link, PASSED/FAILED/BLOCKED/NOT RUN, one-line evidence, follow-up.
For CI use: `gh api repos/sazhlord1/Purrpose/commits/<sha>/check-runs --jq '.check_runs[]|"\(.name) \(.conclusion) \(.completed_at)"'`.
Never mark something PASSED that you did not run or see a record of.
