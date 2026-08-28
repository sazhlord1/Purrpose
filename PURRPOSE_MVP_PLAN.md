# Purrpose — MVP Planning Document

**Version:** 1.1 (Revision Pass) · **Date:** 2026-08-26 · **Status:** Approved for implementation
**Audience:** Implementation agent(s). This document is the single source of truth for the Purrpose MVP.
**Identity:** *A serious commitment mechanism wrapped inside a tiny, mischievous, hand-drawn cat world.*

> Tagline: **Get your shit done. Or feed a cat.**

---

## 0. Changelog v1.0 → v1.1

Preserved unchanged: Web-first React/TS PWA · Vite · Framer Motion · TanStack Query · Fastify · Prisma · Postgres · server time authority · settle-on-read + sweep · 3 cats · shared SVG anatomy · manual top-up · no payments/proof/social · anonymous sessions · transaction ledger · unlimited commitment count · 5-min grace deletion · completion confirmation · Capacitor future path.

| # | Change | Why |
|---|--------|-----|
| C1 | **Cat architecture split into 3 layers: Emotional State → Behavior → Scene.** States are context, not animations. A behavior library + probabilistic idle engine replaces fixed per-state loops. | Cat must feel like a living character, not a state-based animated icon. |
| C2 | **Randomized, seeded, bounded, interruptible idle behaviors** per state. | Same screen never plays identically twice; still deterministic/testable. |
| C3 | **Journey is a stage/world, explicitly NOT a progress bar.** Named **scene beats** per phase band; endings = success script / failure script. | Time is communicated spatially ("my cat reached the cabinet"). |
| C4 | **Home redesigned character-first**: one shared living room stage showing all active commitments' cats; stats demoted to a quiet chip row. | "A tiny cat world that happens to manage commitments." |
| C5 | **Real 4-panel onboarding (~30s)** ending deep-linked into first commitment creation. Replaces the 3-panel overlay. | Onboarding itself demonstrates product personality. |
| C6 | **Anonymous session lifecycle fully documented** (creation, persistence, loss, device change, future claim/migration). New **Settings** screen exposes session info. | Required clarity; account/backup labeled future scope. |
| C7 | **Economy formalized: Balance − Active Stakes = Available.** No deduction at creation; logical reservation via ACTIVE status; release on success; consume on failure; creation check atomic under row lock. Reservation is *derived*, not ledgered. | Clarifies "unlimited" = count, not stake; keeps ledger to real movements only. |
| C8 | **DB-level idempotency for failure settlement**: guarded single-row transition `UPDATE … WHERE status='ACTIVE'` + **partial unique index** on `credit_transactions(commitment_id) WHERE type='FAILURE_DEDUCTION'`. Double deduction becomes impossible even under bugs/retries/multi-tab. | Failure must process exactly once, always. |
| C9 | Completion confirm sheet copy locked: **"Did you actually finish it?" / "Yes, I did" / "Not yet."** Single step, decisive. | Lightweight, non-bureaucratic. |
| C10 | **Failure/success language rules codified.** Banned: "Commitment failed" as headline/error framing, guilt language. Failure headline = **"The cat won."** Success = **"You did it. Your N meals are safe."** + cat's "Maybe next time." | Playful consequence + positive impact; never shame. |
| C11 | **NEW dev-only screen: Cat Lab** (`/lab`, stripped from production builds): pick cat/state/behavior, trigger endings, speed, pause/replay, seeded-random inspection, reduced-motion toggle, transition log. | Makes animation iteration dramatically faster. |
| C12 | **SVG differentiation deepened**: per-cat structural params (ear/tail/eye shape, body proportions, default posture, gait & motion personality), not just palette swaps. | Three distinct characters, one illustration system. |
| C13 | **Hand-drawn motion language specified as an easing MIX** (stepped + linear + spring overshoot + irregular pauses); `steps()` not applied mechanically. Intentional imperfection pass (±jitter). | "A doodle that somehow came alive," not engineered vectors. |
| C14 | **Reduced motion = static canonical poses + subtle transitions**, emotion carried by pose/illustration; loops removed, meaning kept. | Accessibility without losing legibility. |
| C15 | **Dev Drawer (dev builds)**: quick-deadline chips (+10s/+1m/+1h/+1d), "expire all", "reset demo data", Cat Lab link. Complements `/dev/time-travel`. | Deadline engine testable in seconds, hidden from users. |
| C16 | **Three-layer product architecture made explicit** (Productivity / Economy / Emotional) with a narrow coupling contract (`CommitmentTimeView`). Emotional layer evolves independently of the engine. | Prevents the cat system and the engine from entangling. |
| C17 | Screen map updated: + Onboarding, + Settings, + Cat Lab (dev). Phase plan renumbered accordingly; **Phase 1 implementation order recommended explicitly**. | Per revision instructions §21/§23. |

---

## 0b. Decisions & Assumptions Log (current)

