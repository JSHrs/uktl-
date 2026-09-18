# Stage 2 recruitment verification

## Development checkpoint: durable CV processing and corrections

Implemented: private upload registration plus durable task before storage, delayed recovery if activation is interrupted, three bounded attempts, 15-minute leases, stale-result fencing, optimistic profile revision checks, editable extraction, refreshed assessment, candidate status display, administrator queue and secret-protected maintenance endpoint. No live provider or deployed browser acceptance is claimed.

Verified implementation commit: `58db92348aad4910161b89a5e6b5c86a3b7495bc`; [CI 35360043671](https://github.com/devacnt/UKTL/actions/runs/35360043671) passed both jobs. 36 unit tests and 24 browser checks passed; 14 authenticated cases remain skipped.

Automated evidence: `supabase/tests/cv_processing.sql` exercises lease recovery, token rejection, ownership, stale edits, retry delay/ceiling and function privileges. The entire live test transaction rolls back. `scripts/test-processing-postgres.ts` exercises the actual worker and persistence statements against isolated PostgreSQL with synthetic provider responses; it checks skill normalization, consultant-stage preservation, correction refresh and rejection of in-flight stale results. It makes no paid AI calls.

## When the owner connects Cloudflare

Hosting remains deferred by the owner; implementation continues. Configure the server-only database, private-storage and Anthropic secrets first. Set a randomly generated `CRON_SECRET` of at least 32 characters on the Worker and the matching GitHub Actions secret. Set repository variable `UKTL_MAINTENANCE_URL` to the exact HTTPS `/api/maintenance` URL, then `ENABLE_CV_WORKER=true` only for the intended environment after the manual worker check. No scheduler has been activated by this checkpoint. The workflow processes one task every five minutes; GitHub schedules may be delayed. This is a low-volume MVP runner, not a throughput SLA.

The administrator can process one due task at `/admin/processing` using their verified MFA account. A failed worker attempt is redacted and retried after one or five minutes. A crash on the final attempt becomes terminal after lease expiry. The original storage key remains registered, including partial-upload failures. Automatic object deletion/orphan reconciliation is still outstanding.

## System checks before user testing

- [ ] Deploy to an isolated staging project and origin; verify its secrets do not point at production.
- [ ] Candidate A/B and named administrator/consultant roles pass Stage 1 isolation and MFA checks.
- [ ] Unauthenticated or incorrect-secret `/api/maintenance` requests return 401; scheduler secrets never appear in browser traffic.
- [ ] Upload synthetic PDF, DOCX and TXT; verify private storage, queued status, actual Claude extraction and score/report completion.
- [ ] Interrupt a worker, verify 15-minute recovery and no duplicate result writes; induce provider failure and verify bounded retries and redacted errors.
- [ ] Save corrections during a worker request; the older result must not overwrite them. Save from two tabs; the stale save must fail with reload guidance.
- [ ] Re-assessment preserves consultant pipeline stages and refreshes candidate score/matches. No placeholder scores appear while processing.
- [ ] Close/expire a role; verify it is excluded from candidate discovery. Test interest, dismiss, undo and history on mobile and keyboard.
- [ ] Test deletion while processing; the deleted candidate must not be recreated.

## User tests to request when staging is available

Use synthetic or approved anonymised examples until privacy checks pass: two Construction CVs and two Technology CVs. Verify extracted contact/sector, skills with years, work history and education; correct one entry and confirm the saved values persist. Confirm report recommendations are useful and factually grounded. Test a second CV upload, interests and undo on a phone. Record tester/date, expected/actual result, screenshots and blocking issues.

Do not ask the owner to run these against an undeployed application. No Stage 2 completion claim until daily Reed sync, Claude matching/evaluation, cleanup strategy and all required deployed/UAT evidence pass.

## Reed checkpoint acceptance

Use REED_SYNC.md for configuration and activation. Verify both sectors against real provider data, salary units, date parsing, repeated-import updates, preserved staff closure and expired-interest rejection. Exercise malformed detail responses, partial searches and dispatch failures. Confirm cron execution AND the final HTTP/import result. Apply the resumable migration to isolated staging first. Interrupt and reclaim a worker; prove stale workers cannot write and a retry resumes its saved cursor. Verify pause after three failures, explicit admin retry, all configured queries finishing, and same-day idling. Review search coverage and batch capacity against real Reed data; match-cache refresh remains open implementation work.
