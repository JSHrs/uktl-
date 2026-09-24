# Astra — pick-up instructions (24 September 2026)

**Read this first.** It covers what is waiting, how to land it, what to configure, and what must stay true. Delete this file in the commit that lands the work (step 3).

## Where things stand

- **Source of truth:** `devacnt/UKTL` `main`, currently `f4b1c1a` (your production-hardening merge). `JSHrs/uktl-` `main` is identical.
- **Waiting for you:** branch `claude/cv-parsing-dashboard-design-MlDEc` on `JSHrs/uktl-`. It is **two commits directly on top of `f4b1c1a`**: the feature commit `338123e` and the commit that adds this file. It fast-forwards; no merge is needed.
- Nothing has been pushed to `main` in either repo. The owner asked that you land it.

## What the owner asked for

> Build a native calendar that works like Calendly. Allow uploading from the admin site and work out the right formats. Build the charts, CSV export and candidate email outreach. Allow editing or adding FAQs in admin.

All six items are built, and each is tested against real PostgreSQL and Supabase Storage.

## Step 1 — bring it into devacnt

```bash
cd UKTL                        # devacnt/UKTL checkout, on main, clean
git fetch origin && git status # main == origin/main == f4b1c1a
git fetch https://github.com/JSHrs/uktl-.git claude/cv-parsing-dashboard-design-MlDEc
git merge --ff-only FETCH_HEAD
```

If `--ff-only` refuses, you have pushed after `f4b1c1a`. Run `git merge FETCH_HEAD`, keep your newer logic, and re-run step 2.

## Step 2 — verify before pushing

```bash
npm ci
npm run test:unit            # 84/84
npx tsc --noEmit             # 0 errors
npm run build                # exit 0
npm run test:e2e             # locally 36 passed, 14 skipped (skips need staging credentials)
supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,mailpit,realtime,postgres-meta
# every supabase/tests/*.sql and scripts/test-*-postgres.ts passes on a fresh replay; the media test needs:
eval "$(supabase status -o env)"; TEST_SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" node scripts/test-media-postgres.ts
```

CI changes: the `postgres-policies` job now runs `supabase start` without unused services, instead of `db start`, because the media test needs the Storage API. It also runs two new scripts, `test-media-postgres.ts` and `test-admin-tools-postgres.ts`.

## Step 3 — land, migrate, push both

```bash
git rm ASTRA_PICKUP.md && git commit -m "Remove pick-up instructions after landing the calendar/media/outreach work"
git push origin main
git push https://github.com/JSHrs/uktl-.git main
```

**Database:** one new append-only migration, `supabase/migrations/20260924122319_native_calendar_media_outreach.sql`, created with `supabase migration new`.
- Apply it to staging first: `supabase db push --dry-run`, then push.
- Reconcile the remote timestamp as usual.
- It changes no applied SQL. It replaces the `invalidate_faq_review()` function body through `CREATE OR REPLACE` and updates the `uktl-videos` bucket's allowed MIME types.

## What changed

### 1. Native consultation calendar (Calendly removed)

**Staff side: Admin → Consultations (`/admin/bookings`)**
- Weekly opening hours in UK time.
- Booking rules: appointment length (15/20/30/45/60/90 min), gap between appointments, minimum notice, days ahead, daily maximum and location text.
- Closures (holidays, leave).
- Upcoming appointments grouped by day, with cancel and `.ics`.
- The email outbox with retry.
- Earlier request-style bookings are listed separately.
- **No hours are seeded**, so the calendar is closed until staff set them. This is deliberate, so no availability is invented for the firm.

**Candidate side: `/app/consultations`** (new menu item), also embedded on the HR answer page.
- Pick a day, pick a time, confirm name, phone, topic and notes.
- Reschedule or cancel, and download `.ics`.
- At most two upcoming appointments per candidate.

**Integrity**
- `generateSlots()` is pure and unit-tested across both DST changes.
- `recruitment.reserve_consultation()` re-checks buffers, closures, the daily limit and the per-candidate limit under `pg_advisory_xact_lock`.
- Reschedule is atomic: if the new time fails, the original booking is kept.
- An exclusion constraint (`native_booking_no_overlap`) makes double-booking impossible even for direct SQL.
- `/api/consultations/:id` returns 404 to anyone who is not the owner or staff.

**Emails**
- Every confirmation, reschedule and cancellation writes a `booking_events` outbox row.
- That row sends the candidate an email with a `.ics` attachment and sends the team inbox an email with Reply-To set to the candidate.
- Resend idempotency keys are stable per event.
- `sendNotificationEmail` now accepts `to` and `attachments`. It defaults to the firm inbox, so existing callers are unchanged.

**Removed**
- `server/calendly.ts`, `/api/calendly-webhook`, the embed, and `CALENDLY_*` in env, `wrangler.toml`, `staging.yml`, `prepare-staging.mjs` and its tests.
- The `booking_intents`/`booking_events` tables and the Calendly columns stay as history. Analytics still counts legacy verified bookings.

**Candidate identity:** the booking email is the server-verified session email, never form input.

