# UKTL development roadmap
Updated: 17 September 2026.

## Delivery rules
Work directly through GitHub feature branches and PRs. Do not send Lovable AI build requests. Keep existing data intact; identify the actual backend before provisioning or migrating. Completed code is not the same as production verification. At the end of each working session report completed, verified, remaining, blocked and next steps, with PR/test evidence.

## Confirmed baseline
- [x] PR #8 merged: authentication/session repairs, durable request limits, notification status/retries, explicit grading failures and corrected Reed counters.
- [x] PR #8 CI passed (run 35203159878).
- [x] Reviewed main HANDOVER.md and local CLAUDE.md and deployment configuration.
- [ ] Run real database-backed acceptance; prior report records 14 unit and 18 browser passes with 14 staging-dependent skips.
- [ ] Reconcile backend ownership: the Lovable database-status API returned enabled=false on 17 September for project b976b2a4-fea6-43dc-a8da-72d7238985c7. User reports an existing Lovable Cloud database. Locate the correct project/backend; do not infer data loss or provision a replacement.
- [ ] Verify deployed state. Repository describes Workers + D1 recruitment data + R2 CVs + Supabase Auth, with placeholder environment values. No live database audit has been completed.

## Feature priorities
1. Consultant work queue: next actions, overdue follow-ups, candidate/mandate notes and searchable activity history.
2. Client portal: organisation membership, assigned mandates, anonymised shortlists, shared feedback and interview requests; explicit consent before identity disclosure.
3. Candidate journey: profile corrections, CV versions, saved jobs, explicit apply/withdraw, application tracking and password recovery.
4. Explainable matching: evidence and gaps per requirement, unknown data shown explicitly, versioned scoring, consultant overrides and evaluation against reviewed examples. A match score is not a probability of hiring; no automatic rejection.
5. Reliability: background CV processing, progress/retry states, idempotent jobs, email delivery visibility and scheduled job expiry.
6. Outcome analytics: pipeline conversion, time in stage, source quality, placement outcomes, service demand and processing costs.
7. HR enquiry triage: source/date visibility, clear scope and consultant escalation; treat uploaded CVs and retrieved content as untrusted input.
8. Accessibility/mobile improvements, targeted alerts and consent-aware outreach after core journeys are reliable.

## Staged checklist and effort
Estimates are active engineering days, sequential, excluding waits for access, provider setup or acceptance. Pilot target is 5–9 days remaining; expanded scope is roughly 4–6 working weeks. Re-estimate after Stage 1. Earlier 3–5-day pilot estimate assumed infrastructure access already resolved.

### Stage 1 — Backend reconciliation and schema review (0.5–1 day)
- [ ] Identify the existing Lovable Cloud database/project, deployment host and owner.
- [ ] Inventory schema, migration history, grants, RLS, storage policies and auth configuration without reading unnecessary candidate data.
- [ ] Map runtime reads/writes and establish one authoritative store per entity.
- [ ] Review foreign keys, uniqueness, status constraints, indexes, timestamps and duplicate records.
- [ ] Record an architecture decision: retain the split backend or propose consolidation only if evidence justifies it.
Gate: documented live topology and reviewed schema; no accidental duplicate infrastructure.

### Stage 2 — Security and operational foundations (1.5–3 days)
- [ ] Configure isolated staging with synthetic data, secure secrets and correct auth redirects.
- [ ] Replace shared admin access with named accounts, role permissions and privileged-user MFA.
- [ ] Verify candidate ownership and organisation/mandate isolation in every relevant handler and data policy.
- [ ] Add protected audit events; review upload validation, size limits, file scanning/quarantine, CSRF/origin checks and AI input isolation.
- [ ] Configure redacted error monitoring, health checks, provider limits and cost alerts.
- [ ] Verify backups and perform a restore rehearsal; document rollback and recovery objectives.
- [ ] Validate dependency/secret scanning and required CI checks.
Gate: isolation tests, recovery evidence and no unresolved critical/high launch findings.

### Stage 3 — Pilot integration and acceptance (3–5 days)
- [ ] Verify registration, verification email, login, refresh, recovery and logout.
- [ ] Verify upload → store → extract → grade → match → consultant review → authorised download.
- [ ] Test malformed uploads, provider failures, retries, duplicate requests and data outages.
- [ ] Verify actual sender delivery and safe retries.
- [ ] Implement and verify essential candidate consent, export, deletion and retention handling across all stores.
- [ ] Run database-backed browser tests with no unexplained critical-journey skips.
- [ ] Verify mobile/accessibility, production configuration, rollback and owner acceptance.
Gate: controlled pilot; green CI alone is insufficient.

### Stage 4 — Consultant and candidate workflows (4–6 days)
- [ ] Consultant work queue, notes, tasks and activity history.
- [ ] Candidate profile editing, CV version history and application/withdrawal status.
- [ ] Saved jobs, duplicate handling and improved search/filtering.
- [ ] Explicit processing states and safe background retries.
Gate: complete candidate-to-consultant workflow with permission tests.

### Stage 5 — Client collaboration (4–6 days)
- [ ] Organisations, memberships, invitations and mandate assignments.
- [ ] Anonymised shortlists with private/shared note separation.
- [ ] Feedback, interview requests and controlled identity disclosure.
- [ ] Cross-client access tests and revocation verification.
Gate: a client can review only authorised mandates and candidates.

### Stage 6 — Intelligence, automation and reporting (4–6 days)
- [ ] Explainable, versioned matching and consultant override history.
- [ ] Evaluation set for extraction/matching quality, error analysis and regression thresholds.
- [ ] Scheduled Reed sync/expiry, deduplication and operational cleanup.
- [ ] Opt-in alerts/outreach with preferences and delivery history.
- [ ] Pipeline/source analytics and permission-controlled exports.
Gate: measured quality and reliable automation.

### Stage 7 — Broader release QA (2–3 days)
- [ ] End-to-end regression, load/security checks and accessibility fixes.
- [ ] Onboarding, operational runbooks, cost review and owner acceptance.
- [ ] Deploy with monitoring and rollback readiness.
Gate: broader release accepted; no claim of absolute security.

## Database design targets
Extend the actual schema after inventory; these are target entities, not claims of implemented tables:
- Identity/tenancy: users/profiles, organisations, memberships, role assignments.
- Recruitment: candidates, CV versions, skills, experience, education, mandates, applications, matches.
- Collaboration: shortlists/items, notes with visibility, tasks, interviews, stage history.
- Operations: processing jobs, notification deliveries, immutable audit events, consent/retention records.
Use foreign keys within a database; for cross-store references use validated IDs plus reconciliation and retryable workflows. Keep pipeline/application status independent from AI scores. Use uniqueness for provider jobs and intended candidate–mandate relationships; indexes for ownership, stage, dates and queue lookups. Restrict private files and analytics views. Limit personal data in logs. Define deletion across DB, object storage and auth, including backup retention.

## Session close — 17 September 2026
Completed: baseline/CI verified, backend discrepancy identified, priorities and gated roadmap recorded.
Remaining: Stage 1 live database identification and all unchecked delivery work.
Blocked: actual existing database project/reference and infrastructure configuration are not established.
No application code, live schema or deployment changed in this planning update.
