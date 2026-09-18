# Stage 3 — HR, video and consultation acceptance

Status: implementation under automated verification; **live acceptance OPEN**. Do not use real employee cases or candidate records until staging isolation, Auth redirects, email recovery and staff MFA checks pass. No provider subscription, secret setup, content approval or deployment is implied by a successful build.

## Operator setup (not performed automatically)

1. Apply the reviewed migrations to an isolated staging Supabase project. Use the staging deployment preflight; never point staging at UKTL production data.
2. Configure server-only `ANTHROPIC_API_KEY` and optional `PARSE_MODEL`. HR AI selects verbatim excerpts from approved sources; it does not generate bespoke legal advice. Configure provider data handling and approve the disclosure before live use.
3. In `/admin/hr`, retrieve exact HTTPS `www.acas.org.uk` pages by category. A qualified reviewer checks the extracted text against the original and explicitly approves its hash. Re-retrieval withdraws approval. Both retrieval and review must be within 30 days; this freshness rule is not a guarantee of legal currency. Withdraw changed guidance promptly.
4. Upload approved MP4/WebM video and VTT captions using the Storage API/dashboard to the private `uktl-videos` bucket under `videos/`. Approve keys plus a transcript in `/admin/hr`, then publish the topic in FAQ Topics. Check video, captions and transcript agree. Editing title/category/keywords/sector invalidates review. No placeholder video counts as acceptance.
5. Configure `CALENDLY_URL` as one exact `https://calendly.com/account/event` URL; set server-only `CALENDLY_API_TOKEN`, `CALENDLY_WEBHOOK_SECRET`, and exact `CALENDLY_EVENT_TYPE_URI`. The owner must have a plan/account permitting the required API/webhook features. Subscribe `invitee.created` and `invitee.canceled` to `https://<staging-origin>/api/calendly-webhook`, with the same signing secret. Use separate staging credentials/events.
6. Configure Resend and verify the existing sender/recipient configuration before enabling notifications. UKTL sends an internal event notification; Calendly owns invitee appointment emails. Missing Resend records `skipped`, not successful delivery. Do not test against real recipients without authorization.

Provider contract references: [Calendly webhook signatures](https://developer.calendly.com/api-docs/overview/webhooks/webhook-signatures), [webhooks](https://developer.calendly.com/api-docs/overview/examples/webhooks), [invitee API](https://developer.calendly.com/api-docs/calendly-api/scheduled-events/get-event-invitee). Confirm current provider behavior in staging, especially tracking retention across rescheduling.

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
| Real consultation | Explicit click loads Calendly; no HR text or email in embed URL. Book with signed-in email. Only a signed webhook plus an API-verified record creates a confirmed appointment with actual times. Browser messages cannot confirm it. |
| Duplicate / cancellation / reschedule | Duplicate webhook creates no duplicate row/email. Cancellation updates state; older active response cannot resurrect it. Reschedule records new appointment and predecessor. Verify actual provider tracking; missing/mismatched tracking remains unlinked for manual staff reconciliation, never guessed from email. |
| Email failure / retry | Booking persists independently. One durable outbox event per provider state; failed/skipped retries within 23 hours use the same idempotency key. `sending` and older records require provider-log reconciliation; do not blindly reset them. |
| Analytics | Saved AI-response count is not estimated from resolution; distinct questions with currently confirmed linked bookings form conversion numerator. Pending requests, cancellations and unlinked appointments do not inflate conversion. |

## Known acceptance dependencies

- Reviewed videos, captions, transcripts, ACAS pages, HR question evaluation set and qualified content sign-off are owner deliverables. Automated quote checks cannot establish legal relevance or completeness.
- Real Cloudflare staging deployment, configured Supabase Auth/SMTP/MFA, Calendly subscription/webhook, Resend, and end-to-end test identities are still required.
- Retention/deletion policy, backup/restore, load/security/accessibility acceptance and dependency advisory resolution remain Stage 4 release gates.
- No live appointment, email delivery, AI-provider result or deployed isolation is claimed by synthetic test fixtures.

Record tester, date, staging URL, commit, provider event IDs (not secrets), expected/actual results and defects for every live row before accepting Stage 3.
