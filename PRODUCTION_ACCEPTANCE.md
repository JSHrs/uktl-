# Production acceptance and page review — 20 October 2026

This review distinguishes code inspection, automated tests and authenticated live acceptance. It is not a production certification. AI-provider configuration and evaluation are outside this change.

## Implemented changes

- Business analytics: selectable 4/12/26-week activity window; current mandate, enquiry, booking, email and task-queue charts; ageing work and time-to-fill metrics; exact-count tables and links to operational workspaces. Current status counts are explicitly not historical funnels. Revenue/profit are not fabricated.
- Admin hierarchy: Business, Recruitment, Communications, Content, Operations. Collapsible mobile navigation, breadcrumbs, wrapping header actions and a wider analytics workspace. Candidate navigation has one Profile & settings entry.
- Private two-way conversation per linked candidate, with staff search, preserved failed-send drafts, idempotent retries, pagination and refresh. No automatic external email sends. Server authorization resolves candidate ownership independently of supplied candidate IDs; approved staff retain the existing candidate-access scope. Private table, RLS, backend-only grants and audit trigger.
- Service readiness display exposes only configuration presence and practical next steps, never credentials. Communications workflow points to the active source repository; enablement remains an explicit deployment setting.

## Page inventory (code inspected; authenticated live acceptance pending)

| Page | Usability/completeness finding and acceptance required |
| --- | --- |
| Candidate dashboard | Role-aware entry and next actions exist. Verify real onboarding progress, name and loading timings. |
| My CV/upload | Upload/processing/retry flows exist; private scanner required. Test upload, replacement, interrupted upload and recovery. |
| Profile/settings | Consolidated duplicate navigation. Verify edits, communication preferences, export and deletion request. |
| Job matches/discovery | Filters and evidence exist. Verify real eligibility/evidence data without changing AI configuration. |
| All jobs/job details | Verify expiry, availability, saved interests and empty results. |
| My interests/activity | Verify interest state persists and status updates match staff actions. |
| HR home/answer/history/library | Sources, review expiry and media exist. Verify captions, playback and error states using reviewed content. |
| Consultations | Availability, cancellation/rescheduling exist. Test two concurrent reservations, timezone boundaries and reminders. |
| Messages | Added two-way conversation; email history stays separate. Requires linked CV record. No attachments, typing indicators, push alerts or read receipts in this increment. |
| Admin overview | Entry point retained; validate totals and attention links against real records. |
| Admin analytics | Expanded operational charts and explicit measurement scope. No billing model or revenue ledger exists. |
| Admin candidates and candidate record | Search, profile, pipeline and outreach exist. Verify consultant versus admin permissions with separate approved identities. |
| Admin mandates list/create/edit | Posting, ranking and fulfilment exist. Verify end-to-end posting → interest → review → placement. |
| Admin CV processing | Retry/queue controls exist. Verify scanner outage, worker failure and recovery. |
| Admin messages | Added searchable linked candidates and private conversation. Polling rather than realtime delivery. |
| Admin consultations | Verify availability, blocked times, cancellation, rescheduling and delivery retries. |
| Admin enquiries | Review/status workflow exists. Verify status persistence and delivery separately. |
| Admin campaigns | Approval/scheduling/consent flows exist. Controlled sender-domain delivery tests required. |
| Admin topics/create/edit | Video, captions and poster upload, review and publication exist. Test actual storage and mobile playback. |
| Admin HR review | Retrieved/reviewed source lifecycle exists. Qualified content review remains a human release task. |
| Admin calendar | Google/Outlook connection flows exist. Verify credentials, revocation, busy-time sync and stale-calendar blocking. |
| Admin operations/privacy | Added service readiness. Existing queue, erasure, audit and retry views remain. Do not exercise destructive actions on real accounts during UAT. |
| Login/register/recovery/MFA/staff onboarding | Verify independent candidate/admin/consultant sessions, revoked access and direct URL guards. Signup intent grants no staff privileges. |

## Release gates still requiring live evidence

1. Approved test identities for candidate, consultant and admin, plus a separate staging backend. Never grant production privileges just to obtain screenshots.
2. Email sender verification, scanner deployment/signature monitoring, scheduler secret/enablement and calendar OAuth setup. Configuration presence alone is not successful execution. Inspect scheduled job run history and queue age.
3. Real video upload/publication/playback with captions and actual CV scan/processing. Use synthetic approved fixtures, not unapproved personal data.
4. Mobile/keyboard checks for all private screens, measured warm/cold login and page transitions, load and provider-failure testing. CI simulation tests do not certify authenticated production.
5. Restore a backup into a separate project; reconcile schema and object counts; verify private storage and account isolation. Rehearse rollback to a known-good deployment without dropping additive tables. Verify alert delivery to the owner's chosen monitoring destination.

No live email, calendar invitation, recruitment message or destructive restore is authorized by the code tests. No backup-restore result or latency improvement is claimed without measurements.
