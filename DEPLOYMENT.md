# UKTL deployment and release

Current runtime target: Cloudflare Workers with Supabase PostgreSQL, Auth and private Storage. Development is performed through GitHub; Lovable credits are not required. No application deployment has yet been verified.

## Staging

Follow STAGE_1_UAT.md. The manual `.github/workflows/staging.yml` workflow validates a distinct Supabase project, generates explicit Worker configuration, builds, deploys with a private secrets file and runs authenticated browser checks. It fails on missing credentials or skipped/flaky/failed test cases. Staging migrations, Auth SMTP/redirects and verified test identities must be configured first.

The generated `.deploy` directory is ignored by git, uses restrictive permissions and is deleted by the workflow. It contains server secrets temporarily; never publish it or include it in artifacts. The workflow uses an explicit `--config`; do not create a competing root Wrangler JSON configuration.

Before running the workflow, require the same commit's CI jobs to pass: unit tests, TypeScript, Workers build, anonymous browser tests, clean PostgreSQL 17 migration replay and policy regressions. A successful workflow does not replace the user's email, MFA and UAT checks.

## Production prerequisites

Production project: `fvkffdeindboirukscfq`. Canonical migration history is documented in SUPABASE_INSTALLATION.md. Do not replay legacy baseline files. Confirm migration history and inspect the CLI dry run before any push.

Production remains gated by DEVELOPMENT_GATES.md, including isolated staging UAT, actual CV/recruitment and HR/booking journeys, backup restoration, monitoring, privacy workflows and a tested rollback plan. Confirm the production origin and set Auth redirects exactly; no production host is presumed.

Required runtime configuration: `DATA_BACKEND=supabase`, project URL and public key, confirmed `SITE_URL`, `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Live functionality also needs Anthropic, Resend and Reed configuration. Consultations use the native calendar (no scheduling provider); staff set opening hours in Admin → Consultations before candidates can book. Scheduling must use a strong dedicated secret and remains disabled until tested. Provider subscriptions, video content and domain verification are client deliverables.

Staff access uses named verified Supabase users, current `recruitment.staff_users` membership and MFA. `ADMIN_PASSWORD_HASH` and `JWT_SECRET` do not enable current staff access. Public profile writes are scoped to the authenticated user; the private recruitment adapter still uses a privileged server connection, so every server action must authorize itself.

## Release and rollback checks

- Record the exact commit, migration list, provider configuration versions and deploy identifier.
- Confirm no secrets or personal data in client bundles, logs or public Storage.
- Exercise registration/recovery, private downloads, upload-to-match, interests, HR escalation, bookings and role separation in staging.
- Confirm backup restoration in a disposable environment, monitoring alerts and operator recovery procedures.
- After signed UAT, deploy production; verify public and authenticated smoke tests and provider delivery.
- For an application regression, use Cloudflare's previous verified Worker version. Assess database compatibility before rollback. Do not reverse migrations blindly or remove production data.

Legacy D1/R2 infrastructure instructions are archived in docs/LEGACY_D1_DEPLOYMENT.md. They are not the current production setup.


## Durable CV worker

Supabase uploads now return a queued state and require the protected worker to process them. See STAGE_2_UAT.md for exact manual and scheduled setup, runtime secrets and acceptance checks. The scheduled workflow is disabled until `ENABLE_CV_WORKER=true`; hosting remains deferred by the owner. Do not enable scheduling against production before isolated staging acceptance.
