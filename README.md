# UK Talent Link · Talent Compass

Public website for UK Talent Link (executive search, HR consultancy, UK employment law, GCC recruitment) and **Talent Compass**, the firm's recruitment intelligence platform.

## What the platform does

- **CV intake** — upload PDF, DOCX or TXT; the file is stored privately in R2, Claude extracts a structured profile, skills are normalised to a canonical taxonomy, the CV is graded 0–100 with a per-section breakdown and improvement report, and the candidate is scored against every open mandate.
- **Mandates** — managed in the admin dashboard or synced from Reed.co.uk; re-matching runs when mandates change.
- **Discover** — candidates swipe through matched vacancies ranked by fit.
- **Candidate portal** — Supabase-backed accounts, profile editing, magic-link sign-in, CV linked to the account.
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

Admin dashboard in development: `/admin/login`, password `admin123` (only accepted while `ADMIN_PASSWORD_HASH` is unset — remove before production, see CLAUDE.md).

For a full local stack with D1 and R2, run under Wrangler and put secrets in `.dev.vars` (gitignored). See `DEPLOYMENT.md`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (`dist/`) |
| `npm run lint` | ESLint (+ prettier rule — currently failing repo-wide on formatting) |
| `npm run test:e2e` | Playwright suite in `e2e/` against `E2E_BASE_URL` |
| `node scripts/hash-password.mjs` | Generate an `ADMIN_PASSWORD_HASH` |

## Project layout

See **CLAUDE.md** — it is the development guide (architecture map, hard rules, auth model, verification checklist) and applies to everyone working on the repo, not only AI agents.

## Deployment

See **DEPLOYMENT.md** (Cloudflare infrastructure, migrations, secrets, Supabase setup, rollback).

## Status

Merged to `main` and building cleanly as of September 2026. Open items are listed under "Known gaps" in CLAUDE.md.
