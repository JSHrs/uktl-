# Stage 3 — HR, video and consultation acceptance

Status: implementation passed [CI 35397232760](https://github.com/devacnt/UKTL/actions/runs/35397232760) at `1603ab58`; **live acceptance OPEN**. Current UKTL schema migration `20260918212609` is applied, but no staging deployment or real provider journey was verified. Do not use real employee cases or candidate records until staging isolation, Auth redirects, email recovery and staff MFA checks pass. No provider subscription, secret setup, content approval or deployment is implied by a successful build.

## Operator setup (not performed automatically)

1. Apply the reviewed migrations to an isolated staging Supabase project. Use the staging deployment preflight; never point staging at UKTL production data.
2. Configure server-only `ANTHROPIC_API_KEY` and optional `PARSE_MODEL`. HR AI selects verbatim excerpts from approved sources; it does not generate bespoke legal advice. Configure provider data handling and approve the disclosure before live use.
3. In `/admin/hr`, retrieve exact HTTPS `www.acas.org.uk` pages by category. A qualified reviewer checks the extracted text against the original and explicitly approves its hash. Re-retrieval withdraws approval. Both retrieval and review must be within 30 days; this freshness rule is not a guarantee of legal currency. Withdraw changed guidance promptly.
4. In Admin → FAQ Topics, add or edit a topic: write the answer, then upload video (MP4 H.264/AAC preferred, or WebM; ≤100 MB), WebVTT captions (≤1 MB) and an optional JPEG/PNG/WebP poster (≤5 MB) straight to the private `uktl-videos` bucket. The server verifies size, declared type and leading bytes before attaching a file. Enter the reviewed transcript and approve. Candidates see a topic only when published and approved; editing the title, answer, keywords, sector, transcript or any media withdraws approval. No placeholder video counts as acceptance.
5. In Admin → Consultations set weekly opening hours (UK time), appointment length, gap between appointments, minimum notice, booking horizon, daily maximum, location text and any closures. No hours are seeded; the calendar stays closed until staff set them. Calendly has been removed.
6. Configure Resend and verify the sender domain before enabling notifications. Each booking, reschedule and cancellation emails the candidate (with a `.ics` invite) and the team inbox. Missing Resend records `skipped`, not successful delivery. Do not test against real recipients without authorization.

## Required live checks

| Journey | Expected evidence |
| --- | --- |
| Signed-in user A submits a question | Question persists; URL contains only opaque ID, not question/context/email. Refresh restores the record. History pagination has no duplicates. |
| User B opens A's question ID or booking intent | Denied; no question, context, answer or appointment details returned. Consultant cannot access admin source review without admin + MFA. |
| FAQ match, alternatives, no match | Whole-token match; low confidence is labelled; chosen topic persists. Unknown questions do not produce fabricated videos. Exact library links open the intended reviewed published topic. |
| Video resolved / partly / not resolved | Outcome persists with revision check; a stale tab cannot overwrite it. Anonymous page loads do not count as plays. Signed-in play counts at most once per topic per UTC day. |
| Captions and transcript | Actual private video plays, captions toggle, transcript readable; expired signed URL can be renewed. Unpublished/unreviewed topic cannot obtain a new playback URL. Previously issued links expire after 15 minutes. |
| Reviewed-source response | Every excerpt is a literal substring of an approved source and links to it with retrieval/review dates. No relevant source returns uncertainty; malformed/invented excerpts are rejected. Human reviewer checks relevance and context. |
| Source withdrawn/changed/aged | No new answer can save from withdrawn/changed/stale sources. Saved historical answers retain their original dates and are not presented as current legal advice. |
| Real consultation | Signed-in candidate sees only open slots in UK time; booking confirms immediately to their verified email with an `.ics`; the team inbox gets the details. Slots honour notice, horizon, closures, buffers and the daily maximum across a clock change. |
| Double booking / cancellation / reschedule | Two candidates racing for one slot: exactly one succeeds (database lock + exclusion constraint). A candidate holds at most two upcoming appointments. Reschedule is atomic: a failed new time leaves the original booked. Candidate or staff cancellation emails both sides; a cancelled slot reopens. Another user's appointment and `.ics` return 404. |
| Email failure / retry | Booking persists independently. One outbox event per confirmation/cancellation; failed/skipped retries within 23 hours use the same idempotency keys. `sending` and older records require provider-log reconciliation; do not blindly reset them. |
| Analytics | Saved AI-response count is not estimated from resolution; distinct questions with a currently confirmed linked appointment form the conversion numerator. Cancellations do not inflate conversion. Weekly charts, CV score distribution and pipeline stages match the underlying records. |
| CSV export / outreach | Only admins with MFA can download CSVs; each download appears in `audit_events`; formula-like cells open as text in Excel. Staff emails go to the verified account email (else the CV email), are logged on the candidate record, and a double submit sends once. |

## Known acceptance dependencies

- Reviewed videos, captions, transcripts, ACAS pages, HR question evaluation set and qualified content sign-off are owner deliverables. Automated quote checks cannot establish legal relevance or completeness.
- Real Cloudflare staging deployment, configured Supabase Auth/SMTP/MFA, Calendly subscription/webhook, Resend, and end-to-end test identities are still required.
- Retention/deletion policy, backup/restore, load/security/accessibility acceptance and dependency advisory resolution remain Stage 4 release gates.
- No live appointment, email delivery, AI-provider result or deployed isolation is claimed by synthetic test fixtures.

Record tester, date, staging URL, commit, provider event IDs (not secrets), expected/actual results and defects for every live row before accepting Stage 3.
