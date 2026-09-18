# Historical deployment instructions — superseded

Do not use this for the current Supabase release. Some migration names and shared-password instructions below are obsolete. See DEPLOYMENT.md and STAGE_1_UAT.md. Retained for the legacy D1/R2 backend only.

# Talent Compass — Deployment Runbook

**Project:** UK Talent Link / Talent Compass
**Stack:** TanStack Start · Cloudflare Workers · D1 (SQLite) · R2 · Supabase Auth · Anthropic API · Resend · Reed.co.uk
**Target:** `talent-compass.cranbrooklegal.com`

---

## Pre-requisites

| Tool | Install |
|------|---------|
| Node 24+ | `nvm install 24` |
| Wrangler CLI | `npm install -g wrangler` |
| Cloudflare account | `wrangler login` |
| Supabase project | https://supabase.com (one per environment is recommended) |

---

## 1 — One-time infrastructure setup

### 1.1 Create D1 databases

```bash
wrangler d1 create talent-compass-db            # production
wrangler d1 create talent-compass-staging-db    # staging
```

Paste the returned `database_id` values into `wrangler.toml` (`[[d1_databases]]`, `[[env.staging.d1_databases]]`, `[[env.production.d1_databases]]`).

### 1.2 Run database migrations

```bash
wrangler d1 migrations apply talent-compass-staging-db --env staging
wrangler d1 migrations apply talent-compass-db --env production
```

Migrations live in `./migrations/`, numbered `0001_` → `0009_`, and are applied in order:

| File | Adds |
|---|---|
| 0001_init | candidates, skills, experience, education, jobs, matches |
| 0002_seed_jobs | sample mandates |
| 0003_hr_module | faq_topics, hr_queries |
| 0004_swipes | candidate_swipes |
| 0005_score_breakdown | score_breakdown / improvement_report / auth_user_id on candidates; bookings; rebuilds hr_queries |
| 0006_jobs_source | source / source_id / source_url / posted_date / expiry_date on jobs (Reed dedup) |
| 0007_enquiries | enquiries (contact form) |
| 0008_match_stages | stage / stage_updated_at on matches (pipeline) |
| 0009_rate_limits_and_notifications | durable rate-limit counters; notification delivery state |

Never edit an applied migration; add a new numbered file.

### 1.3 Create R2 buckets

```bash
wrangler r2 bucket create talent-compass-cvs          # production
wrangler r2 bucket create talent-compass-cvs-staging  # staging
```

CV files are written and read server-side only; no CORS policy is required.

### 1.4 Supabase (candidate auth)

1. Create the project and apply `supabase/migrations/20260915000001_initial.sql` (SQL editor or `supabase db push`). It creates `profiles`, `bookings`, `hr_queries` with RLS and the `handle_new_user` trigger.
2. Authentication → URL configuration: set **Site URL** to the deployment origin and add `<SITE_URL>/auth/callback` to **Redirect URLs** for every environment.
3. Authentication → Email: keep "Confirm email" on; sign-up confirmations and magic links both land on `/auth/callback`.
4. Copy the project URL and anon key into `wrangler.toml` vars (below) and the service-role key into a secret.

---

## 2 — Configuration

### 2.1 Vars (non-secret, in `wrangler.toml`)

Wrangler does **not** inherit `[vars]` into named environments — each of `[vars]`, `[env.staging.vars]` and `[env.production.vars]` must be filled in.

