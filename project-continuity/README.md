# Project continuity package — Purrpose / پرپس

**Snapshot date:** 10 November 2026 (inspection done 2026-11-10, ~10:00 Asia/Tehran, UTC+03:30)
**Repository:** `sazhlord1/Purrpose` (public, default branch `main`), local clone at `/home/claude/purrpose`
**Snapshot commit:** `91c9360` ("purrpose.ir: FAQ section with FAQPage structured data…", 2026-11-07)

## What this is

A set of documents that lets a fresh AI session (or a new engineer) pick up Purrpose without
the conversation that built it. It records what the code is, what is deployed where, what has
been decided, what was tested, and what is still open. It is documentation only: no
application code was changed to produce it.

## The project in one paragraph

Purrpose is a commitment/productivity app with cartoon cats. A user creates a *pact* (a task
with a deadline) watched by an animated SVG cat. **Honor** pacts stake the in-app currency PURR;
**strict** pacts stake real cat food (cans, dry food, vet visits) bought in the app, need a proof
(text + photo) approved by a witness or the admin, and if the pact fails the food is donated to
shelter cats. There is also a Focus Room (timer with rain/purr audio), *Detective Cheat* (habit
quitting with food stakes), a PURR shop for cats and cosmetic items, and an admin panel. It ships
in two editions from one monorepo: the **global** edition (English + Persian; API on Render,
Postgres on Supabase, web on Cloudflare Workers, Stripe, Google sign-in) and the **Iranian**
edition **پرپس** (Persian only; one Docker container on Liara serving API + web + landing,
Postgres on Liara, phone/SMS login, Cafe Bazaar billing planned), plus a Capacitor Android app
built in GitHub Actions for either edition.

## Files in this package

| File | Use it for |
|---|---|
| [`HANDOFF-2026-11-10.md`](HANDOFF-2026-11-10.md) | **Start here.** Current state, what's done, what's in progress, prioritized roadmap, how to resume, starter prompt. |
| [`INSTRUCTIONS.md`](INSTRUCTIONS.md) | Rules any assistant must follow on this repo (security, DB order, editions, deploys, conventions). |
| [`CONTEXT.md`](CONTEXT.md) | Deep reference: product rules, architecture, repo map, data model, API, env vars, deployment. |
| [`DECISIONS.md`](DECISIONS.md) | Decision register (what was chosen, why, status). |
| [`TEST-LOG.md`](TEST-LOG.md) | What was actually run and its results; what was not run. |
| [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) | Things the owner must confirm or provide. |

Existing project docs this package builds on (not replaced): the root [`README.md`](../README.md)
(setup, per-version upgrade notes, Iranian edition section), [`PURRPOSE_MVP_PLAN.md`](../PURRPOSE_MVP_PLAN.md)
(original product/tech plan, partly outdated), [`docs/SHIP_CHECKLIST.md`](../docs/SHIP_CHECKLIST.md) and
[`docs/PHASE8_REVIEW.md`](../docs/PHASE8_REVIEW.md) (MVP-era sign-offs).

## Reading order for a fresh session

1. This README
2. `HANDOFF-2026-11-10.md` (sections 2, 3, 6, 10, 11)
3. `INSTRUCTIONS.md` (all of it — several rules prevent real damage)
4. `CONTEXT.md` as needed for the area you will touch
5. `OPEN-QUESTIONS.md` before starting anything in payments, legal copy or shelters

## Warning

This is a snapshot. Code moves; check `git log` since `91c9360` and re-verify anything you rely on.
Statements are labelled **CONFIRMED** (seen in code/CI/git), **INFERRED**, **UNKNOWN**,
**NOT TESTED** or **NEEDS VERIFICATION**. Items marked *(session record)* come from the working
conversation with the owner, not from the repository; they could not be re-verified from here
(dashboards such as Liara, Supabase, Render, Cafe Bazaar, Google Search Console are not accessible).
