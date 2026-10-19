# UKTL current state and development sequence — 19 October 2026

## Verified baseline

Production project: Vercel `uktl` (`prj_QcwQ7tH5nJH9VshPN0izjOfPlg69`). Production deployment `dpl_3HqDadhRDsr5jUvZcuk6Hsdyjv9J` is READY, built from `JSHrs/uktl-` commit `1323368ffb2d3e3e314e1766cdf2f2bed80f93aa`. The similarly named `devacnt/UKTL` is not this deployment's source. Vercel's authenticated fetch returned HTTP 200 for `/simulation`.

The repository implements candidate CV processing, profile/assessment/history, matching and interests, HR content, consultations/messages, and staff recruitment/operations workspaces. This is a substantial implementation with live acceptance outstanding, not a production-readiness certification. No defensible new completion percentage can be calculated from this review.

## Findings and changes

- Staff-labelled registration creates an ordinary account and previously redirected everyone to `/app`. It does not approve staff membership. Registration now respects existing verified roles and sends unapproved staff-intent users to a clear approval screen with an access recheck. MFA and server-side role checks remain mandatory. No named account has been elevated.
- Session and viewer resolution created separate authenticated clients for sequential staff/account-role reads. They now share one client and run the independent role reads concurrently. Admin navigation reuses the root's verified session instead of making an additional staff-session round trip. No cross-user or persistent authorization cache was introduced. Root role-service failures now surface as errors instead of silently looking like signed-out users. Pending navigation receives visible feedback.
- The decorative Fraunces display family was replaced with Geist for clearer, consistent text. A screenshot comparison is still required before accepting the visual result.
- Candidate preview now opens with completed setup and assessment. Onboarding can be replayed. Job cards expand to evidence, gaps and reversible local interest actions. Admin mock actions expose editable result previews and session activity; analytics can open candidate outcomes, and queue/booking attention labels reflect local actions.
- Previews remain fictional, browser-memory-only; no recruitment API call, invitation, email or real application is made by these actions. Video content remains explicitly a placeholder, not a playable final media asset.
- Existing `npm ci` failed because package.json and package-lock.json disagree, including Lovable config and TanStack versions.

## Identity and backend limitation

The repo config points to Supabase `jwfycrmrgwslxyxvirfn`. The connected Supabase tool exposes UKTL `fvkffdeindboirukscfq`. They must not be treated as interchangeable or changed speculatively. The deployed server environment and the membership of `jessejnode85@gmail.com` have not been verified. Need the correct project's access to inspect the existing identity and approved membership; no password reset or privilege change is necessary for the code fix.

## Next development stages

1. **Account correctness and performance acceptance:** connect the deployed backend; verify the named user's intended candidate/consultant/admin role; complete approved membership + MFA onboarding; cover login, refresh, logout, recovery and direct URL guards. Measure cold/warm sign-in and p50/p95 page transitions, including role-service failures. Check Vercel region against the actual database before relocating anything.
2. **Complete candidate journeys:** verify real CV upload, scan, processing retries, editing/rematching, saved interests, consultation booking/cancellation and message ownership. Preserve drafts and show actionable loading/error states. Replace all preview video placeholders with reviewed, captioned media.
3. **Complete staff operations:** implement audited staff membership/invitation management, role-appropriate dashboards and consultant workflow permissions; verify mandate ranking/placement, outreach previews and delivery outcomes, calendar sync and operational retries. Preview invitation controls are not proof that a real invitation flow exists.
4. **Release acceptance:** reproducible dependency lockfile and CI; authenticated browser tests for candidate/admin/consultant and revoked membership; mobile/accessibility checks; provider failure/load tests; reviewed matching quality; backups, monitoring and rollback evidence. Only promote after these gates pass.

## Validation

Nine dependency-free account-routing and existing simulation tests passed. Added browser regression scenarios for completed onboarding, expanded match/interest actions and editable admin results. Full build, type checking, browser execution and live account testing must be reported separately; source inspection and HTTP 200 alone do not prove them.
