# Talent Compass — Deployment Runbook

**Project:** UK Talent Link / Talent Compass  
**Stack:** TanStack Start · Cloudflare Workers · D1 (SQLite) · R2 (object storage) · Anthropic API  
**Target:** `talent-compass.cranbrooklegal.com`

---

## Pre-requisites

| Tool | Install |
|------|---------|
| Node 20+ | `nvm install 20` |
| Wrangler CLI | `npm install -g wrangler` |
| Cloudflare account | `wrangler login` |

---

## 1 — One-time infrastructure setup

### 1.1 Create D1 databases

```bash
# Production
wrangler d1 create talent-compass-db
# Staging
wrangler d1 create talent-compass-staging-db
```

Copy the `database_id` values returned and paste them into `wrangler.toml`:

```toml
[[d1_databases]]
database_id = "<paste production id here>"

[[env.staging.d1_databases]]
database_id = "<paste staging id here>"
```

### 1.2 Run database migrations

```bash
# Staging
wrangler d1 migrations apply talent-compass-staging-db --env staging

# Production
wrangler d1 migrations apply talent-compass-db --env production
```

Migrations live in `./migrations/` and are numbered `0001_` → `0004_` in order.

### 1.3 Create R2 buckets

```bash
wrangler r2 bucket create talent-compass-cvs          # production
wrangler r2 bucket create talent-compass-cvs-staging  # staging
```

### 1.4 Configure CORS on R2 buckets

CV files are written server-side only, so no explicit CORS policy is required.  
If a signed-URL client-side flow is added later, apply CORS via the Cloudflare dashboard or:

```bash
wrangler r2 bucket cors put talent-compass-cvs --rules-json '[{"allowedOrigins":["https://talent-compass.cranbrooklegal.com"],"allowedMethods":["GET","PUT"],"maxAgeSeconds":3600}]'
```

---

## 2 — Secrets management

All secrets are injected as Cloudflare Worker secrets — never stored in source code or wrangler.toml.

```bash
# Anthropic API key (used for CV parsing and FAQ AI)
wrangler secret put ANTHROPIC_API_KEY --env production
wrangler secret put ANTHROPIC_API_KEY --env staging

# Resend API key (transactional email — future feature)
wrangler secret put RESEND_API_KEY --env production
wrangler secret put RESEND_API_KEY --env staging

# Admin session signing key (generate a strong random string)
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_SECRET --env staging

# Admin password hash (PBKDF2-SHA256, generated below)
wrangler secret put ADMIN_PASSWORD_HASH --env production
wrangler secret put ADMIN_PASSWORD_HASH --env staging
```

### Generating an admin password hash

Run this in the browser console or Node to produce the hash:

```javascript
// Node script: node scripts/hash-password.mjs
import { subtle } from "node:crypto";

const password  = "YOUR_PRODUCTION_PASSWORD";
const salt      = new TextEncoder().encode("uktl-admin-salt-v1");
const keyMat    = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits      = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, keyMat, 256);
const hex       = Buffer.from(bits).toString("hex");
console.log(hex);
```

Paste the hex output when `wrangler secret put ADMIN_PASSWORD_HASH` prompts for the value.

---

## 3 — Build and deploy

### 3.1 Install dependencies

```bash
npm ci
```

### 3.2 Build for production

```bash
npm run build
```

Output: `.output/server/index.mjs` (Worker entry) + `.output/public/` (static assets).

### 3.3 Deploy to staging

```bash
wrangler deploy --env staging
```

Verify at the staging Worker URL shown in the deploy output.

### 3.4 Promote to production

```bash
wrangler deploy --env production
```

The production route `talent-compass.cranbrooklegal.com/*` is configured in `wrangler.toml`. Ensure the DNS CNAME for that hostname points to `talent-compass-production.cranbrooklegal.com.cdn.cloudflare.net` (Cloudflare proxied).

---

## 4 — Post-deploy verification

Run the E2E suite against the live URL:

```bash
E2E_BASE_URL=https://talent-compass.cranbrooklegal.com npm run test:e2e
```

Manual checklist:

- [ ] `/admin/login` loads and accepts the production admin password
- [ ] Admin → Mandates: create and delete a test mandate
- [ ] Upload page: drag a CV; confirm it navigates to the parsed candidate profile
- [ ] Candidate profile shows quality score, skills, and job matches
- [ ] `curl -I https://talent-compass.cranbrooklegal.com/admin | grep -i robots` returns `noindex, nofollow`

---

## 5 — Rollback

```bash
# List recent deployments
wrangler deployments list --env production

# Roll back to a previous deployment
wrangler rollback <deployment-id> --env production
```

D1 schema changes are irreversible without a manual migration. Keep migration SQL idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) so re-running is safe.

---

## 6 — Observability

- **Logs:** `wrangler tail --env production` streams real-time Worker logs
- **Errors:** Cloudflare dashboard → Workers & Pages → your Worker → Logs
- **D1 metrics:** Cloudflare dashboard → D1 → talent-compass-db → Metrics tab
- **R2 storage:** Cloudflare dashboard → R2 → talent-compass-cvs

---

## 7 — Environment variable reference

| Variable | Where set | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `wrangler secret put` | Claude API key for CV parsing |
| `RESEND_API_KEY` | `wrangler secret put` | Transactional email (future) |
| `JWT_SECRET` | `wrangler secret put` | HMAC key for admin session tokens |
| `ADMIN_PASSWORD_HASH` | `wrangler secret put` | PBKDF2-SHA256 hash of admin password |
| `PARSE_MODEL` | `wrangler.toml` vars (optional) | Override Anthropic model used for parsing |
| `DB` | D1 binding in `wrangler.toml` | Cloudflare D1 database |
| `CV_BUCKET` | R2 binding in `wrangler.toml` | Cloudflare R2 bucket for CV files |

---

## 8 — Handover notes

- The demo password `admin123` is accepted only when `ADMIN_PASSWORD_HASH` is **not** set. In production it must be set to a proper hash.
- All CV file bytes are stored in R2 under the key `cvs/<candidate_id>/<filename>`. Files are never publicly accessible.
- The `raw_profile` JSON column in D1's `candidates` table stores the full Anthropic extraction output; it is used for re-matching when a new mandate is added.
- Matching scores are stored in the `matches` table and can be recalculated by calling `rematchCandidateFn` from the server.
- The `candidate_swipes` table (migration 0004) tracks candidate interest in mandates — used for the discovery "stack" UX.
