# UKTL development and release gates

23 September owner instruction: proceed with remaining implementation and hardening; complete Cloudflare last. This supersedes the earlier Stage 4 engineering pause, but does not waive live acceptance. See OPERATIONS_RUNBOOK.md and RELEASE_CHECKLIST.md for the new controls and unresolved release evidence.

Historical 20 September acceptance decision: Gates 2 and 3 remain BLOCKED for the missing live/provider/content/policy evidence listed in ACCEPTANCE_REVIEW.md. The owner requested Stage 4 only after their acceptance; it has not been advanced. A staging configuration defect was corrected without deploying. Implementation remains approximately 75%; do not convert that estimate into an acceptance claim.

## Hosting decision — 18 September 2026

The owner will connect Cloudflare through Lovable later. Continue GitHub development without waiting for hosting, runtime secrets or Stage 1 live UAT. Implementation phases may advance after their automated checks pass; deployed acceptance remains OPEN until tested. Revisit the connection when the application is ready for integrated staging tests, and again before production release. No Lovable credits are authorized or needed for the current coding work.


The approved scope is D1–D13. Full client CRM and interview-management expansion are not release prerequisites. A stage is accepted only when its code, automated, live-system and user gates pass. A skipped or unexecuted required test is BLOCKED, never PASS. No stage percentage substitutes for evidence.

Database scope: continue development on UKTL Supabase only; the owner deferred the previous/Lovable database synchronization until development is complete. Bounded persisted match refresh and versioned Claude evidence review are now implemented; human-reviewed evaluation remains open. Stage 3 HR/video/booking implementation passed its initial CI checkpoint. The rough overall implementation estimate is about 75% (70–80% range), based on functional scope implemented, not a measured task ratio or release-acceptance percentage.

## Gate 0 — source and scope baseline

Status: PASS. Full source transferred; old repository preserved; recovered Supabase migration history reconciled. Baseline and foundation CI passed. Current requirements are the user's 13-deliverable MVP and the approved priority improvements.

## Gate 1 — accounts, roles and environments (D1; foundation of D12/D13)

Status: IN PROGRESS. Implementation and automated checkpoint passed at `8a5ab095` / CI `35340244815`; live staging/email/MFA UAT still BLOCKED. The suite's 14 credential-dependent skips are not acceptance evidence.

- Candidate registration, confirmation, login, refresh, logout and real password recovery.
- Verified named Supabase staff membership; no shared-password fallback, metadata-based privilege or self-promotion.
- MFA before staff privileges; admin and consultant permissions separated.
- Database RLS denies candidates, inactive staff, revoked sessions and unverified/first-factor-only staff inappropriate access.
- Staff access changes take effect without waiting for old role claims to expire.
- Public profile updates use the user's RLS identity; staff authorization does not depend on service-role access.
- Separate staging project and origin; deploy preflight rejects missing secrets and accidental production data use.
- CI: unit/security tests, TypeScript, build, anonymous browser checks and PostgreSQL policy regression tests.
- Live tests: verified candidate accounts A/B, named admin, consultant and inactive staff; confirmation/reset email via configured Resend SMTP; private-object isolation.
- User test: receive confirmation/reset email, set a new password, verify old password fails, enroll MFA, sign in/out and verify role-specific screens. Test script: STAGE_1_UAT.md.

Required evidence: commit and CI URL; live RLS test results; staging URL; tester/date and UAT results. Gate 1 cannot be accepted while staging, email delivery, identities or live tests are missing.

## Gate 2 — recruitment service (D2–D6)

Implementation: SUBSTANTIAL, ACCEPTANCE OPEN. Discovery/history/undo, consultant interest visibility, conservative rules-based scoring, durable CV retries/leases/revisions, profile editing, resumable Reed sync, metadata-only upload reconciliation, bounded persisted match refresh and versioned Claude evidence review are implemented. Initial combined Stage 2/3 checkpoint `369ad88b` passed CI `35396364849`, including actual PostgreSQL cache/refresh/worker tests. The JSONB cache defect from the earlier failed CI is corrected. Matching migration `20260918212558` is applied to UKTL. No scheduler was activated. Remaining: approved retention/recovery and malware strategies, safe object cleanup, representative human-reviewed score/evidence evaluation, real provider coverage and integrated staging/throughput acceptance. The former Lovable database remains deliberately deferred.

