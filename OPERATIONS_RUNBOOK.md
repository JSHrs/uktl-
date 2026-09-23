# UKTL operations and release runbook

## Release order

The owner authorized completion of implementation and hardening on 23 September 2026 with **Cloudflare last**. Earlier instructions to pause Stage 4 pending Stage 2/3 acceptance no longer block engineering work. They do not waive live acceptance. `devacnt/UKTL` is authoritative; mirror the accepted commit to `JSHrs/uktl-` main and `claude/cv-parsing-dashboard-design-MlDEc`. Never overwrite concurrent work or use a force push.

## Operational controls

- `/admin/operations`: MFA administrator only. Queue failures, expired leases, overdue work, Reed sync freshness, undelivered booking events, pending file deletion, privacy requests and latest 100 audit events.
- `/api/operations/health`: authenticated with `CRON_SECRET`; returns only counts. Fails with 503 if either sector has no completed sync in 36 hours, a CV job has failed/expired/is overdue, cleanup is overdue, or booking events are failed/skipped. Alert counts intentionally require investigation; they do not silently clear historical failures.
- `UKTL_MONITOR_URL=https://<origin>/api/operations/health` and `UKTL_MONITOR_TOKEN` enable `node scripts/check-operations.mjs`. Configure the external monitor at deployment; none is claimed active before that. Never put the token in a URL or browser code. Verify a forced failure reaches the on-call operator, then restore health.
- AI calls reserve a database-backed hourly slot before reaching Anthropic. `AI_HOURLY_CALL_LIMIT` defaults to 100; valid range 1–10,000. Failed/interrupted calls also consume the slot. This is a request limit, not a currency cap. The dashboard reports provider token counts, including cache counts. Unknown usage remains unknown. Reconcile model-specific provider prices and invoices before reporting spend. No prompt/CV/provider body is stored in telemetry.
- Audited database writes record action, entity ID, verified request actor (or `system`) and timestamp atomically. Do not treat missing actors on worker or SQL-console operations as named-staff evidence. Provider actions are not automatically included in the database audit.

## Private CV scanner: mandatory integration

Supabase private storage refuses uploads and downloads until `CV_SCAN_URL` and `CV_SCAN_TOKEN` are configured. Existing stored files are scanned before download or parsing, so old uploads do not bypass the check. The gateway must be operated privately under an approved data-handling agreement; do not upload CVs to public multi-engine scan services.

Protocol: `POST` bounded raw bytes (maximum 10 MiB) with `Authorization: Bearer <token>` and `X-Content-SHA256`. Return JSON `{"verdict":"clean","sha256":"<digest of scanned bytes>"}` only after the actual antivirus engine completed. All other verdicts, timeouts, redirects and digest mismatches are rejected. TLS public hostname, no URL credentials/query, token at least 32 characters. The adapter and private ClamAV gateway implementation (`services/cv-scanner`) are included. The engine/gateway deployment and signature-update monitoring are **not** provisioned. Acceptance requires clean, infected (approved synthetic antivirus test), malformed, timeout and mismatch fixtures against the real private gateway. No unscanned bypass exists.

## Privacy and retention

Candidates can download a bounded self-service account/recruitment export or submit an authenticated full-export/erasure request. Exports omit storage keys and authentication secrets; exports over the bound require staff assistance, never silent truncation. Original CV downloads are separate. A full reviewed export also considers internal notes, messages, Auth and external providers; the self-service copy is explicitly not represented as exhaustive.

Administrators review identity, request scope, exemptions/holds and external providers. The request queue records review updates. An MFA administrator can explicitly approve account removal only after reviewing identity, retention/holds, external provider and unlinked/email-only records and in-flight notifications. The implementation blocks new owned writes, queues/removes all candidate private files, removes owned recruitment/HR/booking records, then deletes the Supabase Auth account. Staff targets and self-deletion are refused. Provider failure leaves a durable pending request and blocks application access; retry resumes the same job. External-provider, backup and unlinked-record handling remain a documented operator responsibility and must be completed before attesting the review. No live subject request is executed by development tests.

Deleting one candidate/CV record uses `queue_candidate_erasure` to save all known private object keys and remove the recruitment record/worker jobs atomically. The authenticated handler then removes the files; an interrupted operation stays pending and can be retried in Operations. The user's account, HR conversations and external provider records are not erased by this action. Cleanup checks key namespace and current references before removal. Do not use the legacy row-only deletion helper for Supabase records.

No automatic time-based erasure or orphan-file purge is enabled: the owner must approve retention periods, recovery windows, legal holds and backup treatment first. Existing orphan inspection is metadata-only. Before approving an orphan removal, check references, live uploads/leases, recovery copy and audit evidence. Do not delete storage.objects rows directly; that does not remove the underlying object.

## Backup, restoration and recovery acceptance

1. Use an isolated staging project and synthetic data; record the tested commit, migration set and tester/date.
2. Create database and private-object backups using the authorized provider tools. Database backups do not substitute for the private files. Encrypt exports and restrict access; never commit them.
3. Restore into a separate isolated target. Replay append-only migrations in order; compare schema versions and aggregate row/object counts.
4. Verify candidate A/B ownership, staff MFA, signed-out rejection and file download isolation. Confirm a restored pending CV job and file-deletion job resume safely.
5. Record measured recovery time and data-loss window for owner approval. A written runbook is not a successful restoration exercise.
6. For MFA loss, independently verify the staff member using the owner's approved recovery procedure. Do not grant metadata roles or disable the MFA gate; use authorized Supabase administrative recovery, revoke old sessions, re-enroll and test access.
7. Before production deploy, retain the prior artifact and configuration. Rehearse application rollback on staging without reverting applied SQL. Restore from backup only through the reviewed recovery procedure.

## Remaining acceptance evidence

- Isolated staging and real providers, verified candidate A/B and named MFA staff; all credential-dependent tests enabled with zero skips.
- Four reviewed CV examples (two Construction, two Technology), expected scoring/evidence outcomes, correction/rescore and mobile discovery.
- Approved current HR sources and video transcripts/captions, reviewed guidance cases, actual booking/cancellation/rescheduling and delivery evidence.
- Production notice/terms, provider data-handling review, approved retention/recovery, privacy-request fulfillment acceptance against real Auth and Storage.
- Real scanner gateway acceptance, monitor alert delivery, load/timeouts, mobile/keyboard/accessibility, backup restore and rollback rehearsal.
- Previous Lovable database identity/schema reconciliation remains deferred and must never be guessed or overwritten.
- Cloudflare configuration/deployment last; successful local/CI tests do not prove a live deployment.

## Privacy notice review sources

The `/privacy` and `/terms` pages now replace dead links with factual product information. They are not a declaration of legal completeness. Before launch, the owner/reviewer must add verified controller identity, purposes and lawful bases, actual provider recipients/transfers and safeguards, retention periods/criteria, applicable rights and complaint information. Do not invent these business decisions. Reference: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/ and https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/ (checked 23 September 2026).
