# UKTL Supabase installation and recovery

Target: `fvkffdeindboirukscfq` (UKTL). Updated 18 September 2026 after explicit owner authorization to synchronize databases. All eight canonical migrations are applied to this verified target.

## Recovered migration history

The canonical `supabase/migrations` directory now contains the exact stored SQL statements retrieved from the target project's migration history:

1. `20260918000156_uktl_initial_and_auth_hardening`
2. `20260918000314_uktl_least_privilege_client_access`
3. `20260918001950_uktl_recruitment_and_workflows`
4. `20260918003021_uktl_explicit_backend_policies_and_constraints`
5. `20260918112245_named_staff_access_and_mfa`
6. `20260918145535_durable_cv_processing_and_revisions`
7. `20260918151920_reed_vacancy_metadata`
8. `20260918163142_resumable_reed_sync`

The first remote migration combines the two original baseline migrations. Their original files are preserved unchanged under `supabase/legacy-migrations`, outside the CLI migration directory. Do not replay those legacy files or mark the eight existing remote migrations as unapplied. No remote migration-history repair was performed.

Before a future `db push`, explicitly link the correct project, inspect migration list, and inspect a dry run using the installed CLI's documented flags. The existing eight migrations should be shown as already applied. Stop if they would be replayed. A full fresh replay is now a required GitHub CI job. Check its result for the current commit before pushing to another environment.

Live metadata checks confirmed 29 recruitment tables, all 29 with RLS enabled, and private bucket `uktl-cvs`, limited to 10 MiB and PDF/DOCX/TXT. These are metadata checks, not complete security certification.

## Runtime

Production Wrangler vars select `DATA_BACKEND = "supabase"` and the target project URL. Default/staging remain explicitly separate legacy configurations until isolated staging is provisioned. The removed unconfirmed production hostname must not be restored without verifying the intended domain.

Set these in the hosting platform's secret/configuration interface, never source control:

- `DATABASE_URL`: Supabase transaction-pooler PostgreSQL URI, with an account allowed to access the private recruitment schema. Prepared statements are disabled. TLS certificate verification is mandatory. Obtain credentials from the project's Connect panel; do not paste passwords into chat.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only private Storage/profile operations.
- `SUPABASE_ANON_KEY`: project publishable/legacy anon key used by server-side Auth (public configuration).
- `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, optional `REED_API_KEY`.
- Shared-password `ADMIN_PASSWORD_HASH` / `JWT_SECRET` are no longer used for staff authentication. Create verified named Auth accounts, register approved memberships in `recruitment.staff_users` and enroll MFA. See `STAGE_1_UAT.md`.
- `SITE_URL`: verified public HTTPS origin; configure matching Supabase Auth site URL, redirect URLs and transactional email.

The adapter opens one connection per operation, uses bound values and transaction-local search path/timeouts, closes the connection after the operation, and executes batches atomically. Runtime DDL is disabled. Candidate authorization remains the responsibility of authenticated server handlers; a privileged database connection does not automatically apply end-user RLS identity.

No runtime credentials or deployment were available in this recovery session. Validate the actual pooler connection, certificate chain, SQL parameter types, uploads, parsing, grading, matching, permissions and download paths in isolated staging before production. Do not replace certificate validation with `rejectUnauthorized: false` to work around configuration errors.

## Outstanding recovery gaps

Local-only commit `3214eae` was not found in the original GitHub repository. The earlier handover's candidate applications/activity, client portal, consultant workspace, maintenance endpoint are not present in this recovered revision. The supporting database tables survived, but their existence does not imply that those interfaces exist.

Partial upload/database failures can leave orphaned objects. Reconciliation, full privacy export/deletion/retention, queue processing, comprehensive audit, interview and CV-version workflows remain outstanding. No existing data or CVs have been migrated.

## Stage 1 evidence

The fifth migration was applied to the authorized project. `supabase/tests/staff_access.sql` passed on the live schema in a rollback transaction: admin/consultant separation, AAL1 denial, inactive/unverified/banned staff, factor removal, expired/revoked sessions, metadata spoofing, ownership and protected writes. Security advisor: no findings. This does not verify deployed Auth, SMTP or browser MFA. The manual staging workflow prepares isolated Supabase/Cloudflare deployment and rejects use of the production project; configure it using `STAGE_1_UAT.md`.

## Second database reconciliation — blocked

Lovable project UKTL (`b976b2a4-fea6-43dc-a8da-72d7238985c7`) reports its Cloud database disabled. This does not exclude an external Supabase connection. Its readable `wrangler.toml` contains placeholder URLs, `supabase/config.toml` uses only a local CLI project name, and the browser client reads environment variables. The connected Supabase account lists only UKTL; no second remote target was identifiable. The Lovable source at `b7969c11ba7003a68248678656f8126093720679` is older than the destination implementation.

Required to finish: the external Supabase project reference and authorized access. Inspect existing schema, migrations and data before selecting compatible migrations; do not replay the baseline blindly. Do not enable a new Lovable Cloud database as a substitute. The original repository remains preserved. Source commits and database application are separate operations; updating main does not itself synchronize another database or Lovable project.