| # | Decision | Rationale / Assumption |
|---|----------|------------------------|
| D1 | **Web-first PWA (React + TS). No native iOS app in MVP.** | SVG + Framer Motion is the core differentiator and works best in DOM. Capacitor wrap is the future App Store path. |
| D2 | **Real backend exists from day 1.** Server is source of truth for time, state transitions, credit movement. | Kept deliberately tiny: one Node service + Postgres. |
| D3 | **Anonymous device sessions instead of login.** See §E8 for full lifecycle. | Zero onboarding friction; schema already supports future real accounts. |
| D4 | **Availability rule: Balance − Σ(ACTIVE stakes) = Available, per credit type.** No funds move at creation; ACTIVE status *is* the reservation (derived, unledgered). Deduct exactly once on failure; release implicitly on completion. | Prevents negative balances and over-staking; ledger records only actual movements (`STARTER_GRANT`, `TOPUP`, `FAILURE_DEDUCTION`). Atomicity via row-lock + guarded update + unique index (see L3/L7). |
| D5 | **No editing after creation.** Deletion only within a **5-minute grace window**, no consequence. | Commitment devices need teeth; grace window absorbs accidents. |
| D6 | **No CANCELLED state.** `ACTIVE → COMPLETED \| FAILED`. | Simplest honest machine. |
| D7 | **Settle-on-read (primary) + 1-minute sweep (secondary).** All triggers idempotent (C8 mechanisms). | Closed browser/suspension/offline handled with zero extra infra. |
| D8 | **Starter pantry grant:** first session auto-grants **10 meals, 2 kg dry food, 1 vet care** (ledgered `STARTER_GRANT`). | First commitment creatable within 30s of first launch. |
| D9 | **Credit types are symbolic units:** meals (cans), dry food (kg), vet care (visits). Integer amounts ≥ 1. | Matches spec. |
| D10 | **Notifications best-effort client-side** while app/tab open. No push infra. | Explicitly allowed. |
| D11 | **Single-step lightweight completion confirmation** with locked copy (C9). Irreversible after confirm. | Decisive, not bureaucratic. |
| D12 | All timestamps **UTC** internally; rendered local. Deadlines snap to minute. | DST/tz-safe. |
| D13 | Visual direction follows written principles (bold black doodle silhouettes, warm paper, minimal accent). | Illustration authored fresh. |
| D14 | Validation instrumentation = append-only `AppEvent` table. | Answers validation questions later, no vendors. |
| D15 | **Unlimited commitments = unlimited COUNT**, bounded only by Available credits per type. | Economy clarification (C7). |
| D16 | **Multi-cat Home stage**: up to 5 active cats rendered simultaneously on one room strip; overflow summarized. | Character-first Home (C4); trivially feasible since cats are lightweight SVG groups. |

---

# PART ONE — PRODUCT

## A. Product Overview

**Purrpose** is a commitment engine, not a todo app. Users stake symbolic "cat care" credits on a deadline. Complete in time → keep credits; the cat is playfully disappointed. Miss it → credits are deducted, **the cat wins**, it eats, and the impact is recorded. The cat is the **emotional interface of the consequence mechanism** — and it visibly *hopes you fail* as time runs out.

### MVP Philosophy
- Validate 3 things: (1) does staking create urgency, (2) does the cat make consequences emotionally engaging, (3) do people return to check on their cat.
- Everything else excluded: payments, proof, social, shelters, AI, streaks.
- Credits are free to top up manually (dev/test mode is the only mode).
- Priority order within scope: **cat behavior system > cat SVG system > commitment experience > everything else.**

### Product architecture principle (three loosely-coupled layers)

```
┌────────────────────────────────────────────────────────────┐
│  PRODUCTIVITY LAYER   commitments · deadlines · completion │  apps/server
│  ECONOMY LAYER        balances · stakes · ledger           │  apps/server/wallet
│  EMOTIONAL LAYER      cats · states · behaviors · scenes   │  packages/cats
└────────────────────────────────────────────────────────────┘
Coupling contract (the ONLY thing crossing layers):
Productivity → Emotional:  CommitmentTimeView {
  commitmentId, catId, status, createdAtISO, deadlineISO,
  phaseRatio,           // elapsed/(deadline−createdAt)
  msRemaining, phase    // INITIAL|WAITING|ANTICIPATING|VERY_CLOSE|COMPLETED|FAILED
}
Emotional layer consumes ONLY this view + cat config. Changing animation logic never
touches the server; changing engine math never touches animation code.
```

### What "done" means for this MVP
A user can, within ~60s of a cold open: understand the mechanic, create a staked commitment with a chosen cat, watch that cat *live* through escalating scene beats, complete or fail, see credits move, and review history — feeling like a hand-drawn world, not a SaaS tool.

---

## B. User Personas

**P1 — "The Procrastinating Creator" (primary).** 25–40, knowledge worker/student/creator. Uses todo apps; lacks stakes. Tests on phone + desktop. Success: creates 2–4 commitments/week and completes them.

**P2 — "Deadline Daredevil" (secondary).** Thrives on external pressure; enjoys the VERY_CLOSE tension. Success: returns daily just to check on the cat.

Anti-persona: gentle habit-tracking seekers — intentionally not our users.

---

## C. Core User Journey

1. **First open → Onboarding (≤30s, 4 panels):** Meet Purrpose (cat waves, "Get things done.") → "If you don't…" (cat eyes empty bowl) → "…your cat wins." (🥫 5 Cat Meals example) → **Make your first commitment** (deep-links into Create flow). Skippable, shown once.
2. **Home = the cat world.** One living room strip where every active commitment's cat lives out its deadline journey. Quiet chip row: `3 active · 12 meals at stake`. Tap any cat → its world.
3. **Create (30–45s target):** title → deadline → stake type → amount → cat → summary → **Make It Official**. Chosen cat perks up — deal sealed.
4. **Daily loop:** return to see cats further along the stage; behaviors differ every visit (seeded randomness). Escalation readable at a glance: scratcher zone → bowl zone → cabinet zone → pawing at the cabinet.
5. **Resolution:** **I DID IT** → confirm sheet → SUCCESS beat ("Maybe next time."), stake released, balance intact. Or deadline passes → settled once → FAILURE beat (**"The cat won."**), stake deducted exactly once, receipt stamped `FED`.
6. **Return hooks:** living stage, Pantry totals, Impact receipts, escalation drama.

Tone rules (binding for ALL copy): playful, mischievous, cheeky; never guilt-inducing, never shaming, never morally judgmental about failing. Failure is framed as the cat's victory AND real positive impact.

---

## D. Screen Map (revised)

