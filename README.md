# UK Talent Link · Talent Compass

Public website for UK Talent Link (executive search, HR consultancy, UK employment law, GCC recruitment) and **Talent Compass**, the firm's recruitment intelligence platform.

## What the platform does

- **CV intake** — upload PDF, DOCX or TXT; the file is stored privately in R2, Claude extracts a structured profile, skills are normalised to a canonical taxonomy, the CV is graded 0–100 with a per-section breakdown and improvement report, and the candidate is scored against every open mandate.
- **Mandates** — managed in the admin dashboard or synced from Reed.co.uk; re-matching runs when mandates change.
- **Discover** — candidates swipe through matched vacancies ranked by fit.
- **Candidate portal** — Supabase-backed accounts, profile editing, password recovery, CV linked to the account.
- **HR & employment law** — searchable FAQ topics (video-backed), Claude escalation grounded in ACAS guidance, consultation bookings with email notification.
- **Admin** — FAQ topics, mandates, candidates, bookings log, analytics funnel.
- **Contact** — enquiries are persisted and emailed to the team.

## Stack

TanStack Start (React 19) · Tailwind v4 · Cloudflare Workers, D1, R2 · Supabase Auth · Anthropic API · Resend · Reed.co.uk API · Playwright.

## Getting started

```bash
npm ci
npm run dev            # http://127.0.0.1:5173 — no Cloudflare bindings: empty data, parsing disabled
npx tsc --noEmit       # must be 0 errors
npm run build          # must pass
```

Admin dashboard: `/admin/login`. Use a verified named Supabase staff account and authenticator (MFA). See **STAGE_1_UAT.md** for setup; shared-password cookies are no longer accepted.

For a full local stack with D1 and R2, run under Wrangler and put secrets in `.dev.vars` (gitignored). See `DEPLOYMENT.md`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (`dist/`) |
| `npm run lint` | ESLint (+ prettier rule — currently failing repo-wide on formatting) |
| `npm run test:e2e` | Playwright suite in `e2e/` against `E2E_BASE_URL` |
| `node scripts/prepare-staging.mjs` | Validate and prepare isolated Supabase staging deployment |

## Project layout

See **CLAUDE.md** — it is the development guide (architecture map, hard rules, auth model, verification checklist) and applies to everyone working on the repo, not only AI agents.

## Deployment

See **DEPLOYMENT.md** (Cloudflare infrastructure, migrations, secrets, Supabase setup, rollback).

## Status

Recovered into `devacnt/UKTL` on 18 September 2026. See **PROGRESS_REPORT.md** for verified deliverables and missing local-only work, and **SUPABASE_INSTALLATION.md** for the recovered migration history and runtime configuration. The application has not been deployed or verified as 75% complete. Production now selects the Supabase adapter; default and staging configuration still require explicit setup.
