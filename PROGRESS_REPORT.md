# UKTL / Talent Compass — recovery progress, 18 September 2026

## Verified transfer

- Source: `JSHrs/talent-compass`, commit `c22e1ca2d189e05dc0885b30b2e5d2733b5c96ed`.
- Destination: `devacnt/UKTL`, private, admin/push access verified.
- Baseline transfer commit on destination main: `28b7e06ca3e73334f637b661b6ad68951882b3f8`.
- All 162 original tracked files recovered; each blob hash and file mode verified locally.
- Local and destination baseline tree both equal `f387573da6afd5c9e142052a8097fc68fee36a88`.
- Destination main updated without force after checking for intervening changes. Original repository untouched.
- No Lovable credits used. No application deployment or data/CV migration performed.

The previous workspace and ZIP were unavailable. The newer local-only implementation commit `3214eae` was not found remotely. This recovery must not be described as restoring that implementation.

## Rebuilt in this revision

- [x] Server-only PostgreSQL compatibility adapter with bound parameters, transaction batches, verified TLS, disabled prepared statements, connection cleanup and SQL timeouts.
- [x] Private Supabase CV upload/download/delete adapter, with no public object URLs.
- [x] Production backend selection and target project URL; removed the unconfirmed production hostname.
- [x] Cross-database swipe upsert that preserves existing records rather than SQLite replacement semantics.
- [x] File signature/extension validation, strict UTF-8 text validation, bounded DOCX extraction.
- [x] Recovered all four live migration SQL statements; reconciled local filenames to remote history, preserving old baseline files in a legacy directory.

## Verification

- Clean locked installations of the recovered baseline and rebuilt foundation succeeded.
- Baseline: 14 unit tests passed; TypeScript and production build passed.
- Rebuilt foundation: 18 unit tests passed; TypeScript and production build passed.
- Local Chromium download failed with network timeouts. No local browser-test pass is claimed. HTTP smoke checks passed for `/`, `/app`, `/auth/login`, `/admin/login`; signed-out `/app/candidates` redirected to login.
- Live metadata: 29 recruitment tables, all with RLS enabled; private CV bucket with 10 MiB limit and expected MIME types. Supabase security advisor returned no findings; this is not a complete application security certification.
- Baseline destination CI run `35323391299` passed installation, regression tests, TypeScript, production build and its end-to-end job. Credential-dependent cases may be skipped; this is not deployed-workflow verification. Foundation code commit `162ebe7f6c3bf292f7e0b4f5436c08cc9fb06465` also passed CI run `35323830436`: 18 unit tests and 18 browser tests passed; 14 credential-dependent browser tests were skipped. TypeScript and production build passed.
- Runtime database adapter, provider integrations and deployed user journeys remain unverified without runtime credentials and hosting.

## Remaining checklist

- [x] Complete current GitHub CI: both recovery and foundation code runs passed.
- [ ] Configure runtime secrets, production origin, Auth redirects/email and isolated staging.
- [ ] Rebuild named staff administration, password recovery, candidate applications/consent/saved jobs/activity, consultant workspace, client organisations/shortlists/feedback, and maintenance from the earlier handover.
- [ ] Validate upload → parse → grade → match → consultant/client flows, access isolation, private downloads and email retries in staging.
- [ ] Implement durable queue execution and upload/orphan reconciliation.
- [ ] Complete privacy export/deletion/retention, audit coverage, interview and CV-version interfaces.
- [ ] Verify MFA, monitoring, backups/restoration, malware-scanning strategy and load behaviour.
- [ ] Plan and verify migration of any existing users and CVs separately.

## Development timeline

These are planning estimates of focused engineering time, not scheduled background work or a delivery promise.

| Phase | Status / estimate | Exit condition |
|---|---|---|
| Source recovery and baseline transfer | Completed this session | Exact Git tree on destination main |
| Restore database/storage foundation and migration records | Implemented this session; staging verification pending | CI passes and real connection/storage checks succeed |
| Rebuild missing candidate, consultant and client workflows | Approximately 3–5 working days | Scoped workflows implemented and permission tests pass |
| Configure staging and test complete journeys | Approximately 1–2 working days after credentials/hosting | End-to-end evidence for each supported journey |
| Operational release hardening | Approximately 2–4 working days, scope dependent | Recovery, retention, monitoring and load gates pass |

75% completion is not verified. Supporting schema, source transfer and passing unit tests do not establish deployed project completion.