### 2. FAQ add/edit with written answers and media upload

`/admin/faq/new` creates a topic and then opens its page. `/admin/faq/:id` now has:
- **Written answer** (new `answer` column, 20,000 characters). The HR library and topic page render it, so topics no longer need a video.
- **Media and approval panel.** The browser uploads straight to the private `uktl-videos` bucket with a signed upload URL (the Worker never buffers 100 MB). Progress is shown, and files can be replaced or removed. The previous object is deleted when a file is replaced.

**Accepted formats** (`server/media.ts`):

| Kind | Formats | Limit | Why |
| --- | --- | --- | --- |
| Video | MP4 (H.264 + AAC) preferred, WebM | 100 MB (bucket limit) | Plays natively in every current browser; no transcoding service needed |
| Captions | WebVTT `.vtt` | 1 MB | The only browser-native caption format; required with any video (WCAG 2.2 AA 1.2.2). SRT must be converted |
| Poster | JPEG, PNG, WebP | 5 MB, 16:9 (1280×720) | Card and video poster |

**Verification:** before a file is referenced, `attachMedia` checks the storage object's size, its MIME type against the key's extension, and its leading bytes. For example, `ftyp` for MP4, `WEBVTT` for captions, and `RIFF…WEBP` for WebP. A rejected upload is deleted.

**Approval**
- "I have reviewed this topic — approve" requires a written answer, or a video with captions and a transcript.
- The `invalidate_faq_review` trigger now also covers answer, transcript and media. Any edit withdraws approval unless that same statement is the approval.
- `/admin/hr`'s manual "enter storage keys" form is replaced with a list linking to each topic.

**Library:** `publicVideoTopicsFn` returns approved topics with written answers and with videos. Posters are served through short-lived signed URLs.

### 3. Analytics charts

`/admin/analytics` adds four Recharts charts:
- Weekly CVs, HR questions and consultations over the last 12 weeks (Monday-aligned UTC weeks).
- CV score distribution.
- Pipeline by stage.
- CV processing status.

Colours are read from the design tokens at runtime and follow light/dark changes. Empty data shows an empty state, never sample numbers.

### 4. CSV export

- Route: `/api/admin/export/{candidates|pipeline|enquiries|bookings}`, with `?job=` for one mandate.
- Links appear on Analytics, Candidates, Enquiries, Consultations and the mandate page. They are admin-only; consultants never see them.
- Server-enforced admin + MFA, a new `dataExport` rate limit (30/h), and a 404 for anyone else.
- Every cell is quoted, and cells that start with `= + - @` (or tab/CR) are prefixed with `'` so spreadsheets treat them as text.
- Each export inserts an `audit_events` row (`action='export'`) **in the same transaction as the read**.

### 5. Candidate email outreach

- "Email candidate" on the staff candidate view (`/app/candidates/:id`). Available to admins and consultants.
- Templates: introduce a role, invite to interview, follow up, not progressing, write your own. They fill from the candidate and a matched mandate, and staff edit before sending.
- **Recipient:** the verified Supabase account email if one exists, otherwise the CV email. The panel shows which one is used.
- Replies go to the sending staff member's email.
- A fixed footer explains why the candidate is receiving the email.
- Logged in `candidate_messages` with status, and shown as history on the record.
- One Resend idempotency key per message.
- An identical message within 10 minutes is refused, so a double-click sends once.
- Rate limit: `candidateOutreach` 60/h per staff user.
- Candidate erasure cascades the log.

## Configuration before UAT

- **Resend:** verify `uktalentlink.co.uk` as the sender domain. Candidate-facing mail now goes to real candidate addresses, so staging must use test inboxes only.
- **Supabase Storage:** confirm the bucket's file size limit and MIME list after the migration. The project-level upload limit must be at least 100 MB (Dashboard → Storage → Settings) or large videos will be refused.
- **Admin → Consultations:** set real opening hours and location text. The location defaults to "Video call. Your consultant emails the joining link before the appointment." Change it if that is not how the firm works.
- **Staging secrets:** remove the unused `CALENDLY_*` GitHub/Cloudflare vars and secrets once this is live.
- `STAGE_3_UAT.md` has updated live checks for booking races, reschedule, `.ics`, uploads, exports and outreach.

## What must stay true

- There are only candidates and firm staff. No employer or client logins, and no employer-facing copy.
- Everything under `/app` requires sign-in. Every new handler authenticates itself (`requireViewer`, `requireStaff` or `requireAdmin`), and the export route checks `viewer.isAdmin` itself.
- Colours come from tokens and work in light and dark. No fabricated records: calendar hours, charts and exports all start empty.
- The calendar, media upload, outreach and exports are **Supabase-only**. On the legacy D1 backend they throw a clear "requires the Supabase backend" error.

## Not built (still open)

- Staff Google/Outlook calendar sync.
- Video-call link generation.
- Bulk or scheduled email campaigns.
- Candidate-visible message history.
- Reminder emails before appointments (this needs a scheduled worker; the outbox pattern supports it).
- Browser screenshots of the signed-in screens. The dev server has no Supabase session, so check those screens in staging UAT.
