# Current stage checkpoint — 18 September 2026

## Reed ingestion checkpoint

- [x] Paginated search and full-detail retrieval; atomic source upserts preserve staff closure, curated requirements and vacancy IDs.
- [x] Salary range/unit/currency and normalized dates; expiry filtering in candidate results and atomic interest writes.
- [x] Construction/Technology selector, conservative role-title filtering and explicit partial/failure counts.
- [x] Protected sync endpoint and Supabase Edge dispatcher prepared with a separate operator-only daily scheduling script. Nothing deployed or scheduled.
- [x] Migration `20260918151920` applied; live rollback upsert check preserved staff closure; security advisor returned no findings.
- [x] 40 local unit tests, TypeScript and production build passed. Actual PostgreSQL ingestion regression added to CI; this commit's CI is pending.
- [ ] Full search coverage/cursor continuation, durable sync monitoring, match refresh and live Reed verification remain open. Bounded imports do not establish D4 completion. See REED_SYNC.md.
- [ ] Stage 2 still requires Claude matching/evaluation, upload cleanup and deployed acceptance.

## Durable processing and profile correction checkpoint

- [x] Durable CV job registration before object storage; queue activation failures recover after a grace period.
- [x] Protected one-task worker, three-attempt limit, backoff, expiring leases and atomic result fencing.
- [x] Candidate extraction editor for contact/sector, skills, experience, education and links; revision checks prevent stale-tab overwrites and queue re-assessment.
- [x] Candidate processing status, administrator queue, and disabled-by-default scheduled runner. No secrets configured or scheduler activated.
- [x] Fixed skill-alias deduplication so raw labels/years cannot attach to a different skill.
- [x] Supabase migration `20260918145535` applied; live rollback tests passed; security advisor returned no findings.
- [x] Local 36 unit tests, TypeScript and Workers build passed; PostgreSQL worker integration is included in CI.
- [x] Implementation commit `58db92348aad4910161b89a5e6b5c86a3b7495bc` passed [CI 35360043671](https://github.com/devacnt/UKTL/actions/runs/35360043671): 36 unit tests, 24 browser checks, 14 credential-dependent skips, fresh PostgreSQL 17 migration replay, staff/discovery/lease SQL checks and actual worker integration with synthetic provider responses. This is the accepted automated checkpoint, not deployed Stage 2 acceptance.
- [ ] Actual Claude/storage/runtime and authenticated editor browser tests remain unexecuted; see STAGE_2_UAT.md.
- [ ] Remaining Stage 2: orphan reconciliation, Claude matching/evaluation and complete daily Reed ingestion. Stage 2 remains IN PROGRESS.

## Recruitment implementation checkpoint

- [x] Discovery automatically uses the signed-in user's latest CV and ranks unseen jobs by available match score.
- [x] Decisions save before cards disappear; errors stay visible. Anonymous visitors/staff reviewing somebody else cannot submit candidate intent.
- [x] Atomic owner/open-role checks, monotonic decision versions, and conditional undo prevent cross-account writes and stale-tab deletion.
- [x] Candidate interest/history page with pagination and withdrawal/undo; staff-only expressed-interest list on vacancy detail.
- [x] Pointer cancellation no longer submits a swipe; vertical mobile scrolling and reduced-motion handling improved.
- [x] Rules-based matching no longer awards missing-data defaults, duplicate-skill credit or broad geographic proximity bonuses. This is not the scoped Claude engine or a calibrated probability of success.
- [x] Local verification: 30 unit tests, TypeScript, Workers build, targeted lint and whitespace checks passed.
- [x] Recruitment commit `9d00a164` passed CI `35356211513`, including browser checks and actual bound-query PostgreSQL tests for decisions, ownership and undo. Authenticated live cases remain skipped.
- [x] Follow-up: register each CV storage key before uploading bytes; a failed registration cannot create an untracked object. Failure-injection tests passed.
- [x] Removed timer-driven fake upload progress and corrected the private-storage/Claude-processing wording.
- [x] Follow-up local checks: 33 unit tests, TypeScript, Workers build and targeted lint passed. Follow-up commit `ebea255c` passed CI `35356712909`: 33 unit tests, 24 browser checks, 14 credential-dependent skips, PostgreSQL migration/policy and actual discovery-query tests.
- [x] Durable queue/retries and editable extraction with revision-safe re-assessment implemented in the newer checkpoint.
- [ ] Automatic orphan cleanup remains outstanding.
- [ ] Claude-backed matching/calibration and refreshed cached results; daily Reed Edge Function and expiry handling.
- [ ] Deployed/mobile end-to-end acceptance after the owner connects hosting. No live recruitment completion claimed.

## Hosting decision — 18 September 2026

The owner will connect Cloudflare through Lovable later. Continue GitHub development without waiting for hosting, runtime secrets or Stage 1 live UAT. Implementation phases may advance after their automated checks pass; deployed acceptance remains OPEN until tested. Revisit the connection when the application is ready for integrated staging tests, and again before production release. No Lovable credits are authorized or needed for the current coding work.


- Gate 0 PASS: recovered source transferred and old repository preserved.
- Gate 1 IN PROGRESS: named Supabase staff authentication, mandatory MFA, real password recovery, user-scoped profile writes, authentication rate limits and staging preflight implemented. No shared admin-cookie fallback.
- Applied migration `20260918112245_named_staff_access_and_mfa`; rollback policy tests passed on the target project. Security advisor: no findings.
- Local: 22 unit tests passed; TypeScript/build passed; targeted lint passed. Code commit `8a5ab095de3f51b9ca2158db51b98578da9e7f9a` passed CI run `35340244815`: 22 unit tests and 22 browser tests passed, 14 staging-credential cases skipped. The separate PostgreSQL 17 job passed clean migration replay and staff/ownership SQL tests. The documentation/form-label follow-up `27d484d9` also passed CI `35340723416`.
- Prepared isolated staging deployment and authenticated test workflow; missing hosting/runtime configuration, SMTP, staging identities and user acceptance prevent Stage 1 completion.
- Gates 2–4 not accepted. No deployment, end-to-end live provider verification or product-readiness claim.
- Approved delivery scope is D1–D13 plus the priority hardening in DEVELOPMENT_GATES.md. Full client CRM/interview expansion is not an MVP prerequisite.

| Stage | Planning allowance | Completion gate |
|---|---|---|
| 0 Source recovery | Complete | Verified destination tree and passing baseline CI |
| 1 Accounts and environments | 2–3 working days including live checks | Named roles/MFA, recovery email, staging and user isolation accepted |
| 2 Recruitment D2–D6 | 4–6 working days | Real upload/edit/score/sync/match/interest journeys accepted |
| 3 HR and booking D7–D11 | 3–5 working days | Reviewed content, sourced escalation and verified bookings accepted |
| 4 Operations and release D12–D13 | 3–6 working days | Privacy/restore/load checks, full UAT, production smoke tests |

These are conditional planning allowances (12–20 focused working days total), not an autonomous background schedule or a promised launch date. Missing provider access, content and reviewer availability extend elapsed time. See STAGE_1_UAT.md for the immediate owner actions and tests.

---

# Historical recovery checkpoint — superseded by the current status above

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