| # | Screen | Route | Purpose |
|---|--------|-------|---------|
| 1 | **Onboarding** | `/onboard` (overlay, first run) | 4 panels ≈30s; ends in Create flow; `localStorage.purrpose.onboarded=1`. |
| 2 | **Home — The Cat World** | `/` | Shared room stage with all active cats (character-first); quiet stat chips; compact list below; **+ New Commitment**; gear icon → Settings. Empty state: stray cat asleep on the stage + prompt. |
| 3 | **Create Commitment** | `/new` | 6 micro-steps, one flow. Dev builds add quick-deadline chips (in 10s / 1m / 1h / tomorrow). |
| 4 | **Commitment Detail / Cat World** | `/commitment/:id` | Full-width stage focused on THIS cat + its beat progression; countdown; stake; **I DID IT**. |
| 5 | **Pantry** | `/pantry` | Balances, Available breakdown, manual Top Up, recent transactions. |
| 6 | **Impact History** | `/impact` | Totals + entries; failures styled as receipts stamped `FED` ("The cat won"), successes crossed-through with sleeping-cat glyph. |
| 7 | **Settings / Session** | `/settings` | Session card (identity created date, device code = token suffix), Reduced Motion toggle, Clear local data (destructive, confirmed), About. Dev builds: link to Cat Lab + Dev Drawer toggle. Cloud backup/account row shown disabled: "Future scope". |
| 8 | **Cat Lab** *(dev-only)* | `/lab` | Animation debugging playground (§G9). Excluded from production bundle via env flag; absent from nav. |
| — | **Dev Drawer** *(dev-only)* | global overlay | Time-travel chips, expire-all, reset demo data. |

Bottom nav: **Home · (+) · Pantry · Impact**. Content column max ~520px on desktop (deliberate: mobile ≈ desktop).

---

## E. UX Flow

### E1. Onboarding (new)
Full-screen paper panels, tap/space to advance, "Skip" top-right.
1. **Meet Purrpose.** Orange cat trots in, waves. H1: "Get things done."
2. **If you don't…** cat turns to an empty bowl; bowl wobbles sadly. Sub: "(it happens to everyone)".
3. **…your cat wins.** Kibble arcs into bowl; cat eats happily. Chip: 🥫 5 Cat Meals. Sub: "Miss your deadline, your stake feeds a cat."
4. **Make your first commitment.** Button → Create flow. Starter grant already silently applied (D8).
Requirement: completable in ≤30s; each panel has one animation, one idea.

### E2. Home (revised, character-first)
- Layout order: greeting line (small hand-font) → **stage strip (~45vh)** → stat chips (quiet, secondary) → compact commitment rows (title/deadline/stake, tappable) → nav.
- Stage: same room component as Detail (`compact` mode). Each active commitment's cat placed by its own phase anchor on slightly offset depth lanes (max 5, then "+N more waiting…" chip → scrolls to list).
- Interactions: tap cat → detail; pull-to-refresh re-syncs phases; returning visit greets with a one-line quip if any cat is VERY_CLOSE ("Miso is eyeing the cabinet.").