- PDF/DOCX intake, malware strategy, bounded extraction, private files, processing states, durable retries and orphan reconciliation.
- Candidate reviews/edits extracted contact, sector, skills, work history and education; changes trigger versioned re-assessment/rematching.
- Reviewed sector-specific score rubric and fixed evaluation set; extraction never fabricates missing facts.
- Daily authenticated Supabase Edge Function sync, structured salary/source/date fields, pagination, deduplication, update and expiry handling, actual sector filtering.
- Claude-supported matching with deterministic essential criteria; unknown requirements cannot earn high scores. Explain evidence, gaps, unknowns and assessment version/date.
- Ranked results; durable swipes with save failures visible, undo/history, candidate interest list and consultant pipeline. Explicit interest is not represented as an external job application.

Acceptance: upload/edit/update and sync pipelines pass against staging; closed/expired jobs disappear; no duplicate jobs/interests; scores meet the agreed reviewed test set; consultant can trace an expressed interest; candidates cannot read another user's files or records.

User test: two representative Construction CVs and two Technology CVs, correction of one extraction error, reviewed matches and mobile/keyboard discovery. Never use real candidate data until staging privacy/access checks pass.

## Gate 3 — HR, videos and consultations (D7–D11)

Implementation checkpoint: `1603ab58` / [CI 35397232760](https://github.com/devacnt/UKTL/actions/runs/35397232760) PASSED, including final privacy/rescheduling/security regressions. Private journeys/history, reviewed-source excerpts, video review/playback, verified Calendly state/outbox and real analytics are implemented. Migration `20260918212609` is applied to UKTL; new tables deny anonymous/candidate direct access, private video bucket confirmed, database security advisor clean. This is database/configuration evidence, not deployed behavior. Application dependency audit still has non-critical advisories requiring release review. Live/user acceptance remains OPEN; see STAGE_3_UAT.md.

- Questions, FAQ selection, resolution and AI answers persist per user. Sensitive question text is not embedded in URLs.
- Structured FAQ lookup, selectable low-confidence alternatives, exact video links and published-only public library.
- Separate video Storage, reviewed content, captions/transcripts and deduplicated play events.
- Approved ACAS/source retrieval, citations/review dates, uncertainty handling, enforced disclaimer and consultant CTA.
- Real Calendly embed; verified, idempotent booking events with appointment times; cancellation/rescheduling and Resend delivery tracking.

Acceptance: video-resolved, partly-resolved and no-match journeys; history ownership; no fabricated legal sources; actual confirmed booking and cancellation; accurate resolution/booking analytics.

User test: client approves FAQ content and a reviewed HR question set; books/cancels a test appointment and verifies the email and admin log. Content production and provider subscriptions remain client deliverables.

## Gate 4 — operations, UAT and release (D12/D13 and approved additions)

- Complete role-scoped admin management; real analytics; audit records; admin visibility of failed jobs, sync freshness and AI spend.
- Retention, export/deletion and consent/notices; human review of consequential recruitment decisions; provider data-handling review.
- MFA recovery runbook; monitoring and alerting; backup/restore exercise; load and timeout checks; accessibility/mobile checks.
- No public/mock records, misleading placeholders, public private-file URLs or secrets in bundles/logs.
- Full staging suite passes with required authenticated cases enabled; UAT signed off; production deployment/rollback rehearsed.

Acceptance: signed UAT checklist, production secrets/origin/redirects verified, restored backup demonstrated, smoke tests and monitoring healthy after deployment. Product readiness is declared only here.

## Reporting rule

After each stage, report: implementation status; tests passed/failed/skipped; live evidence; user test needed; blockers; next stage. Work needing credentials is prepared for review before asking the user. Keep all completed source in GitHub at each verified checkpoint.

Owner reporting instruction: after every completed development checkpoint, report what changed, what was verified, what remains, and the approximate implementation percentage. Keep estimates explicitly separate from release acceptance; do not increase the estimate mechanically for each commit.
