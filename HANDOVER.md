# UK Talent Link — handover

**As of 21 November 2026.** This replaces the September handover note (still in git history at commit `eb50024`, together with the stage documents listed in §9).

**Status in one line:** the product is built and wired for candidates, employers and staff, and its automated tests pass; it is **not live and not production-ready**. The site is unpublished, CV scoring is not switched on, and live end-to-end acceptance on the current code has not been run.

Read in this order: this note → `CLAUDE.md` (developer rules, architecture, auth model) → `DEPLOYMENT.md` (hosting and settings) → `OPERATIONS_RUNBOOK.md` (scanner, privacy, backups).

---

## 1. What exists

| Who | Where | What they can do |
|---|---|---|
| Visitors | `/`, `/services`, `/employers`, `/approach`, `/sectors`, `/reach`, `/contact`, `/privacy`, `/terms`, `/unsubscribe` | Public site with a Candidate / Employer switch. Landing page: two-door hero, annotated example CV, example shortlist that re-ranks live, enquiry form. Light and dark themes. |
| New users | `/onboarding?for=candidate\|employer` | Guided set-up. Step 1 creates the account (email, Google or Apple). Candidate: account → upload CV → score. Employer: account → company → hiring needs → first role → portal. |
| Candidates | `/app/*` | Dashboard, CV upload and history, score and tips, job matches (swipe), all jobs, interests, HR & employment-law guidance, consultation booking, messages, profile, data export/erasure requests, optional two-step verification. |
| Employers | `/employer/*` | Company details, post/edit/withdraw/close roles, see candidates a consultant shares (**anonymised**: alias, consultant summary, score, matched and missing skills — never names, contacts, CVs or ids), respond "I'd like to meet" / "Not for us", optional two-step verification. |
| Staff | `/admin/*`, `/app/candidates`, `/app/jobs` | Overview of what needs attention, mandates (rank, pipeline, fill, reopen), employer-role review (publish as mandate, share candidates), candidates, consultations and hours, enquiries, HR content, campaigns, calendar sync, analytics, CV processing, operations and privacy, CSV exports, settings. Admin vs consultant roles. |
| Sign-in | `/auth/login`, `/admin/login`, `/auth/two-step`, `/auth/forgot`, `/auth/reset`, `/auth/callback` | One Sign in / Create account toggle. Two-step verification is **optional for every account type** (owner decision, 1 November) and enforced at every sign-in once switched on. |

**Stack:** TanStack Start (React 19) · Tailwind v4 · hosted by Lovable (Cloudflare Workers runtime) · Supabase Postgres, Auth and Storage (project `UKTL`, ref `fvkffdeindboirukscfq`, eu-west-1) · Anthropic API (CV extraction and scoring) · Resend (email) · Reed.co.uk (job import).

