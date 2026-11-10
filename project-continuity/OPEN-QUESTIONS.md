# Open questions — Purrpose (2026-11-10)

| # | Question | Why it matters | Evidence checked | Unknown | Who resolves | Priority |
|---|---|---|---|---|---|---|
| 1 | Do the 7 Cafe Bazaar products exist with exactly these SKUs/prices (rials incl. tax)? | Billing code depends on exact SKUs | Session instructions only | Whether created; typos (e.g. Persian digits in SKU — the owner first typed `purr_۱۵۰`) | Owner (Bazaar panel screenshot) | P0 |
| 2 | Is the Bazaar developer-API client created with redirect `https://app.purrpose.ir/api/v1/bazaar/oauth/callback`, and are `BAZAAR_CLIENT_ID` / `BAZAAR_CLIENT_SECRET` set in Liara? | Server-side purchase verification | Session only | Status | Owner | P0 |
| 3 | Final food prices and units (dry food per 1 kg or less?) and Bazaar's real commission % | Prices of 189k/can and 749k/kg may be below cost (150k / 1.5M) after commission | `FOOD_COST_IRT` in `store.ts`; owner's chosen prices | Owner's answer; Bazaar contract terms | Owner (Bazaar contract) | P0 |
| 4 | How should the app integrate Bazaar billing (Poolakey via Capacitor plugin vs custom native bridge)? Exact developer-API endpoints for token validation? | Implementation path | `apps/mobile/package.json` has no billing plugin | Plugin availability for Capacitor 8; current Bazaar API docs | Next engineer (research Bazaar docs) | P0 |
| 5 | Support email: `support@purrpose.ir` (legal pages) or `info@purrpose.ir` (exists)? | Users may email a dead address | `CONTACT_EMAIL_IR` in `LegalIr.tsx`; owner created info@ | Whether support@ exists | Owner | P1 |
| 6 | Refund policy for unused (un-staked) food? | Consumer-law risk; store reviews | Proposal in session | Decision | Owner (+ lawyer) | P1 |
| 7 | Add in-app account deletion now? | Store expectations, privacy | Only email-based today | Approval | Owner | P1 |
| 8 | Shelter partner(s) and fundraising licence | FAQ/legal copy claims donations reach shelters | Owner contacting shelters; no reply yet | Contract status; licence need | Owner (+ lawyer) | P1 |
| 9 | Has the SMS API key been rotated, and are daily DB backups on in Liara? | Key was exposed in chat; data safety | Session advice | Status | Owner | P1 |
| 10 | Is the global API still on Render with auto-deploy from `main`? | Deploy safety | README mentions Render; no render.yaml in repo | Current hosting/auto-deploy | Owner (Render dashboard) | P2 |
| 11 | Is the Enamad footer seal image loading now (earlier 403)? | Trust badge | Session | Live state | Owner (open purrpose.ir) | P2 |
| 12 | Add canonical from `purrpose.space/fa/` to `purrpose.ir` (other repo `sazhlord1/purrposelanding`)? | Duplicate content may block indexing | Search Console "Crawled – currently not indexed" | Owner preference | Owner | P2 |
| 13 | Are there existing global-edition Android users who need an update for the consent change? | Old APKs fail to create strict pacts | Release `android-v0.1.2` exists (2026-10-23) | Install base | Owner | P2 |
| 14 | Legal review of `LegalIr.tsx` by an Iranian lawyer done? | Drafts written by AI | File header says "have it read by someone who knows Iranian law" | Status | Owner | P2 |