### E3. Create Commitment (unchanged structure, fast)
1. Title (autofocus, ≤80 chars) → Enter advances.
2. When: date/time picker + preset chips (Tonight/Tomorrow/Weekend/Next week). Rules: ≥ now+5min, ≤ now+30d (server clock).
3. Stake type: three doodle cards (🥫 Meals / 🍚 Dry Food / 🏥 Vet Care) showing current **Available**.
4. How much: stepper + chips (1/3/5/10). Live availability check; if insufficient, selected cat quips inline ("Bold of you. You don't have that many.") and Next disables.
5. Choose your cat: three cards with live idle previews (each already behaving differently — the behavior engine's first showcase). Selection fires personality quip.
6. Summary + **Make It Official** → POST → land on Detail; INITIAL beat plays.
No extra configuration. Target ≤45s (timed E2E assertion).

### E4. Commitment Detail
Stage shows this cat mid-beat; timeline = the stage itself (day markers as fence posts at true dates); text countdown mirrors quietly beneath. **I DID IT** → confirmation sheet:

> **Did you actually finish it?**
> [ Yes, I did ]  [ Not yet ]

Confirm → optimistic COMPLETED → SUCCESS script plays once → settles into SLEEPING pose. If server later says otherwise (already FAILED), render failure script instead — server wins, UI never blocks on network.

### E5. Settlement UX (failure)
On load/poll revealing a newly-settled commitment: one-time FAILURE script (dash → eat → "I KNEW IT.") → result card:

> ## The cat won.
> You didn't do it. But your 5 Cat Meals will feed a cat.
> [stamp: FED]

Then detail persists in SATISFIED pose. Pantry number ticks down with falling-bowl doodle.

### E6. Top Up (Pantry)
Per-row `+` popover: chips + custom integer → confirm → count-up animation. Every top-up ledgered.

### E7. Impact History
Totals row (completed / failed / donated by type). Entries newest-first; failed = `FED` receipts with the commitment title and date; completed struck-through with sleeping glyph. Playful, never scolding.

### E8. Anonymous session lifecycle (documented)
- **Creation:** first load (no stored token) → `POST /session` → server creates User + Session, applies starter grant once → returns `{userId, token}` → stored `localStorage["purrpose.session"]`.
- **Persistence:** token sent as `Authorization: Bearer`; server maps token→userId; all queries scoped by it. Survives reloads indefinitely.
- **Server association:** every row (commitments, balances, transactions) carries `userId`; tokens never appear in domain tables.
- **Storage cleared:** new identity; prior data orphaned (accepted MVP limitation). Settings shows current device code so users notice identity changes.
- **Device change:** same — fresh anonymous identity.
- **Future claim/migration (documented, NOT built):** `POST /auth/claim {anonymousToken, credential}` would attach a credential to the existing User row; all FKs already hang off `userId`, so nothing migrates. Explicitly labeled future scope in Settings.

### E9. Micro-interactions
Button press = translate(2px,2px)+shadow collapse (≤120ms); card tap tilt; create = cat perk-up; opening detail = head turn toward user (≤400ms); switching cats = personality swap flick; deduction = tick-down + falling bowl; top-up = count-up; cats occasionally glance at the cursor/finger. All subtle, fast, interruptible.

---

# PART TWO — THE CAT SYSTEM ⭐

## G. Cat Architecture (fully revised: State → Behavior → Scene)

### G0. Layer separation

```
CommitmentTimeView ──► EMOTIONAL STATE ──► BEHAVIOR SELECTION ──► SCENE EXECUTION
   (from engine)         (context)          (probabilistic)         (props/anchors)
```
A state is **never** an animation. It configures: available anchors, behavior weight table, facial baseline, posture baseline, speech probability.

### G1. Emotional States (context only)

`INITIAL · WAITING · ANTICIPATING · VERY_CLOSE · SUCCESS · FAILURE · SLEEPING · SATISFIED`

Computed from `phaseRatio` (server-provided, locally interpolated):
INITIAL = first 60s after creation → WAITING (>60% remaining) → ANTICIPATING (25–60%) → VERY_CLOSE (≤25% or ≤12h, whichever first) → terminal SUCCESS/FAILURE (one-shot scripts) → persistent SLEEPING (post-success) / SATISFIED (post-failure).
Constants exported from `packages/shared/src/phases.ts`.

### G2. Behavior Library (verbs, parameterized, reusable across states)

Micro (layered freely, independent timers): `blink · blinkDouble · earFlickL/R · tailFlick · tailWrap · doubleTailFlick · pupilDilate · whiskerForward`
Macro (one at a time, queued): `sit · stand · shiftWeight · lookAround · lookAt(user|bowl|cabinet|scratch|toy|clock) · walkTo(anchor, pace) · dashTo(anchor) · yawn · stretch · groom · scratch(scratcher|air) · batToy · sniff(prop) · inspectBowl · inspectCabinet · pawCabinet(rattle) · attemptOpenCabinet · dragBowl(Δx) · excitedHop · stareAtUser(long) · freeze · shrug · slump · walkAway(anchor) · sleep · bellyPat · celebrateHop · eat(bites:n)`
Props (scene-side, triggered by behaviors or independently): `bowlRattle · cabinetShake · cabinetCrackOpen(peek) · kibbleArc · zzzSpawn · speechBubble(text)`
Every macro behavior: bounded duration, declared interruptibility point set, transform/opacity-only output, emits `onBeat` events.

### G3. Probabilistic Idle Engine (seeded, bounded, interruptible)

```ts
// packages/cats/src/engine.ts
seed = fnv1a(`${commitmentId}:${Math.floor((now - createdAt) / WINDOW_MS)}`) // WINDOW_MS = 15000
rng  = mulberry32(seed)
pickBehavior(state, ctx, rng) -> BehaviorInstance | null
Rules:
- weighted table per state (below); lastBehavior excluded from immediate repeat
- cooldowns per behavior id; micro layer runs on own timers (blink 2–7s random, etc.)
- rate budget: max 1 macro behavior started per 6–12s window (rng-jittered)
- determinism: same commitment + same 15s window ⇒ identical sequence (tests, replay)
- overrides: explicit seed lock + manual triggers (Cat Lab) bypass the picker
- interrupts: state change / unmount / user tap cancels current macro at next
  interruptible point; micro behaviors never block transitions
```

Weight tables (initial tuning, iterate in Cat Lab):

| State | Macro pool (weight) | Micro bias | Speech chance/min |
|---|---|---|---|
| INITIAL | perkUp(once) · lookAt(user) · lickLips(once) | ear/tail lively | high (deal-sealing quip) |
| WAITING | sit · shiftWeight · lookAround · lookAt(clock) · walkTo(scratch→toy) · scratch · yawn · batToy | slow blinks | low |
| ANTICIPATING | walkTo(bowl) · inspectBowl · sniff(shelf) · walkTo(cabinet) · inspectCabinet · groom | pupils+, whiskers forward | med |
| VERY_CLOSE | pawCabinet · attemptOpenCabinet · dragBowl · excitedHop · stareAtUser(long) · freeze | rapid tail, wide eyes | med-high |
| SUCCESS (script) | freeze→slump→shrug→speech("Maybe next time.")→walkAway(bed)→sleep | — | scripted |
| FAILURE (script) | dashTo(bowl)→cabinetCrackOpen→eat×3→sitUp→celebrateHop→speech(personality win line)→bellyPat loop | — | scripted |

Goal: alive but never distracting. If any pool feels busy, reduce weights — never add chaos.

### G4. Scene (the stage)

One horizontal room SVG: `[bed] [scratcher] [toy] [food shelf] [bowl] [cabinet]`, drawn with depth lanes (floor lines). Props are interactive components emitting beats; behaviors address props via named anchors. Day markers (MON…FRI) as fence posts positioned by real dates. Cat x-position = f(phaseRatio) mapped onto zones: WAITING↔scratcher/toy, ANTICIPATING↔shelf/bowl→cabinet approach, VERY_CLOSE↔pinned at cabinet. **Time is spatial** — "my cat reached the cabinet" replaces "82%".

Scene beats naming (signature pattern, used in copy/tests): EARLY (WAITING early band) → MIDDLE (WAITING late: discovers bowl) → LATE (ANTICIPATING: cabinet approach) → VERY_CLOSE (aggressive food-zone interaction) → ENDING (success/failure script).

### G5. Terminal scripts (composed FROM behaviors, one-shot)

- SUCCESS: `freeze(400ms) → slump → shrug → speechBubble(catLine) → walkAway(bed) → sleepLoop` — user feels *"I beat the cat."*
- FAILURE: `excitedFreeze(250ms) → dashTo(bowl) → cabinetCrackOpen → eat(bites:3) → sitUp → celebrateHop ×2 → speech(catWinLine) → satisfiedLoop (bellyPat)` — user feels playful loss + real impact.
Scripts resolve to persistent poses; revisits show the pose + stamp, replaying the script only via Cat Lab or a "replay" affordance in History entries (dev delight, cheap).

### G6. SVG anatomy & per-cat differentiation (deepened)

Layer order: `tail → back-legs → body → front-paws → head(ears·face) → held props`.
Face parts: `eyes(shape) · pupils(style) · mouth(smile/frown/open/grin) · whiskers · brows(optional)` — expression = swapped symbol groups.
Reusable primitives: body, head, ears, eyes, pupils, mouth, paws, tail, accessories (tux chest patch, collar-none), environment objects (bed/scratcher/toy/shelf/bowl/cabinet/kibble/zzz).

```ts
type CatConfig = {
  id: 'orange'|'tuxedo'|'black';
  palette: { body; belly?; ink };
  structure: {
    ears: 'pointy'|'roundTall';            // structural, not color
    tailPath: 'bigCurl'|'longPlume'|'lowHook';
    eyeShape: 'dotWide'|'almond'|'narrowSly';
    bodyLength: number;                    // proportion multiplier
    headSize: number;
    postureDefault: 'upright'|'poised'|'slink';
  };
  motion: { overshootMul; stepFreq; pauseBias };  // personality of movement
  quirks: { chosenLine; waitingLines[]; closeLines[]; loseLine; winLine };
};
```
Orange: upright, big curl tail, dot-wide eyes, bouncy overshoot ×1.3, frequent pauses broken by sudden hops. Tuxedo: poised, long plume tail, almond eyes, minimal overshoot, long deliberate pauses, slow double-blinks. Black: slink posture, low hook tail, narrow sly eyes, fast tail ticks + sudden freezes. Result: three characters, one system — never "same cat, three colors."

Hand-drawn rendering rules: ink stroke `#1A1A1A`, width varies 2–3.5 within one drawing, round caps, imperfect beziers, mostly unfilled silhouettes, static paper-grain texture (no animated filters).

### G7. Hand-drawn motion language (easing MIX, not mechanical steps)

- Walk cycles: `steps(4)` legs + linear body bob — stop-motion flavor.
- Reactions/perks/hops: springs `{stiffness:260, damping:18}` (visible overshoot).
- Tail: two stacked rotations with irregular durations (organic drift), never sine-perfect.
- Head tilts/gaze: linear with 150–350ms hold pauses.
- Imperfection pass: ±0.5–1px positional jitter + ±10% duration/distance randomization per cycle (seeded rng, so reproducible).
- Forbidden: perfectly looping metronome motion, smooth Disney follow-through everywhere, animated blur/filters.
Performance contract: transform/opacity only; ≤60 scene nodes; ≤1 macro behavior animating at once; target 60fps mid-tier phones.

### G8. Reduced motion
Switch to **static canonical pose per state** (pose library: sitting-alert / waiting / leaning-at-bowl / pawing-cabinet / slumped / victorious-sitting) + 200ms crossfades between poses + semantic badge (Zzz / ! / bowl highlight). No continuous loops, no walks, no dashes. Emotion survives via illustration; aria-label still announces state changes ("Miso waits by her bowl — 2 days left").

### G9. Cat Lab (dev-only, `/lab`)
Same `packages/cats` primitives driven directly. Controls:
- Cat selector (3) · Emotional state selector · Manual behavior buttons (full library incl. props like `cabinetCrackOpen`)
- Trigger SUCCESS script / FAILURE script (replayable)
- Transport: Play / Pause / Replay / Speed slider (0.25×–2×)
- Randomness panel: show current seed · reroll · lock seed (determinism testing)
- Reduced-motion toggle · state-transition log (timestamped inspector)
- Mini stage selector (which anchors exist)
Route registered only when `import.meta.env.DEV`; tree-shaken from prod build; linked from Settings dev card + keyboard shortcut `Ctrl+Shift+L` in dev.

---

# PART THREE — DESIGN & TECH

## H. Design System ("Paper & Ink")

Unchanged from v1.0 in essentials: warm paper `#FAF6EE`, ink `#1A1A1A`, muted orange accent `#E08B4C`, `FED` stamp red `#B4443C`; Gochi Hand display + Inter body (tabular numerals for countdowns/balances); sketchy borders (`border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px`, corner variants `.sketch-a/b/c`), hard offset shadows, rotated stamps; 4px spacing grid; 520px column; motion tokens centralized in `lib/motion.ts` (tap 110ms, sheets 240ms spring, transitions 320ms, standard spring 260/18).
Additions in v1.1:
- Motion token table gains easing-mix presets: `walk`, `reaction`, `drift`, `gaze` (per G7) so UI chrome and cat system share one vocabulary.
- Stamp labels standardized: `AT STAKE` / `KEPT` / `FED`.
- Focus rings: dashed ink outline; touch targets ≥44px; overlays trap focus; contrast ≥16:1 ink-on-paper.

## I. Technical Architecture (revised)

```
purrpose/                       pnpm workspaces
├── apps/
│   ├── web/        React18+TS+Vite · Router · TanStack Query · Zustand(UI-only)
│   │               Framer Motion(MotionConfig) · PWA manifest
│   └── server/     Node20+Fastify+TS · Zod · Prisma · node-cron(1-min sweep,
│                   uses SAME fake clock) · /dev/* endpoints (dev-guarded)
├── packages/
│   ├── shared/     zod schemas · types · CommitmentTimeView · phase/threshold
│   │               math · availability/economy rules — imported by BOTH apps
│   └── cats/       pure React SVG system: anatomy · configs · behavior library ·
│                   idle engine · scene/props · terminal scripts · reduced-motion
│                   poses · ZERO app/server imports (emotional layer isolation)
└── infra/          docker-compose(postgres) · migrations · seed
```

Layer boundaries enforced by lint rule: `packages/cats` may import only `react`, `framer-motion`, `packages/shared/types` (time view types) — never server code, never query clients. This IS the loose coupling of §20.

Stack rationale (unchanged): SwiftUI rejected (0 reuse, slow iteration); Expo/RN rejected (no Framer Motion/DOM SVG/CSS keyframes — fatal for an animation-first product); Flutter rejected (weak hand-drawn SVG pipeline, poor mobile web). **React web PWA chosen**; Capacitor = future iOS bridge.

State management split (unchanged): TanStack Query owns server state (`['me']`, `['commitments']`, `['commitment',id]`, `['history']`, refetchOnWindowFocus, 30s stale); Zustand holds ephemeral UI only (sheets, reduced-motion override, lab controls).

Session & time authority (unchanged mechanics, see E8 + L6): bearer token; server injects `serverTime`; client caches skew correction for countdown smoothness; decisions use server clock exclusively.

## J. Database Schema (Prisma + raw SQL for indexes)

```prisma
enum CommitmentStatus { ACTIVE COMPLETED FAILED }
enum ConsequenceType  { MEALS DRY_FOOD VET_CARE }
enum TransactionType  { STARTER_GRANT TOPUP FAILURE_DEDUCTION }

model User {
  id           String   @id @default(cuid())
  name         String?
  createdAt    DateTime @default(now())
  balances     CreditBalance[]
  commitments  Commitment[]
  transactions CreditTransaction[]
  sessions     Session[]
}

model Session {
  token     String   @id @default(cuid())
  userId    String
  user      User     @relation(fields:[userId], references:[id])
  createdAt DateTime @default(now())
}

model Cat {                 // static seed
  id          String @id   // orange | tuxedo | black
  name        String
  type        String
  personality String
  config      Json         // mirrors CatConfig
}

model Commitment {
  id                String           @id @default(cuid())
  userId            String
  user              User             @relation(fields:[userId], references:[id])
  title             String
  description       String?
  deadline          DateTime         // UTC
  status            CommitmentStatus @default(ACTIVE)
  catId             String
  consequenceType   ConsequenceType
  consequenceAmount Int              // >= 1
  createdAt         DateTime         @default(now())
  completedAt       DateTime?
  failedAt          DateTime?
  @@index([userId, status])
  @@index([status, deadline])
}

model CreditBalance {
  userId     String
  creditType ConsequenceType
  amount     Int              // owned total; never negative
  @@id([userId, creditType])
}

model CreditTransaction {
  id           String          @id @default(cuid())
  userId       String
  user         User            @relation(fields:[userId], references:[id])
  type         TransactionType
  creditType   ConsequenceType
  amount       Int             // always > 0; semantics from type
  commitmentId String?
  createdAt    DateTime        @default(now())
  @@index([userId, createdAt])
}

model AppEvent {
  id        String   @id @default(cuid())
  userId    String?
  name      String
  payload   Json?
  createdAt DateTime @default(now())
}
```

**Migration SQL (critical, beyond Prisma DSL):**
```sql
-- Hard guarantee: a commitment may produce AT MOST ONE failure deduction, ever.
CREATE UNIQUE INDEX ux_failure_deduction_once
  ON "CreditTransaction"("commitmentId")
  WHERE "type" = 'FAILURE_DEDUCTION' AND "commitmentId" IS NOT NULL;
```
Derived (never stored): `available(u,t) = balance.amount − Σ(ACTIVE stakes of t)`.

## K. API Specification (REST `/api/v1`, JSON, Zod-validated)

| Method & Path | Purpose | Notes |
|---|---|---|
| `POST /session` | Anonymous bootstrap | → `{userId, token, serverTime, starterGrantApplied}` (grant exactly once) |
| `GET /me` | Profile + wallet view | → `{user{createdAt}, balances:[{creditType, amount, stakedActive, available}], serverTime}` |
| `GET /cats` | Catalog (3) | Config included for previews |
| `POST /commitments` | Create | 201 · 400 invalid · 409 INSUFFICIENT_AVAILABLE. Availability checked atomically (row lock, see L1). |
| `GET /commitments` | List (settles first) | Runs `settleDue(userId)` in-txn → items + `phase` + `serverTime` |
| `GET /commitments/:id` | Detail (settles) | + `phase`, `remainingMs` |
| `POST /commitments/:id/complete` | Complete | Only ACTIVE→COMPLETED; race loser gets 409 with final state |
| `DELETE /commitments/:id` | Grace delete | ≤5 min since createdAt && ACTIVE; else 409 GRACE_EXPIRED |
| `POST /wallet/topup` | Dev top-up | `{creditType, amount∈[1,9999]}` → updated balance |
| `GET /history` | Impact data | totals + ledger-derived entries |
| `GET /dev/time-travel?addMinutes=n` | **DEV ONLY** | 403 unless NODE_ENV=development; shifts process fake-clock used by ALL reads incl. sweep |
| `POST /dev/reset-demo` | **DEV ONLY** | Wipes + reseeds demo user |

Error shape `{error:{code,message}}`. Rate limit mutations (30/min/token). Unknown fields stripped.

## L. Business Logic

**L1. Creation (atomic).** Txn: `SELECT … FROM CreditBalance WHERE userId,creditType FOR UPDATE` → compute available → validate amount ≤ available (else 409) → insert commitment ACTIVE. Concurrent creations serialize on the row lock; over-reservation impossible.

**L2. Completion.** Txn: `UPDATE Commitment SET status='COMPLETED', completedAt=now WHERE id=:id AND status='ACTIVE' RETURNING` → 0 rows ⇒ read current state: if FAILED (deadline passed) return 409 FAILED_AT_DEADLINE (client renders failure beat), else 409 ALREADY_SETTLED. Exactly one caller wins. No money moves (reservation released implicitly by leaving ACTIVE).

**L3. Settlement `settleDue(userId?)`.** Txn: select `ACTIVE AND deadline<now FOR UPDATE SKIP LOCKED` → per row:
1. `UPDATE … SET status='FAILED', failedAt=deadline WHERE id=:id AND status='ACTIVE'` → affected=1 ⇒ this caller owns it; 0 ⇒ skip.
2. Insert `CreditTransaction{type:FAILURE_DEDUCTION, commitmentId}` — protected by unique index (C8) as backstop.
3. `UPDATE CreditBalance SET amount = amount − stake WHERE amount >= stake` (guaranteed by D4; clamp+error-event if violated).
All triggers (read-settle, sweep, retries, multiple tabs) converge here; deduction happens exactly once.

**L4. Top-up / starter grant.** Validate; increment balance; ledger entry. Grant runs inside first-session txn guarded by "user has zero transactions."

**L5. History.** Ledger join projection; totals aggregated per type.

**L6. Time matrix (unchanged in substance).** Server clock decides everything; offline-return settles on first read; tab-open countdown hits zero → "checking on your cat…" pending state → poll once → failure beat; DST/tz safe (UTC + Intl formatting); skew corrected via cached `serverTime` delta.

**L7. Idempotency summary (explicit).**
| Trigger pair racing | Guarantee |
|---|---|
| read-settle vs sweep | `FOR UPDATE SKIP LOCKED` + status-guarded UPDATE |
| complete vs settle | both take row lock; one transition wins; loser 409+state |
| duplicate completes / double taps | same guard + client debounce |
| retry after network drop mid-settlement | txn rollback ⇒ nothing happened; retry safe; committed ⇒ status no longer ACTIVE ⇒ skip; unique index blocks duplicate ledger row regardless |
| multiple browser tabs | server is arbiter; tabs are dumb views |

**L8. Notifications (best-effort, unchanged):** permission asked contextually post-first-create; local notifications at T−24h / T−1h / T−0 while app open. Copy bank Appendix B.

## M. Edge Cases (consolidated — additions marked ★)

| Case | Handling |
|---|---|
| Complete at deadline ±ε | Server arbitrates; unit tests at ±1000ms boundaries |
| Two devices stale views | refetchOnFocus + 30s staleness; server wins conflicts |
| Insufficient available | Blocked live in UI + enforced atomically server-side |
| Balance would go negative | Impossible via D4+L1; defensive clamp logs error event |
| Grace edge (created 4:59) | Server timestamp compare; expired deletes 409 |
| Spam top-up | Rate limit + amount caps |
| XSS via title | Zod caps + React text-only rendering |
| 30d vs 5m deadlines | Ratio OR absolute-floor thresholds; both tested |
| Zero active | Home empty-state stray cat |
| Repeated failures drain pantry | Creation blocked until top-up — intentional loop to Pantry |
| localStorage cleared | Fresh identity; old orphaned (documented in Settings) ★ |
| Multi-tab simultaneous actions | Server arbitration; last-write-wins on state machine guards ★ |
| Replica-concurrent sweeps | SKIP LOCKED makes them cooperative |
| Clock skew between tabs | Cached serverTime correction factor ★ |
| ★ Behavior engine mid-interrupt (state flips during walk) | Runner cancels at interruptible points; pose snaps to new state baseline ≤320ms |
| ★ Seeded rng regression | Cat Lab seed-lock reproduces any reported sequence exactly |

## N. Security Considerations (unchanged + note)
Bearer auth on all routes except session create; cuid tokens revocable; Zod everywhere; Prisma parameterization; CORS locked to web origin; rate limits; ownership scoping in repository layer; secrets server-env only; HTTPS assumed. ★ Note added to Settings copy: anonymous sessions are convenience-grade; accounts = future scope.

## O. Testing Strategy (updated)

| Layer | Coverage |
|---|---|
| Unit (Vitest + fake timers) | phase thresholds ±1000ms; availability math; creation validation; settlement guards; **behavior picker: seeded determinism (same seed⇒same sequence), no immediate repeats, rate budget respected** ★ |
| Integration (Testcontainers) | full API flows; parallel complete-vs-sweep; double-settle attempts (assert exactly 1 ledger row — index holds under forced race); grace window edges; starter-grant-once |
| Time E2E | time-travel journeys: fail-after-close, succeed-before-line, multi-commitment mixed outcomes, 3-day closure catch-up |
| Flow E2E (Playwright) | J1 create→complete (balance unchanged, KEPT entry) · J2 create→travel→fail (deducted once, FED receipt, "The cat won." card) · J3 top-up propagation · J4 onboarding ≤30s + straight into create ★ · J5 create-flow timed ≤45s |
| Visual/anim | screenshot grid 3 cats × 8 states (poses) ★ · Cat Lab scripted smoke (script playback completes) ★ · manual fps/jitter QA checklist pre-release |
| A11y (axe) | contrast, labels, focus traps, keyboard-only create; reduced-motion renders pose+badge, zero continuous animations ★ |

CI gate: unit + integration + flow happy paths blocking; visual diffs advisory.

## P. Development Phases (renumbered)

| # | Phase | Exit criteria |
|---|---|---|
| 1 | Foundation (order below) | Session round-trip; compose up; schema+migrations incl. unique index; smoke test green |
| 2 | Design system kit | Demo route renders Paper&Ink kit |
| 3 | Cats package — anatomy & configs (static poses) | 24-combo screenshot grid |
| 4 | Wallet & Pantry | Unit+integration green; starter grant once |
| 5 | Commitments CRUD + flows | Timed ≤45s create; 409 paths tested |
| 6 | Behavior engine + Scene + terminal scripts | Living stage at 60fps; seeded-idle tests green; reduced-motion mode done |
| 7 | Deadline engine + settle UX | Time-travel E2Es pass; failure-once proven under race test |
| 8 | Success/Failure polish + copy bank wired | Final Review Criteria signed |
| 9 | Impact History | Totals ≡ ledger |
| 10 | Onboarding + Notifications | Onboarding E2E ≤30s; 4 local notification types fire |
| 11 | Settings + responsive + a11y | Lighthouse a11y ≥95; keyboard-only journey passes |
| 12 | Hardening (rate limits, error taxonomy, skeletons, Dev Drawer polish) | Chaos kill-DB-mid-settle recovers cleanly |
| 13 | Instrumentation + perf + copy pass | §29 events emitted; ship checklist signed |
(Cat Lab ships inside phase 6 — it is the tool that phase depends on.)

### Recommended Phase 1 implementation order (task-level)
1. Monorepo scaffold: pnpm workspaces, base tsconfig, eslint/prettier, vitest workspace config.
2. Infra: docker-compose (postgres:16), Prisma init, schema v1.1 + migration incl. partial unique index SQL, seed script (3 cats from config constants in `packages/shared`).
3. `packages/shared`: enums, zod schemas, `phases.ts` constants, `CommitmentTimeView` type, availability helpers + unit tests.
4. `apps/server`: Fastify bootstrap (env config, error taxonomy, request logging) → auth plugin (bearer→Session) → `POST /session` (+starter grant txn) → `GET /me` → wallet top-up → commitments CRUD + complete + grace delete + `settleDue()` + cron sweep → history. Integration tests per endpoint as landed.
5. Dev tooling: fake-clock offset service + `/dev/time-travel` + `/dev/reset-demo` (403 outside development).
6. `apps/web`: Vite bootstrap, router shell + nav, Query provider, session bootstrap hook, api client with serverTime skew correction, Paper&Ink token CSS baseline (fonts, colors, buttons/cards minimum).
7. Acceptance: local E2E smoke — onboard(skip)→create→complete→history visible — green end-to-end.

## Q. Future Expansion (unchanged hooks)
Payments (`PURCHASE` txn type; wallet mutation isolated behind one function) · shelters/donations (consume `FAILURE_DEDUCTION` event stream) · proof verification (nullable `verificationMethod/verifiedAt` on Commitment; `complete({proof})`) · AI coach (reads AppEvents) · more cats/types (config JSON + enum) · accounts (claim endpoint attaches credential to existing User; zero migration) · iOS via Capacitor wrap.

---

## Final Scope Boundary (v1.1)

**IN:** onboarding · cat-world home · create flow · detail stage with behaviors · settle engine (read+sweep, once-only) · economy (balance/stakes/available, top-up, starter grant, exact-once deductions) · pantry · impact receipts · settings/session · 3 differentiated cats · behavior library + seeded idles + terminal scripts · reduced-motion poses · notifications (local, best-effort) · dev tooling (time-travel, Dev Drawer, Cat Lab) · instrumentation events · tests per §O.

**OUT (do not build):** payments/IAP · real donations · shelter APIs · proof/AI verification · accounts/auth UI · cloud backup/sync · social/leaderboards/profiles · XP/achievements/streaks · push infrastructure · sound design · user-generated cats · analytics vendors · editing commitments · cancellation state · native shells.

---

## Final Review Criteria (§22 sign-off)

| Criterion | Verdict / mechanism | Measured by |
|---|---|---|
| Understand in 30s | 4-panel onboarding, one idea per panel, ends in doing | Onboarding E2E timer + 3 cold-user checks |
| Create in <45s | 6-step single flow, presets, autofill chips | Timed Playwright assertion |
| Cat feels alive (not animated-icon) | State→Behavior→Scene split, seeded varied idles, gaze/props/personality motion | Cat Lab review + "same screen twice ≠ same show" manual check |
| Distinct visual identity | Paper&Ink system, spatial stage, stamps, doodle borders — no dashboard patterns | Screenshot-vs-Todoist gut check ☐ |
| Playful pressure | Escalating scene beats + quiet-but-present stakes chips | VERY_CLOSE session-retention event |
| Still simple | 1 web app + 1 tiny API + Postgres + 2 shared packages | LOC/dependency budget reviewed at phase 12 |
| Future-proof | 3-layer coupling contract; claim/payments/proof hooks documented | Boundary lint rule enforces |
| Reliability (fail exactly once) | Status-guarded transition + FOR UPDATE SKIP LOCKED + partial unique index; raced in tests | Integration race suite green |

---

## Appendix A — Threshold constants (`packages/shared/src/phases.ts`)
```ts
export const PHASE_RULES = {
  initialDurationMs: 60_000,
  anticipatingRatio: 0.6,              // enter when remaining ≤ 60%
  veryCloseRatio: 0.25,                // or ≤ 25%
  veryCloseAbsoluteMs: 12 * 3600_000,  // whichever comes first
} as const;
export const IDLE_RULES = { windowMs: 15_000, macroCooldownMinMs: 6_000, macroCooldownMaxMs: 12_000 } as const;
```

## Appendix B — Copy Bank (voice: lowercase-mischief Orange/Black; dry wit Tuxedo)

| Moment | 🟠 Orange | 🎩 Tuxedo | ⚫ Black |
|---|---|---|---|
| Chosen | "oh!! oh!! deal!!" | "Very well. I shall wait." | "heh. sure you will." |
| Waiting | "taking my time. lots of it." | "I've seen faster humans." | "tick tock." |
| Anticipating | "is that… the cabinet?? nooo (yes)" | "I do enjoy a good suspense." | "the bowl is RIGHT THERE." |
| Very close | "I'M SO READY. ARE YOU??" | "The hour grows late." | "you won't make it. i can smell it." |
| Success (cat) | "aw man. okay. maybe next time." | "Hm. Adequate, I suppose." | "…fine." |
| Failure (cat) | "I KNEW IT!!! NOM NOM NOM" | "Naturally. Bon appétit — moi." | "I KNEW IT. feast mode." |
| Confirm sheet | **Did you actually finish it?** → [Yes, I did] [Not yet] | | |
| Success card | **You did it.** Your 5 Cat Meals are safe. *(feel: I beat the cat)* | | |
| Failure card | **The cat won.** You didn't do it. But your 5 Cat Meals will feed a cat. *[FED]* *(feel: playful loss, real impact)* | | |
| Insufficient stake | "Bold of you. You don't have that many." (adapts per cat voice) | | |

Copy rules (binding): never "Commitment Failed" as a headline; never error-red for failure (ink + `FED` stamp only); never guilt/shame/moral language; humor punches at the situation, never at the user; the cat always wins charmingly, the human always leaves with dignity + impact.

Notifications: Reminder "Your cat is still waiting." · T−24h "24 hours left. Your cat has started checking the food cabinet." · T−1h "Your cat knows what time it is." · Success "You did it. Your cat is disappointed." · Failure "You failed. Your cat is eating."

*End of planning document — v1.1.*
