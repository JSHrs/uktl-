# Talent Compass — project deliverables and handover note

**For:** the next developer or agent picking up development (prepared for ChatGPT "Astra").
**Current source:** `devacnt/UKTL`; mirror `JSHrs/uktl-` and active Claude branch. Older sections below are historical; current release evidence is in RELEASE_CHECKLIST.md and DEVELOPMENT_GATES.md.
**As of:** 17 September 2026.

Read `CLAUDE.md` first — it is the development guide (commands, architecture, hard rules, auth model, verification checklist). `DEPLOYMENT.md` is the infrastructure runbook. This note is the status report and the backlog: what exists, what was just delivered, what is proven, what is still needed to go live, and what to build next, in order.

---

## 1. What the product is

UK Talent Link's public website plus **Talent Compass**, a recruitment intelligence platform:

| Area | Routes | What it does |
|---|---|---|
| Public site | `/`, `/approach`, `/services`, `/sectors`, `/contact` | Editorial marketing site (Fraunces/Geist, OKLCH tokens, scroll-reveal motion). Contact form persists to D1 and emails the team. |
| Talent Compass (app) | `/app`, `/app/upload`, `/app/candidates`, `/app/candidates/:id`, `/app/jobs`, `/app/jobs/:id`, `/app/discover`, `/app/hr`, `/app/profile` | CV upload → R2 storage → Claude extraction → skills normalisation → 0–100 quality grade with per-section breakdown → scored against every open mandate. Pipeline stages per candidate–mandate. Discover (swipe) view. HR & employment-law FAQ with Claude escalation. Candidate profile. |
| Candidate auth | `/auth/login`, `/auth/register`, `/auth/forgot`, `/auth/callback` | Supabase Auth, server-side sessions in httpOnly cookies, magic-link and sign-up confirmation via the callback route. |
| Admin | `/admin/*` | Overview, FAQ topics, mandates (with Reed.co.uk sync), candidates, bookings, **enquiries**, analytics. Password-protected (see §5). |
| API | `/api/cv/:id` | Streams the original CV from R2 to an admin or the owning candidate. |

**Stack:** TanStack Start (React 19) · Tailwind v4 · Cloudflare Workers + D1 + R2 · Supabase Auth · Anthropic API · Resend · Reed.co.uk API · Playwright · GitHub Actions. Built through `@lovable.dev/vite-tanstack-config` with Nitro's `cloudflare-module` preset.

---

## 2. Delivered in the last development cycle

| PR | Delivered |
|---|---|
| #3 | Adopted this branch as `main`, superseding an earlier rebuild. Brought in: Supabase candidate auth, CV quality breakdown + improvement report, Reed.co.uk job sync, bookings + analytics, the minimalist redesign of the site and app shell, removal of candidate/job mock datasets (AI/parser fallback removal followed in launch hardening). |
| #4 | Fixed all seven Codex review findings: admin server functions now authenticate; candidate data scoped (admin all / candidate own / anonymous nothing); migration 0005 rebuilt correctly; contact form persists + emails; DOCX text extraction; CV linked to the signed-in candidate; magic-link callback. **Also fixed the runtime break that made every page return 500** (`.validator` → `.inputValidator`) and the build failure (import-protection, stale route tree). |
| #5 | `CLAUDE.md`, `README.md`, rewritten `DEPLOYMENT.md`. Landing page: stats strip removed, London→Gulf route animation, word-by-word heading reveals, hover motion, all `prefers-reduced-motion`-safe. |
| #6 | Deployable Workers build + `wrangler deploy --dry-run` passing for staging and production. CI workflow. Playwright suite repaired (24 pass / 7 skipped / 0 fail). Pipeline stages (migration 0008). Admin enquiries inbox. CV download route. Toast notifications. |

---

## 3. Proven state (reproduce before changing anything)

