# Current stage checkpoint — 18 September 2026

## Verified combined checkpoint and current database

- Commit `369ad88b8fcb14f930e07a438e2d629585b32648` passed [CI 35396364849](https://github.com/devacnt/UKTL/actions/runs/35396364849): 58 unit tests, 25 browser checks, TypeScript/build and all isolated PostgreSQL migration/policy/worker/HR/booking integrations. Fourteen credential-dependent browser tests remain skipped and are not acceptance evidence.
- Applied CI-tested migrations to current UKTL only: `20260918212558_matching_evidence_and_refresh` and `20260918212609_hr_journeys_and_verified_bookings`. Local filenames reflect actual remote migration versions; SQL is unchanged. All five new private tables have RLS and deny anonymous/authenticated direct reads. Match-snapshot function execution is denied to those roles. `uktl-videos` is private with bounded video/VTT uploads. Security advisor returned no findings.
- Follow-up hardening includes bounded streaming AI responses, approval requiring existing video/caption object metadata, account appointment retrieval, extra reschedule/email-mismatch/privacy regressions and the compatible Seroval update from 1.5.2 to 1.6.7 for [GHSA-mv8w-475r-vwqw](https://github.com/advisories/GHSA-mv8w-475r-vwqw). Only that dependency lock entry was changed; unrelated lockfile churn was excluded. Final follow-up CI pending.
- Approximate overall implementation completion: **75% (70–80% range)**, not a measured task ratio, calibrated forecast or release-readiness score. Earlier percentages below are historical checkpoints.
- **Neither Stage 2 nor Stage 3 is fully accepted.** Remaining work includes approved retention/recovery and malware strategy, safe orphan cleanup, human-reviewed CV/match and HR evaluation, approved videos/captions, real provider configuration, isolated staging journeys and Stage 4 privacy/operations/UAT. Hosting remains deferred; no deployment, paid AI calls, scheduler activation or third-party messages performed. Previous Lovable Supabase synchronization remains deferred by the owner.

## Stage 3 implementation checkpoint (historical pre-CI notes)

- Private owner-scoped HR questions/history, revision-safe resolution/context/answers, opaque-ID URLs, token-based FAQ alternatives and exact published/reviewed topic links.
- Private video bucket migration, signed playback, captions/transcript review controls and per-user/topic/day play deduplication. No video content produced or approved automatically.
- Allowlisted, bounded ACAS retrieval; administrator approval tied to source hash; withdrawal on reimport, 30-day retrieval/review window, literal-quote checks, uncertainty and enforced disclaimer. Source selection is AI-assisted; human legal/content evaluation remains mandatory.
- Calendly embed opt-in, private booking intents, raw-body HMAC verification with timestamp tolerance, API-verified event type/invitee/times, idempotent state transitions, cancellation/reschedule linkage, durable notification outbox and honest delivery states. Browser messages never confirm appointments.
- Actual resolution/AI/linked-booking analytics replace estimated funnel values. Test fixtures are synthetic and make no external provider calls.
- Local 58 unit tests, TypeScript and build passed before the final review edits. Full PostgreSQL/CI verification is pending; both new migrations are prepared and not yet applied. Stage 2 CI `35394347949` identified double-encoded JSONB cached assessments; binding the structured object fixes the defect and must pass rerun.
- Stages 2 and 3 remain OPEN for live/provider and human acceptance. See STAGE_2_UAT.md and STAGE_3_UAT.md. No deployment, scheduler activation, live provider messages, old-database updates or service purchase occurred.

## Stage 2 evidence review and bounded refresh

- Administrator match refresh covers all current candidate/open-vacancy pairs in batches of 25 with a continuation cursor. Writes check and lock the original profile/vacancy snapshot; retries are idempotent and preserve consultant stages. A changed dataset can require a subsequent pass; this is not a scheduled full-index service.
- Candidate/staff Claude review of curated essential criteria: complete criterion coverage, exact evidence quotations, unknowns instead of invented gaps, algorithm/model/date, input-fingerprinted caching and stale-result rejection. Direct identity/contact fields are omitted from the supplied evidence. Free-text work descriptions may still contain personal information. AI interpretations never alter rules-based ranking or make hiring decisions.
- Local 53 unit tests, TypeScript and build passed. PostgreSQL snapshot/refresh/cache regression tests added; CI pending. Migration is prepared, not yet applied. Actual Claude evaluation on a human-reviewed dataset remains required; quote-presence checks do not prove semantic accuracy.
- Stage 2 is NOT fully accepted: automatic cleanup needs an approved retention/recovery policy; real provider/staging tests, reviewed score/AI evaluation and malware/throughput acceptance remain. Rough implementation estimate is about 65%, not release readiness. Work continues into Stage 3 without claiming the Stage 2 acceptance gate is closed.

## Upload reconciliation inspection checkpoint

- Administrator-only, rate-limited inspection on `/admin/processing` identifies up to 100 old unreferenced CV objects and 100 old candidate records missing object metadata. More-results flags prevent treating a truncated sample as complete.
- A 24-hour grace period excludes recent writes. Candidate and CV-version references protect retained files; pending/running tasks exclude candidate records from missing-file findings. No CV bytes, object paths or profile contents are returned.
- Supabase Storage metadata remains read-only, following https://supabase.com/docs/guides/storage/schema/design. The Supabase skill guided metadata-only inspection, access checks and verification. No files/records deleted, database schema changed, scheduler activated or app deployed. Actual cleanup with rechecks, complete inventory and byte-level verification remain open.
- Local 50 unit tests, TypeScript and Workers build passed. Both exact SQL queries passed read-only EXPLAIN on current UKTL. Isolated PostgreSQL fixtures were added for orphan detection, CV-version protection, grace period and pending-worker protection; current CI must verify them.
- Previous staff checkpoint CI `35370994696` failed because a test compared PostgreSQL numeric text `'50'` with number `50`; corrected via explicit Number conversion. Its application/browser job passed. Do not treat that previous run as a complete pass.
- Implementation `15038ad086f6b52eaa4855b63a300349792e323a` passed both jobs in [CI 35379986983](https://github.com/devacnt/UKTL/actions/runs/35379986983), including actual PostgreSQL reconciliation fixtures and the corrected staff-score assertion. Local HTTP smoke also passed for public routes; signed-out candidate/admin-processing requests redirected to login. Required authenticated staging checks remain open in STAGE_2_UAT.md. This supersedes the pending CI note above, not deployed acceptance.
- Stage 2 continues. Rough implementation estimate remains about 60% (50–65% range), not launch readiness. Remaining: safe cleanup, broader/bounded match refresh, Claude evaluation, live provider checks, HR/booking, privacy/operations and live acceptance. Previous Supabase synchronization stays deferred.

## Staff pipeline score freshness

- Existing staff vacancy pipeline matches now recalculate from current profile and job evidence before selecting the top 50. Cached rankings cannot hide a newly stronger match. Equal scores use a stable candidate-ID tie-break.
- Consultant stages remain unchanged; reads do not persist scores or invoke AI. Closed-vacancy pipelines remain available to staff for review, while unfinished/missing profiles do not expose cached scores. Malformed evidence fails closed.
- Unit coverage includes 51 candidates proving top-50 selection happens after refresh, stage/cache preservation, closed vacancies, unfinished and malformed profiles, and exclusion of raw profile payloads from results. PostgreSQL integration assertions added to the existing CI worker test.
- Verification: 47 local unit tests, TypeScript and Workers build passed. Local HTTP smoke was not verified: the dev server reported ready on 8080 with a cloudflare:workers dependency-scan warning, but the separate request process could not connect. Current CI must verify browser/PostgreSQL integration. The preceding candidate-freshness commit `16ee8e5b` passed CI [35370554312](https://github.com/devacnt/UKTL/actions/runs/35370554312).
- This does not populate every candidate/vacancy pair or provide bounded large-catalog refresh. Those, Claude matching/evaluation, orphan cleanup, real provider checks, HR/booking and operations/live acceptance remain open.
- Implementation estimate remains approximately 60% (50–65% planning range). This small correctness checkpoint does not justify a new headline percentage. Stage 2 remains IN PROGRESS; no hosting or release acceptance claimed. Previous database synchronization remains deferred by owner instruction.

## Candidate match freshness and database scope

- Owner decision: continue only on UKTL Supabase `fvkffdeindboirukscfq`; defer synchronization of the previous/Lovable database until the end of development. Its identification is not a current development blocker.
- Candidate detail and discovery now calculate rules-based scores from the current parsed profile and all current open/unexpired vacancies in one database statement snapshot. Newly imported jobs no longer require a previously cached match row, and edited requirements do not reuse old scores.
- Reads do not write matches, change consultant stages or invoke AI. Unfinished/missing profiles yield no results; invalid profiles fail closed. Current salary/source metadata is retained.
- Local verification: 45 unit tests, TypeScript and Workers build passed. A read-only EXPLAIN confirmed the query is valid on current UKTL schema. PostgreSQL integration assertions cover edited requirements, new vacancies and preserved pipeline stages; current CI must verify them. No schema migration or application deployment required/performed for this change.
- Remaining matching scope: staff-wide persisted match refresh, bounded large-catalog processing, Claude-supported assessment and reviewed evaluation/calibration. This is not completion of D4/D5 or live acceptance.
- Planning estimate: approximately 60% of scoped implementation (rough range 50–65%), not measured task-count completion or launch readiness. Foundations are largely implemented, recruitment is advanced but incomplete, and HR/booking plus operational/privacy work remain substantial. Only Gate 0 is fully accepted; Gates 1–4 still require their stated evidence.

## Resumable Reed checkpoint

- [x] Durable query/cursor progress, broader controlled search sets, lease-fenced writes, expiry/recovery and three-attempt retry cap implemented.
- [x] Admin progress/failure visibility and explicit retry; HTTP 202 distinguishes ongoing work from completed cycles.
- [x] Prepared continuation schedule processes batches every ten minutes and idles after a cycle completes for the UTC day. Nothing deployed or activated.
- [x] Implementation `cf52067e002d37301351692448ee09ca18039823` passed [CI 35365478142](https://github.com/devacnt/UKTL/actions/runs/35365478142): 42 unit tests, 25 browser checks, TypeScript/build, fresh migration replay, lease/authorization SQL and actual resumable-worker PostgreSQL integration. Fourteen credential-dependent browser cases remain skipped. Provider responses were synthetic; this is not deployed acceptance.
- [x] Following the owner’s explicit database-update instruction, migration `20260918163142_resumable_reed_sync` applied to UKTL on 18 September 2026. Remote history confirmed; RLS enabled, anonymous/candidate table access and anonymous function execution denied; security advisor returned no findings. SQL is unchanged from the CI-tested migration, renamed to its actual remote version. Isolated staging application and live acceptance remain open.
- [ ] Second database synchronization BLOCKED: the accessible Supabase account exposes only UKTL. Lovable project `b976b2a4-fea6-43dc-a8da-72d7238985c7` reports Cloud database disabled; its source has placeholder Supabase URLs and no identifiable remote project reference. Its current source remains older than devacnt/UKTL/main. Obtain the external Supabase project reference and authorized connection before reconciling its existing schema. No replacement database provisioned or old repository overwritten.
- [ ] Real provider coverage/quotas, alert delivery, match refresh, Claude matching/evaluation and upload cleanup remain. D4 and Stage 2 are not accepted.

## Reed ingestion checkpoint

- [x] Paginated search and full-detail retrieval; atomic source upserts preserve staff closure, curated requirements and vacancy IDs.
- [x] Salary range/unit/currency and normalized dates; expiry filtering in candidate results and atomic interest writes.
- [x] Construction/Technology selector, conservative role-title filtering and explicit partial/failure counts.
- [x] Protected sync endpoint and Supabase Edge dispatcher prepared with a separate operator-only daily scheduling script. Nothing deployed or scheduled.
- [x] Migration `20260918151920` applied; live rollback upsert check preserved staff closure; security advisor returned no findings.
- [x] Implementation `332f9dc8bef56542b93066c8e75fbc0a1db13c87` passed [CI 35362865124](https://github.com/devacnt/UKTL/actions/runs/35362865124): 40 unit tests, 25 browser checks, TypeScript/build, fresh PostgreSQL migration replay and actual Reed/CV-worker/discovery integration. Fourteen staging-credential cases remain skipped. A new unauthorized-dispatch browser test exposed error-ordering; corrected and passed both locally and in final CI. Provider responses in automated ingestion tests are synthetic, not live Reed verification.
- [x] Cursor continuation and durable progress monitoring are implemented in the newer checkpoint above.
- [ ] Reviewed search coverage, match refresh and live Reed verification remain open; D4 is not accepted. See REED_SYNC.md.
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