| Var | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SITE_URL` | Public origin of this deployment; used to build auth email redirect URLs |
| `CALENDLY_URL` | Calendly embed URL for consultation booking (optional) |
| `PARSE_MODEL` | Override the Anthropic model used for CV extraction (optional) |

### 2.2 Secrets (`wrangler secret put <NAME> --env <staging|production>`)

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude — CV extraction, grading, HR escalation |
| `RESEND_API_KEY` | Booking and enquiry notification emails to info@ |
| `JWT_SECRET` | HMAC key for the admin session cookie |
| `ADMIN_PASSWORD_HASH` | PBKDF2-SHA256 hash of the admin password |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase client (bypasses RLS) |
| `REED_API_KEY` | Reed.co.uk job search API |

Locally, put secrets in `.dev.vars` (gitignored) for `wrangler dev`.

### 2.3 Admin password hash

```bash
node scripts/hash-password.mjs
```

Paste the hex output into `wrangler secret put ADMIN_PASSWORD_HASH`.

> Both admin secrets are mandatory in every environment. There is no demo password or signing-key fallback; missing secrets disable login. Apply migration 0009 before serving traffic.

---

## 3 — Build and deploy

### 3.1 Build

```bash
npm ci
npx tsc --noEmit     # must be 0
npm run build
```

`npm run build` always produces the Workers bundle: `vite.config.ts` enables Nitro's `cloudflare-module` preset (the `nitro` devDependency), emitting a prebuilt ES-module Worker in `dist/server/` and static assets in `dist/client/`. `wrangler.toml` points at both (`main = "dist/server/index.mjs"`, `no_bundle = true` with ES-module rules, `[assets] directory = "dist/client"`).

Nitro's own `deployConfig` generation is switched off on purpose: Wrangler refuses tool-generated configs that contain named environments, and staging/production live in `wrangler.toml`. Do not add a `wrangler.json`/`wrangler.jsonc` next to the toml — Wrangler would silently prefer it.

Verify without deploying:

```bash
npx wrangler deploy --dry-run --outdir /tmp/wr --env production
```

The dry-run should list `env.DB (talent-compass-db)`, `env.CV_BUCKET`, `env.ASSETS` and the four vars.

### 3.2 Deploy

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

The production route `talent-compass.cranbrooklegal.com/*` is set in `wrangler.toml`; the DNS record for that hostname must be Cloudflare-proxied.

---

## 4 — Post-deploy verification

```bash
E2E_BASE_URL=https://<staging-host> E2E_HAS_DB=1 npm run test:e2e
# Supply E2E_ADMIN_PASSWORD through your environment/secret store; never commit it.
```

Manual checklist:

- [ ] `/` renders; `/approach`, `/services`, `/sectors`, `/contact` render
- [ ] Contact form: submit → row in `enquiries` and email at info@
- [ ] `/admin/login` accepts the production password and **rejects** `admin123`
- [ ] Admin → Mandates: create and delete a test mandate; "Sync from Reed" inserts and dedups
- [ ] `/auth/register` → confirmation email → `/auth/callback` signs in → `/app/profile`
- [ ] `/auth/forgot` magic link signs in
- [ ] Upload a CV while signed in → candidate detail shows score breakdown and matches; `/app/profile` shows the CV
- [ ] Signed out, `/app/candidates` redirects to `/auth/login`; a second candidate cannot open the first candidate's record
- [ ] `curl -I .../admin | grep -i robots` → `noindex, nofollow`

---

## 5 — Rollback

```bash
wrangler deployments list --env production
wrangler rollback <deployment-id> --env production
```

D1 schema changes are not rolled back by a Worker rollback; write a forward migration instead.

---

## 6 — Observability

- **Logs:** `wrangler tail --env production`
- **Errors:** Cloudflare dashboard → Workers & Pages → Worker → Logs
- **D1 / R2:** Cloudflare dashboard → D1 / R2
- **Auth:** Supabase dashboard → Authentication → Logs

---

## 7 — Handover notes

- All CV bytes live in R2 at `cvs/<candidate_id>/<filename>`; never publicly accessible.
- `candidates.raw_profile` keeps the full Claude extraction for re-matching (`rematchCandidateFn`).
- `candidates.auth_user_id` links a CV to a Supabase user; `profiles.d1_candidate_id` is a mirror.
- `enquiries` and `bookings` are persisted even when Resend is not configured; the email is a notification, not the record.
- CI runs regression tests, typecheck, build and browser checks. Run configured, database-backed staging tests separately before release.


## Launch hardening requirements (17 September 2026)

Apply the new Supabase migration `20260917085347_harden_auth_schema.sql` after the initial schema. It restricts analytics access, pins the signup trigger search path and restricts direct profile-update columns. This migration has not yet been applied or tested against a live UKTL project.

Notifications show delivery state in the admin bookings and enquiries views. Retry is concurrency-guarded and uses a stable Resend idempotency key. After 23h, or if a process stops while status is `sending`, reconcile with provider logs before manually resending. No automated delivery worker is implemented yet.

CV/AI actions now require authentication and enforce D1 quotas. CV processing without an API key or a valid complete grading response fails explicitly; it no longer synthesizes a score. Signed-out users may browse the public FAQ catalogue but must sign in for AI guidance.

Staging acceptance must verify expired-session refresh, anonymous/cross-account CV rejection, repeated-request rate limits, real PDF/DOCX processing, notification failures and retries, Reed duplicate handling, and database outages. Browser skips are not evidence that these integrations work.