```bash
npm ci
npx tsc --noEmit            # 0 errors — keep it there
npm run build               # Workers bundle → dist/server + dist/client
npm run test:unit            # current security/integration regression tests
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:e2e   # historic baseline: 24 passed, 7 skipped; authenticated tests now require staging credentials
npx wrangler deploy --dry-run --outdir /tmp/wr --env production   # lists DB, CV_BUCKET, ASSETS, vars
```

CI (`.github/workflows/ci.yml`) runs typecheck, build and e2e on every PR and push to `main`; the first run on `main` passed in ~2 minutes. Do not merge red.

Migrations `0001`–`0009` replay cleanly on SQLite (`node:sqlite`, Node 22) — replay them again whenever you add one.

---

## 4. Not yet done — required before go-live

Nothing has been deployed to any environment yet. In order:

1. **Cloudflare infrastructure** — create D1 databases and R2 buckets, paste the D1 ids into `wrangler.toml`, apply migrations (`DEPLOYMENT.md` §1).
2. **Supabase project** — apply `supabase/migrations/20260915000001_initial.sql`; set Site URL; add `<SITE_URL>/auth/callback` to Redirect URLs for each environment (§1.4).
3. **Vars and secrets** — fill every `[vars]` / `[env.*.vars]` block; `wrangler secret put` for `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `SUPABASE_SERVICE_ROLE_KEY`, `REED_API_KEY` (§2).
4. **Configure secure admin access.** Demo-password and signing-key fallbacks are removed. Set both secrets and apply D1 migration 0009. Browser tests read `E2E_ADMIN_PASSWORD` and require a configured staging URL.
5. **Deploy staging, run the post-deploy checklist** (`DEPLOYMENT.md` §4), then production.
6. **Resend sender domain** — `noreply@uktalentlink.co.uk` must be verified in Resend or notifications otherwise fail and are recorded in the admin delivery status.

Housekeeping worth one dedicated commit each: run `prettier --write .` once so `npm run lint` becomes meaningful (currently ~250 formatting errors on untouched lines); and remove the unused `AI` binding / `PARSE_PROVIDER` from `src/lib/server/env.ts`.

---

## 5. Auth and access model (do not weaken)

- **Admin:** PBKDF2-SHA256 password → HMAC-signed `admin_session` cookie (8 h). Single check: `isAdminRequest()` in `src/lib/server/viewer.ts`. Every admin server function calls `requireAdmin()` first.
- **Candidates:** Supabase Auth; `sb-access-token` / `sb-refresh-token` httpOnly cookies re-validated per request by `getCandidateSession()`.
- **Candidate data:** `getViewer()` + `canAccessCandidate()` — admin sees all, a signed-in candidate only rows whose `candidates.auth_user_id` is theirs, anyone else gets `[]` / `null` / 404. This applies to server functions and the `/api/cv/:id` route alike. Any new endpoint touching candidates must use it.
- Route guards (`beforeLoad`) only protect navigation; they are never the security boundary.

---

## 6. Data model (D1)

`candidates` (+ `candidate_skills`, `candidate_experience`, `candidate_education`, `candidate_swipes`) · `jobs` (`source`/`source_id` for Reed dedup, `expiry_date`) · `matches` (score fields owned by the matcher; `stage` owned by consultants — re-scoring never resets it) · `faq_topics` · `hr_queries` · `bookings` · `enquiries`.

Supabase holds `profiles` (mirror: `d1_candidate_id`), plus Postgres copies of `bookings`/`hr_queries` with RLS for a future direct-client path. D1 is the source of truth; `candidates.raw_profile` keeps the full Claude extraction for re-matching.

---

## 7. Backlog — recommended order, with implementation notes

1. **Scheduled Reed sync + expiry.** Add a Workers cron trigger in `wrangler.toml` (`[triggers] crons = ["0 2 * * *"]`) and a `scheduled` handler that calls the sync logic now inside `syncReedJobsFn` (extract it into `src/lib/server/reed.ts`, keep the server function as a thin wrapper), then closes jobs whose `expiry_date` has passed. Nitro's cloudflare preset supports a scheduled export — check its docs for the entry hook.
2. **Analytics charts.** Recharts is installed and unused. `adminGetAnalyticsFn` returns totals only; add time-bucketed queries (uploads per week, score histogram, funnel by stage using `matches.stage`) and render area/bar charts on `/admin/analytics` using the design tokens (`var(--color-accent)` etc.).
3. **GDPR tooling.** "Delete everything about this candidate" across D1 (`deleteCandidate` already cascades tables), R2 (`CV_BUCKET.delete(source_r2_key)`) and Supabase (`profiles`); a JSON export endpoint; a retention policy (e.g. purge unlinked CVs after N months via the same cron).
4. **Named admin users + audit trail.** Move admin auth onto Supabase with an `admin` role claim; keep `requireAdmin()` as the single check but resolve it from the Supabase session. Add an `audit_log` table (actor, action, entity, before/after JSON, at) written from every mutating admin function.
5. **Candidate password reset.** `/auth/forgot` sends a magic link only; add `resetPasswordForEmail` + a `/auth/reset` route that calls `updateUser({ password })` after the callback establishes the session.
6. **Notes and activity log** on candidate and mandate pages (`candidate_notes` table; timeline from `created_at`, `stage_updated_at`, notes, emails).
7. **Saved jobs / applications.** `candidate_swipes.action = 'interested'` is recorded but nothing follows; surface interested candidates on the mandate pipeline as a "Applied" signal and notify the consultant.
8. **Email outreach from the platform.** Resend is wired for notifications; add templated candidate emails (intro, interview invite, rejection) logged against the candidate.
9. **Global search** across candidates, mandates and FAQ topics — `candidate_skills.skill` is already normalised, so skill search is a simple join.
10. **CSV export** of candidate lists and mandate shortlists.
11. **Job alerts** (nightly email of new matches above a threshold) — depends on item 2.
12. **Dark palette** — `@custom-variant dark` exists in `styles.css` but no dark tokens are defined.
13. **Calendly embed** on the HR answer page (`CALENDLY_URL` var is plumbed; the widget is not).

---

## 8. Gotchas that have already cost time (all documented in CLAUDE.md)

- `createServerFn().inputValidator()` — the older `.validator()` throws at module load and takes every page down.
- Client code must never import from `src/lib/server/**` (import-protection). Server functions live in `src/lib/functions.ts`; server-only helpers used by both server functions and server routes live in `src/lib/server/viewer.ts`.
- `wrangler.toml` is the only Wrangler config. Wrangler silently prefers a `wrangler.json`/`.jsonc` if one exists — one did, and it overrode every binding.
- `[vars]` are not inherited by named environments; repeat them under `[env.staging.vars]` and `[env.production.vars]`.
- `src/routeTree.gen.ts` is generated; a stale copy silently drops routes from the type map. Commit it after adding routes.
- Migrations are append-only and must be correct against the schema the previous files actually produce.
- Playwright: interact only after `<html data-hydrated="true">` (the shared fixture handles it). Scope admin sidebar clicks to `getByRole("navigation")` — overview cards are links with overlapping names.
- `getEnv()` throws outside the Workers runtime; return honest empty states, never fabricated data.

---

## 9. Working agreement

- Feature branches → PR to `main` → CI green → merge. Keep `npx tsc --noEmit` at 0 and `npm run build` passing before every push.
- Follow the design system (tokens, Fraunces/Geist, `Reveal`, `AppLayout` primitives); no ad-hoc colours.
- Update `CLAUDE.md` when a rule changes, `DEPLOYMENT.md` when infrastructure changes, and add a row to §2 of this note when you ship something.
- Never commit secrets. `.dev.vars` is gitignored for local Wrangler runs.


## 10. Launch-readiness work — 17 September 2026

The first Lovable pass exhausted available credits and left an undefined `DEV_JWT_SECRET` reference plus a package/lock mismatch. The GitHub repair restores the locked dependencies and completes the integration of fail-closed admin auth, authenticated and D1-rate-limited CV/AI actions, candidate refresh-cookie renewal, notification delivery state/retry controls, explicit CV grading failures, corrected Reed counts and protected-read outage states.

New regression tests cover credentials, malformed tokens, candidate ownership, refresh-only sessions, invalid refreshed sessions, durable limits, migration replay, grading failures, real zero scores, email failures/concurrent retries and Reed counters. Local results: 14 tests passed, TypeScript passed, Workers build passed. Browser installation was blocked by upstream download failures; browser verification must be completed in CI and configured staging. Supabase hardening SQL is prepared but has not been applied to a live project.

Remaining launch gates: passing final PR CI; provision dedicated UKTL staging Supabase and Cloudflare D1/R2; apply migrations; supply API keys and secrets securely; verify sender domain; run database-backed staging acceptance; review production domain/configuration; deploy only after those gates pass. Rate-limit cleanup scheduling and automatic notification retries remain future operational work. No environment has been deployed by this change.


## 11. Site structure and sign-in fixes — 23 September 2026

UKTL is one firm, so there is no client/employer portal (removed from the backlog). Two user types: candidates and firm staff.

- One header (`Nav`) on the public site, the candidate area and the sign-in pages. It shows *Sign in / Upload your CV* when signed out, *My account / Sign out* for candidates and *Admin* for staff. Previously the candidate area had its own header that looked signed-in to everyone.
- `/app` now requires sign-in and returns the visitor to the page they wanted afterwards. The candidate menu is Dashboard · My CV · Job matches · All jobs · My interests · HR & Law · Profile; staff tools are no longer in it.
- New candidate dashboard (CV score, strongest matches). Candidates see "Your CV" without the consultant buttons (anonymise, re-match, pipeline stages). Job matches use the candidate's own CV automatically.
- Upload page: removed the duplicate sign-in link; copy rewritten for candidates.
- Footer links fixed (service anchors, `/reach` linked, candidate column), and the landing page buttons go to sign-up.
- Ported onto devacnt/UKTL (the source of truth) on 23 September; JSHrs/uktl- `main` mirrors devacnt.
- Public pages rewritten for candidates first (free CV score, tips, matched roles, workplace guidance). UKTL is a staffing firm for candidates only, so there is no employer-facing copy, "I'm hiring" route or employer services section; construction, engineering and technology lead because that is where the platform's live roles come from. Unverified stats (e.g. "14+ years", "100% retained") were removed from `/reach`. Company facts (addresses, phone, sector notes) are unchanged and still need the owner's confirmation.
- Light and dark mode follow the device setting (`prefers-color-scheme`): dark tokens in `styles.css`, `.band` keeps the landing feature bands dark in both themes, `.hero-mark` handles the hero illustration, and Tailwind `dark:` now means "system dark".

## 12. Operations, privacy and dependency hardening — 23 September 2026

New administrator operations dashboard and protected health endpoint; request-scoped transactional audit attribution; AI usage and global hourly request budget; private scanner integration that fails closed; retryable CV-file erasure; candidate self-service data copy and reviewed privacy request queue; corrected same-origin redirect and sign-out revocation; mobile admin shell; working privacy/usage information links. Dependency updates remove the recorded advisories and required adapting the router error type. Supabase migration and actual PostgreSQL regressions accompany the changes. Live scanner/provider acceptance, complete reviewed notices, live full-scope erasure/provider acceptance, approved retention/orphan cleanup and operational exercises remain required. Cloudflare is deliberately last.

Follow-up: dependency-free private ClamAV gateway with bounded authenticated scanning; reviewed account-erasure workflow with tombstone write protection, retryable private-file cleanup and Auth deletion last. Synthetic protocol tests and real PostgreSQL integration cover failure/retry and ownership behavior; real engine/provider deployment remains open.