**Repositories:** `devacnt/UKTL` was the stated source of truth; `JSHrs/uktl-` (also reachable as `JSHrs/talent-compass`) is the repository Lovable builds from (`main`). Recent work (PRs #26–#33) was merged into `JSHrs/uktl-` only. **Reconcile the two before further development** (see §6).

---

## 2. How to run, test and deploy

```bash
npm ci                                  # Node 24+
npx tsc --noEmit                        # must be 0 errors
npm run build                           # must pass
npm run test:unit                       # 111 tests
npm run dev                             # http://localhost:5173 (no data backend: empty states)
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium E2E_BASE_URL=http://127.0.0.1:5173 \
  npx playwright test --project=chromium
```

- **CI** (`.github/workflows/ci.yml`) runs on every PR: unit tests, typecheck, build, Playwright, and a `postgres-policies` job that replays every Supabase migration on an isolated database and runs the security and integration tests. Do not merge red.
- **Deploy:** Lovable builds `main` automatically into its preview. The public site `https://uktl.lovable.app` only changes when someone presses **Publish** in Lovable (project `b976b2a4-fea6-43dc-a8da-72d7238985c7`).
- **Database changes:** new files in `supabase/migrations/` only; CI replays them; apply to the live project, then rename the file to the version the live database records (see `CLAUDE.md` rule 5).

Last verified (21 November, PR #33): typecheck 0 errors, build passes, 111/111 unit tests, Playwright chromium 91 passed / 15 skipped (the skipped ones need staging credentials).

---

## 3. Settings and secrets (Lovable → project settings)

Full table and step-by-step in `DEPLOYMENT.md` "Hosting on Lovable". UKTL values use the `UKTL_` prefix because Lovable Cloud (an empty project `jwfycrmrgwslxyxvirfn`) occupies the plain names.

| Setting | Needed for | Status on 21 November |
|---|---|---|
| `UKTL_SUPABASE_URL`, `UKTL_SUPABASE_ANON_KEY`, `UKTL_SUPABASE_SERVICE_ROLE_KEY` | everything | Set (sign-up and sign-in worked in live tests on 11 November) |
| `SITE_URL` | email links, Google/Apple return | Check it is `https://uktl.lovable.app` or the final domain |
| `ANTHROPIC_API_KEY` | CV scoring | **Not set** — CV uploads are refused |
| `CV_SCAN_URL`, `CV_SCAN_TOKEN` | private malware scanning of every CV | **Not set** — CV uploads are refused. Gateway code is in `services/cv-scanner`; it must be deployed privately (`OPERATIONS_RUNBOOK.md`) |
| `RESEND_API_KEY` + verified sender domain | all email | Unconfirmed |
| `CRON_SECRET` | worker, maintenance, health endpoints | Unconfirmed |
| `REED_API_KEY` | job import | Unconfirmed; scheduling not activated (`REED_SYNC.md`) |
| Google / Apple credentials (in Supabase Auth) | social sign-in | **Not set** — buttons show "use email for now" |
| GitHub: variable `UKTL_MAINTENANCE_URL` (`https://<site>/api/maintenance`), secret `CRON_SECRET` (same value as the server), then variable `ENABLE_CV_WORKER=true` | scores queued CVs every five minutes (`.github/workflows/cv-processing.yml`) | **Off** — even with the API key, uploaded CVs are only queued until this worker runs (`STAGE_2_UAT.md`) |

Never put secrets in the repository, chat or a `VITE_` variable.

---

## 4. What is not finished

**Blocks real users**
1. **CV scoring is off.** Needs `ANTHROPIC_API_KEY`, the private scanner gateway (`CV_SCAN_URL`/`CV_SCAN_TOKEN`) and the CV worker schedule. Until then the upload step tells candidates uploads "aren't open yet".
2. **Not live.** The site was unpublished after testing on 11 November.
3. **No end-to-end test on the current code.** The 11 November live test passed for all three account types, but the onboarding, landing and dashboard changes merged since have only been tested locally and in CI. Run the script in §7 after publishing.
4. **Supabase plan.** The free plan paused the database twice. Move to a paid plan before launch.
5. **Legal text.** `/privacy` and `/terms` are factual product information, not a reviewed notice. They need controller identity, lawful bases, recipients, retention periods and complaint information approved by the owner's lawyer.
6. **No content.** At last check: 0 jobs, 0 HR guides, no consultation hours. Candidates would see empty pages.

**Should be done before launch**
- Turn on Supabase **leaked-password protection** (the only Supabase security-advisor warning).
- Google and Apple sign-in credentials.
- Verify the Resend sender domain and test real delivery.
- External uptime monitor on `/api/operations/health` (`OPERATIONS_RUNBOOK.md`).
- Backup restore and rollback rehearsal; real privacy-request fulfilment test.
- Confirm the company facts used on the site (addresses, phone, sector notes) and add any real figures or quotes the owner wants; none are invented.

**Known product gaps** (built in code, not activated or accepted): Reed scheduling, email campaigns, appointment reminders, Google/Outlook calendar sync. See `COMMUNICATIONS_RUNBOOK.md` and `REED_SYNC.md`.

---

## 5. Owner decisions on record (do not reverse without the owner)

| Date | Decision |
|---|---|
| 13 Oct | Three account types: candidate, employer (self-service), staff. |
| 1 Nov | Employer portal with **anonymised** shared candidates; identities only through a consultant with the candidate's agreement. |
| 1 Nov | Two-step verification optional for candidates, employers **and staff**; switched on in settings, never forced at sign-up. The advice that staff use it (they can see all candidate data) stands. |
| 1 Nov | No "I'm viewing as" bar; Google/Apple as logo buttons at the bottom; old "candidate preview" simulation deleted. |
| 11 Nov | Temporary bypass of scanner/API-key for CV uploads, for testing only — **reverted on 21 November (PR #33)**. |
| 13 Nov | New landing page; account creation as step 1 of onboarding. |
| Ongoing | No fabricated records, testimonials, statistics or legal terms anywhere. Illustrations are labelled "Example". |

---

## 6. Housekeeping for the next developer

- **Two repositories.** Bring `devacnt/UKTL` up to date with `JSHrs/uktl-` main (or retire one) before anyone else commits.
- **A live database change is missing from the repo:** `20261020120208_candidate_conversation_threads` (creates `recruitment.conversation_messages`). It was applied to the live database on 20 October from elsewhere. Copy it into `supabase/migrations/` with that exact version; do not re-create it.
- **Leftover test file in storage:** `cvs/cand_ed9e00abd2bb4d40a644/test-cv.txt` in the private `uktl-cvs` bucket (674 bytes, fictional content). Delete it in Supabase → Storage. All test accounts and records were removed on 11 November.
- **Network access for agents:** the Claude Code "Default" environment was given access to `uktl.lovable.app`, its Lovable preview and Google Fonts for live testing; a separate "talent-compass" environment was created and is unused. Remove either if no longer wanted.
- The Claude agent's Supabase connection was refused on 21 November ("no permission"); re-authorise it only if an agent should keep working on the database.
- `npm run lint` fails on ~250 formatting lines because the repo was never formatted with Prettier; format once in its own commit.

---

## 7. Live acceptance script (run after publishing)

Use clearly labelled test accounts (e.g. `uktl-test-…@example.com`) and delete them afterwards.

1. **Candidate:** Register free → onboarding step 1 → step 2 upload a CV → step 3 score → dashboard, every menu page, sign out and in, wrong password.
2. **Employer:** Start hiring → step 1 → company → needs → first role → portal shows the role "With UKTL for review".
3. **Staff:** `/admin/login` → overview shows the role to review → Employer roles → publish as mandate → share the candidate with a written summary.
4. **Employer again:** role shows "1 awaiting you"; the card says "Candidate A" with no name, email, file name or id anywhere in the page; "I'd like to meet" is saved and visible to staff.
5. **Access rules:** candidate cannot open `/employer` or `/admin`; employer cannot open `/app` or `/admin`; signed-out users are sent to sign-in.
6. **Two-step:** switch it on in settings for one test account, sign out, sign in, confirm the code is required, switch it off.
7. Clean up: delete test users (their records cascade), their storage files and any test mandate.

---

## 8. Recent history (since the September note)

| PR | What |
|---|---|
| #26–#28 | Claude Design redesign: tokens, dark mode, site chrome, marketing pages, `/employers` |
| #29 | Employer portal (migration `20261101195519_employer_portal`), guided onboarding, optional two-step for all (migration `20261101203633_optional_staff_two_step`) |
| #30–#31 | Migration reconciliation; live-testing fixes (sign-up redirect, employer header); temporary upload bypass |
| #32 | New landing page, onboarding step 1, dashboard UI audit fixes |
| #33 | Upload bypass reverted; plain wording when uploads are not configured; this handover |

## 9. Other documents

`CLAUDE.md` (rules and architecture) · `DEPLOYMENT.md` (hosting, settings, Google/Apple) · `OPERATIONS_RUNBOOK.md` (scanner, privacy, backups, monitoring) · `COMMUNICATIONS_RUNBOOK.md` (email, campaigns, calendar) · `REED_SYNC.md` · `SUPABASE_INSTALLATION.md` · `RELEASE_CHECKLIST.md` and `DEVELOPMENT_GATES.md` (acceptance evidence ledger; September-era, still the gate list) · `PHASE_1_ACCEPTANCE.md` · `design/claude-design-2026-11/` (design handoff, reference only).
