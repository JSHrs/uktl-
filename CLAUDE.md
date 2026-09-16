# Talent Compass — development guidelines

Read this before changing anything. It is written for whoever picks the codebase up next, human or agent.

## What this is

UK Talent Link's public website plus **Talent Compass**, a recruitment platform: CV upload → Claude extraction → quality grading → matching against open mandates, with a candidate portal (Supabase Auth), an HR & employment-law knowledge module, consultation bookings, and an admin dashboard.

**Stack:** TanStack Start (React 19, file-based routing, server functions) · Tailwind v4 · Cloudflare Workers + D1 (SQLite) + R2 · Supabase Auth · Anthropic API · Resend · Reed.co.uk API. Built through `@lovable.dev/vite-tanstack-config`.

## Commands

| Command | Notes |
|---|---|
| `npm ci` | Node 20+. |
| `npm run dev` | Vite dev server on `:5173`. No Cloudflare bindings, so data functions return empty states and CV parsing throws a clear error. Admin login works with the demo password (see Auth). |
| `npx tsc --noEmit` | **Must report 0 errors.** It was at 87 for a long time and hid a total runtime failure (`.validator` → `.inputValidator`). Treat any new error as a blocker. |
| `npm run build` | Workers bundle via Nitro (`dist/server` + `dist/client`). Must pass. `wrangler.toml` already points at it — see DEPLOYMENT.md §3. |
| `npm run lint` | ESLint with `prettier/prettier` as an error. The repo has never been prettier-formatted, so this fails on ~250 formatting lines. Use `npx eslint --rule 'prettier/prettier: off' <files>` for real findings until the repo is formatted in one dedicated commit. |
| `npm run test:e2e` | Playwright, specs in `e2e/`. Starts the dev server itself (or set `E2E_BASE_URL` to test a deployment). In the hosted sandbox add `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Tests that write to D1 are skipped unless `E2E_HAS_DB=1`. Specs import `test` from `./fixtures`, whose `goto` waits for `<html data-hydrated>` — never interact before that. |
| CI | `.github/workflows/ci.yml` runs `tsc`, `build` and the e2e suite on every PR and push to `main`. |

## Where things live

```
src/routes/            file-based routes (routeTree.gen.ts is GENERATED — regenerate via dev/build and commit it)
  index.tsx, approach, services, sectors, contact   public site
  app/                 Talent Compass (overview, upload, candidates, jobs, discover, hr, profile)
  auth/                candidate login / register / forgot / callback
  admin/               admin dashboard (guarded by beforeLoad in admin.tsx)
  api/                 server routes (createFileRoute + server.handlers), e.g. api/cv/$id streams a CV from R2
src/lib/functions.ts   ALL server functions (createServerFn). Deliberately NOT under server/ — see rule 1.
src/lib/server/        server-only code: env (bindings), db (D1), auth (admin PBKDF2 + HMAC cookie),
                       viewer (isAdminRequest / requireAdmin / getViewer / canAccessCandidate),
                       parse (Claude extraction + grading), match, skills, anonymize, docx
src/lib/stages.ts      pipeline stage labels/tones (client-safe)
src/lib/supabase.ts    candidate session cookies + Supabase clients (server-side only)
src/lib/schemas/       zod schemas (profile, job)
src/components/site/   Nav, Footer, Layout, Reveal (public site)
src/components/app/    AppLayout primitives (app shell, stat cards, pills, empty states)
src/styles.css         design tokens (OKLCH paper/ink/accent), fonts, animations
migrations/            D1 migrations 0001–0008, applied in order by wrangler
supabase/migrations/   Postgres schema for profiles/bookings/hr_queries (RLS) — Supabase project only
e2e/                   Playwright specs
wrangler.toml          the ONLY Wrangler config (never add wrangler.json/jsonc — Wrangler prefers it silently);
                       bindings, vars per environment (vars are NOT inherited by named envs)
