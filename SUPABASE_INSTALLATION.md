# UKTL Supabase installation and recovery

Target: `fvkffdeindboirukscfq` (UKTL). No database changes were made during the recovery session on 18 September 2026.

## Recovered migration history

The canonical `supabase/migrations` directory now contains the exact stored SQL statements retrieved from the target project's migration history:

1. `20260918000156_uktl_initial_and_auth_hardening`
2. `20260918000314_uktl_least_privilege_client_access`
3. `20260918001950_uktl_recruitment_and_workflows`
4. `20260918003021_uktl_explicit_backend_policies_and_constraints`

The first remote migration combines the two original baseline migrations. Their original files are preserved unchanged under `supabase/legacy-migrations`, outside the CLI migration directory. Do not replay those legacy files or mark the four existing remote migrations as unapplied. No remote migration-history repair was performed.

Before a future `db push`, explicitly link the correct project, inspect migration list, and inspect a dry run using the installed CLI's documented flags. The existing four migrations should be shown as already applied. Stop if they would be replayed. A fresh local replay has not yet been tested.

Live metadata checks confirmed 29 recruitment tables, all 29 with RLS enabled, and private bucket `uktl-cvs`, limited to 10 MiB and PDF/DOCX/TXT. These are metadata checks, not complete security certification.

## Runtime

Production Wrangler vars select `DATA_BACKEND = "supabase"` and the target project URL. Default/staging remain explicitly separate legacy configurations until isolated staging is provisioned. The removed unconfirmed production hostname must not be restored without verifying the intended domain.

Set these in the hosting platform's secret/configuration interface, never source control:

- `DATABASE_URL`: Supabase transaction-pooler PostgreSQL URI, with an account allowed to access the private recruitment schema. Prepared statements are disabled. TLS certificate verification is mandatory. Obtain credentials from the project's Connect panel; do not paste passwords into chat.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only private Storage/profile operations.
- `SUPABASE_ANON_KEY`: project publishable/legacy anon key used by server-side Auth (public configuration).
- `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, optional `REED_API_KEY`.
- `ADMIN_PASSWORD_HASH`, strong `JWT_SECRET`: the recovered baseline still uses the shared-password administrator flow. Named staff login remains to be rebuilt.
- `SITE_URL`: verified public HTTPS origin; configure matching Supabase Auth site URL, redirect URLs and transactional email.

The adapter opens one connection per operation, uses bound values and transaction-local search path/timeouts, closes the connection after the operation, and executes batches atomically. Runtime DDL is disabled. Candidate authorization remains the responsibility of authenticated server handlers; a privileged database connection does not automatically apply end-user RLS identity.

No runtime credentials or deployment were available in this recovery session. Validate the actual pooler connection, certificate chain, SQL parameter types, uploads, parsing, grading, matching, permissions and download paths in isolated staging before production. Do not replace certificate validation with `rejectUnauthorized: false` to work around configuration errors.

## Outstanding recovery gaps

Local-only commit `3214eae` was not found in the original GitHub repository. The earlier handover's candidate applications/activity, client portal, consultant workspace, named administrators, recovery page and maintenance endpoint are not present in this recovered revision. The supporting database tables survived, but their existence does not imply that those interfaces exist.

Partial upload/database failures can leave orphaned objects. Reconciliation, full privacy export/deletion/retention, queue processing, comprehensive audit, interview and CV-version workflows remain outstanding. No existing data or CVs have been migrated.
