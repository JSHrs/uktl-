# Stage 2/3 acceptance review — 20 September 2026

**Decision: BLOCKED. Neither stage is accepted; Stage 4 has not been advanced under the owner's instruction to finish acceptance first.** Implementation remains approximately 75% overall. This estimate is not a release-readiness score.

## Fresh evidence

- GitHub `main` was unchanged at `a82a25a7482ace7ef61dfaea3b0b7607ac24a466` when reviewed. Latest verified implementation remains `1603ab58`, [CI 35397232760](https://github.com/devacnt/UKTL/actions/runs/35397232760): 58 unit and 28 browser checks, TypeScript/build and PostgreSQL suites passed; 14 credential-dependent cases skipped.
- GitHub's workflow-dispatch run query returned no runs. Latest scheduled CV worker runs are skipped, not successful live processing. The connector rejected the workflow-list/deployment-list endpoints; this is not evidence that no deployment exists anywhere. No staging URL or successful staging deployment is verified in this review.
- The authorized Supabase connection exposes one project, current UKTL `fvkffdeindboirukscfq`, ACTIVE_HEALTHY. No separate staging project is visible through that connection. Ten migrations are recorded. Database security advisor: no findings.
- Aggregate-only queries on current UKTL found **0 approved HR sources, 0 reviewed published videos, 0 video objects and 0 provider-verified bookings**. These are current-database observations, not a search of other accounts or proof of missing provider subscriptions. No personal records or secrets were retrieved.

## Acceptance blockers and evidence required

| Gate | What remains | Required evidence / responsibility |
| --- | --- | --- |
| Shared staging and identity prerequisites | Isolated Supabase and Cloudflare runtime; runtime variables/secrets; Auth redirects, confirmation/recovery email, named staff MFA and candidate/consultant isolation | Owner supplies/authorizes the intended staging connections and test identities. Run STAGE_1_UAT.md and required authenticated tests with zero skips. Do not use production candidate records. |
| Stage 2 processing and vacancy sync | Real upload/edit/retry/match/interest journeys and Reed coverage, repeat sync, expiry and interruption recovery | Engineering executes against configured staging using synthetic or approved anonymized CVs. Provider fixtures alone do not pass this gate. |
| Stage 2 reviewed matching | Two Construction and two Technology examples, agreed expected outcomes, evidence relevance and unknown handling | Owner/domain reviewer approves the rubric and expected results; engineering runs and records the comparison. Automated quote presence is insufficient. |
| Stage 2 file lifecycle | Retention/recovery policy, malware strategy and safe orphan cleanup implementation/testing | Owner decides retention and recovery requirements and approves the malware approach; engineering implements reference/lease rechecks, recoverability and audit evidence before deletion. Read-only inspection is already implemented. |
| Stage 3 reviewed content | Approved videos, VTT captions/transcripts, ACAS sources and HR evaluation set | Owner/qualified reviewer supplies and signs off content; engineering verifies playback, accessibility, source withdrawal/freshness and private history. No content is auto-approved. |
| Stage 3 provider journeys | Verified booking, duplicate event handling, cancellation/reschedule and delivery outcomes | Configured staging Calendly event/webhook and Resend; authorized test recipients. Record actual provider event IDs and results. Do not send to third parties merely to manufacture acceptance evidence. |

## Staging configuration defect repaired in this review

The staging workflow previously supplied only `CALENDLY_URL`; it omitted the API token, webhook signing secret and event-type URI required by the implemented verifier. The deployment builder now passes those settings, keeps the token/signing secret server-only and excludes browser-test credentials. Acceptance preflight requires all integration settings and validates Calendly URLs plus the maintenance-secret length. Missing configuration fails before deployment. Configuration presence does not prove valid credentials or successful provider behavior.

Local validation: 60 unit tests passed, including missing-provider rejection, secret separation and exclusion of test credentials. Final CI evidence is recorded in PROGRESS_REPORT.md. No workflow was dispatched and no application was deployed.

## Remaining path to production after Stage 2/3 acceptance

1. **Stage 4 implementation/hardening:** complete scoped admin/audit coverage, AI cost visibility, privacy export/deletion/retention and notices, dependency advisory remediation, and operational monitoring/alerts.
2. **Operational validation:** demonstrate backup restoration, MFA recovery and deployment rollback; test load/timeouts, mobile/keyboard/accessibility and full role-scoped journeys.
3. **Owner release approval:** sign off reviewed content/scoring, provider data handling and full UAT. Confirm production domain, runtime configuration, Auth redirects/SMTP, staff MFA and candidate/consultant isolation.
4. **Deferred synchronization:** identify and authorize the previous Lovable Supabase at development end, compare its existing schema and reconcile it safely. Do not overwrite it or assume it matches current UKTL.
5. **Production deployment:** deploy the accepted revision, run production smoke checks with authorized test data, verify monitoring and retain rollback evidence. No production-ready declaration before these pass.

Last recorded dependency audit (18 September, not rerun here): 0 critical, 11 high, 6 moderate, 2 low findings; these still require review/remediation. A clean Supabase database advisor does not clear application dependencies.