.github/workflows/     CI
```

## Hard rules

1. **Server functions live in `src/lib/functions.ts`, never under `src/lib/server/`.** The Lovable wrapper enables TanStack import-protection with `client.files: ["**/server/**"]`; a route importing anything under `server/` fails the client build. Server-only modules stay under `server/` and are only imported from `functions.ts` (top-level imports are dead-code-eliminated from the client bundle).
2. **Use `.inputValidator()`**, not `.validator()`. The old name is a runtime `TypeError` that breaks every page.
3. **Every privileged handler authenticates itself.** Route guards only protect navigation. Admin handlers call `await requireAdmin()` first. Candidate-data handlers use `getViewer()` + `canAccessCandidate()` (both in `src/lib/server/viewer.ts`, usable from server functions and server routes alike): admin sees everything, a signed-in candidate sees only rows whose `auth_user_id` is theirs, anonymous callers get `[]`/`null`/404. Keep it that way for anything new that reads or writes candidate data.
4. **`getEnv()` throws outside the Workers runtime.** Wrap it and return an honest empty state (`[]`, `null`, a thrown "not configured" error). Never return fabricated records — the old `mockData.ts` fallback was removed for that reason.
5. **Migrations are append-only.** Add `migrations/000N_name.sql`; never edit an applied file. A migration must be correct against the schema the previous files actually produce (0005 once redefined a table 0003 had already created and aborted). Prove new migrations by replaying 0001→N on SQLite (`node:sqlite` works in Node 22).
6. **`routeTree.gen.ts` is generated.** After adding or renaming a route, run dev or build and commit the regenerated file; a stale one silently drops routes from the type map.
7. **No secrets in the repo.** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `SUPABASE_SERVICE_ROLE_KEY`, `REED_API_KEY` are `wrangler secret put`. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL`, `CALENDLY_URL` are `[vars]` and must be repeated under `[env.staging.vars]` / `[env.production.vars]`.
8. **Design system, not ad-hoc styling.** Colours come from the tokens in `styles.css` (`paper`, `paper-deep`, `ink`, `ink-soft`, `ink-mute`, `rule`, `accent`, `accent-soft`, `accent-light`). Display type is Fraunces via `font-display` with `fontVariationSettings`, body is Geist, labels are Geist Mono uppercase tracked. Public-site sections use `<Reveal>` for entrance; the app shell uses the primitives in `AppLayout.tsx`. Respect `prefers-reduced-motion` (there is a global rule; new keyframes need a static end-state there).
9. **Keep `tsc` at zero and `npm run build` green before pushing.** Run both. Do not push speculative fixes.

## Auth model

- **Admin:** password checked against `ADMIN_PASSWORD_HASH` (PBKDF2-SHA256, salt `uktl-admin-salt-v1`, 100k iterations, `scripts/hash-password.mjs`). Session is an HMAC-signed `admin_session` httpOnly cookie (`JWT_SECRET`, 8h). `isAdminRequest()` in `functions.ts` is the single check.
- **Demo password `admin123`** is accepted only while `ADMIN_PASSWORD_HASH` is unset (`src/lib/server/auth.ts` `verifyPassword`), and the login page prints it (`src/routes/admin/login.tsx`). Kept deliberately for now so the dashboard can be exercised without secrets.
  **TODO before production:** delete the fallback branch in `verifyPassword`, delete the hint paragraph on the login page, and make `ADMIN_PASSWORD_HASH` mandatory.
- **Candidates:** Supabase Auth. `functions.ts` signs in server-side and stores `sb-access-token` / `sb-refresh-token` httpOnly cookies; `getCandidateSession()` re-validates them per request. Email links (magic link, sign-up confirmation) redirect to `/auth/callback`, which posts the URL-fragment tokens to `candidateSessionFromTokensFn`. `SITE_URL` must be set and allow-listed in Supabase Auth → Redirect URLs.

## Data model (D1)

`candidates` (+ `candidate_skills`, `candidate_experience`, `candidate_education`, `candidate_swipes`) · `jobs` (with `source`/`source_id` for Reed dedup) · `matches` (score fields owned by the matcher; `stage` owned by consultants and never reset by re-scoring) · `faq_topics` · `hr_queries` · `bookings` · `enquiries`.
`candidates.auth_user_id` is the authoritative link to a Supabase user; `profiles.d1_candidate_id` in Supabase is a best-effort mirror. CV bytes live in R2 at `cvs/<candidate_id>/<filename>`; the full Claude extraction is kept in `candidates.raw_profile` for re-matching.

## Verification checklist (before every push)

- `npx tsc --noEmit` → 0
- `npm run build` → exit 0
- `npm run dev`, then confirm `/`, `/app`, `/auth/login`, `/admin/login` return 200 and `/app/candidates` redirects when signed out
- New server function? It has an `inputValidator`, an auth check if it touches anything private, and a try/catch around `getEnv()` if it is called from a public loader
- New route? `routeTree.gen.ts` regenerated and committed
- New migration? Replayed from 0001 on a scratch DB

## Known gaps (not bugs — unbuilt)

Charts on the analytics page (Recharts installed, unused) · Calendly embed on the HR answer page · scheduled Reed sync (manual button only) · candidate email outreach · CSV export · dark palette (`@custom-variant dark` exists, no tokens) · client portal · GDPR delete/export tooling · named admin users with audit trail.
