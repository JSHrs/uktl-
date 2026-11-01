# Handoff: UK Talent Link — full redesign

## Overview
A redesign of the UKTL marketing site, onboarding, candidate platform, employer portal, consultant admin and auth screens for `devacnt/UKTL` (TanStack Start + Tailwind). The marketing site serves two audiences, **candidates** and **employers**, with a persistent audience switch that changes navigation, copy, sections and CTAs.

## About the design files
The files in `design/` are **design references built in HTML**. They're prototypes that show the intended look and behaviour; don't ship them as production code. Recreate them in the existing codebase using its patterns: TanStack Router file routes, Tailwind classes against the tokens already in `src/styles.css`, the existing `SiteLayout`, `AppLayout`, `PageHeader` and admin primitives (`AdminHeader`, `AdminTable`, `AdminBtn`, `AdminField`), and the existing server functions in `src/lib/*`. All data in the mocks is placeholder; wire screens to the real loaders.

Open `design/UKTL All Screens.html` to see every screen on one canvas, at desktop and mobile sizes.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, states and motion are final. Match them closely using the repo's existing tokens, which these designs already use (`paper`, `paper-deep`, `ink`, `ink-soft`, `ink-mute`, `rule`, `accent`, `accent-soft`, Fraunces/Geist/Geist Mono).

## Implementation order (suggested)
1. Tokens and dark mode: add the `.t-dark` palette (below) and a theme toggle persisted to `localStorage('uktl-theme')`.
2. Site chrome: audience bar, nav, mobile menu and footer, in `src/components/site/*`.
3. Landing (`src/routes/index.tsx`), then the marketing pages.
4. Onboarding (`/auth/register` → a new `/onboarding` route with `?for=candidate|employer&step=n`).
5. Shared charts (`src/components/app/charts/*`) and the platform shell (`AppLayout`).
6. Candidate routes, then admin routes, then the new employer portal.
7. Empty states for each list or dashboard.

## Route map
| Design file / screen key | Repo route |
|---|---|
| UKTL Landing.html | `src/routes/index.tsx` |
| Services.html | `src/routes/services.tsx` (candidate offer) |
| Employers.html | `src/routes/employer.tsx` (expand) |
| How it works.html | `src/routes/approach.tsx` (candidate and employer variants) |
| Sectors.html / Reach.html / Contact.html | `sectors.tsx` / `reach.tsx` / `contact.tsx` |
| Privacy.html / Terms.html / Unsubscribe.html | `privacy.tsx` / `terms.tsx` / `unsubscribe.tsx` |
| Onboarding.html | **new** `src/routes/onboarding.tsx` (candidate: 7 steps, employer: 7 steps) |
| Platform `?s=dashboard, discover, jobs, job, upload, activity, messages, consultations, profile` | `src/routes/app/*` |
| `?s=hr, hrlibrary, hranswer, hrhistory` | `src/routes/app/hr/*` |
| `?s=admin, mandates, mandate, mandatenew, ranking` | `src/routes/admin/index.tsx`, `admin/jobs/*`, `JobCandidateRanking.tsx` |
| `?s=talent, candidate` | `admin/candidates/index.tsx`, `app/candidates/*` |
| `?s=bookings, enquiries, campaigns, calendar` | `admin/bookings, enquiries, campaigns, calendar` |
| `?s=faq, faqedit, hrreview` | `admin/faq/*`, `admin/hr.tsx` |
| `?s=analytics, processing, operations` | `admin/analytics, processing, operations` |
| `?s=auth, login, forgot, reset, callback, adminlogin, security` | `src/routes/auth/*`, `admin/login.tsx` |
| `?s=company, postjob, allcands, jobcands, empmsg` | **new** employer portal, e.g. `src/routes/client/*` |
| `?s=dashboard0, discover0, messages0, company0, allcands0, empmsg0` | Empty states of the routes above |

Screen markup lives in `design/uktl-screens*.js`. Each key returns the full HTML for that screen, so read it as a component spec.

## Design tokens
Light (`:root`, `.t-light`):
- paper `oklch(.990 .001 82)` · paper-deep `oklch(.963 .003 82)` · ink `oklch(.095 .003 60)` · ink-soft `oklch(.365 .006 60)` · ink-mute `oklch(.545 .005 60)` · rule `oklch(.908 .003 82)`
- accent `oklch(.285 .075 263)` (navy) · accent-soft `oklch(.945 .020 263)` · accent-light `oklch(.765 .055 263)`
- good `oklch(.45 .12 155)` · warn `oklch(.52 .12 75)` (bg `.97 .03 85`, border `.88 .07 85`) · bad `oklch(.55 .18 25)` (bg `.97 .02 25`, border `.88 .06 25`)

Dark (`.t-dark`):
- paper `oklch(.165 .006 262)` · paper-deep `oklch(.205 .008 262)` · ink `oklch(.955 .004 82)` · ink-soft `oklch(.800 .006 82)` · ink-mute `oklch(.640 .007 82)` · rule `oklch(.300 .010 262)`
- accent `oklch(.790 .085 263)` · accent-soft `oklch(.270 .045 263)` · good `oklch(.76 .12 155)` · warn `oklch(.80 .12 80)` · bad `oklch(.72 .15 25)`

Dark band sections (both themes): bg `oklch(.095 .003 60)` (`oklch(.11 .006 262)` in dark), text `oklch(.99 .001 82)`, soft text at 74% alpha, rules at 12% alpha, accent `oklch(.765 .055 263)`.

**Colour mixing:** tints of accent toward paper must use `color-mix(in oklab, …)`, not oklch, which shifts the hue toward brown.

Type:
- Display: Fraunces 300, `letter-spacing:-.025em`, `font-variation-settings:"opsz" 144,"SOFT" 40`. Italic emphasis uses 400 with `SOFT 100` in accent.
- Body: Geist 14–16px, 1.55–1.6 line-height.
- Labels: Geist Mono 10–11px, uppercase, `letter-spacing:.14–.18em`, ink-mute.
- Scale: landing hero `clamp(36px,5.2cqi,80px)` · page hero `clamp(40px,6cqi,92px)` · section h2 `clamp(34px,4.6cqi,64px)` · app page title `clamp(30px,3.6cqi,44px)` · card title 20px Fraunces 400.

Radii: buttons and pills 999px · inputs 6px · cards 8px · marketing cards 12–14px · device or demo frames 12–14px.
Shadow: `0 4px 24px oklch(.18 .005 80/.12), 0 1px 4px oklch(.18 .005 80/.08)` (darker in dark mode).
Easing: `cubic-bezier(.22,1,.36,1)` everywhere.
Gutter: `clamp(20px,4.5cqi,64px)`; max content width 1440 (marketing) and 1240 (app).

## Site chrome
- **Audience bar** (fixed, top): ink background with "I'm viewing as [Candidate | Employer]" and phone/locations on the right. The choice is stored in `localStorage('uktl-for')`, overridable by `?for=`, and sets `body[data-for]`. Elements with `data-only="candidate|employer"` show for one audience only.
- **Nav**: transparent at the top; after 30px of scroll it becomes paper at 90% with a 20px blur and a bottom rule. Links per audience:
  - Candidate: What we offer, How it works, Sectors, Reach, Contact. CTA "Register free" → `/onboarding?for=candidate`.
  - Employer: Services, How we search, Sectors, Reach, Contact. CTA "Start hiring" → `/onboarding?for=employer`.
  - At ≤900px the links collapse to a burger that opens a full-screen menu.
- **Footer**: four columns (brand, Candidates, Employers, Company) and a legal row.
- Use `overflow-x: clip` (not `hidden`) on body. `hidden` breaks every `position:sticky` element when the body is a size container.

## Landing
**Hero:**
- Audience toggle pill: an ink thumb slides between the two options in 0.5s.
- 3-line headline with a line-by-line rise animation (1.1s, 0.12s stagger), next to an animated product demo window, max-width 440px.
  - **Candidate demo** (11s loop): CV file row with progress bar, a score counting 0→78 (registered `@property --n`), 4 sub-score bars filling, 3 match rows sliding in, then a toast "James replied: interview on Thursday".
  - **Employer demo**: the applicant counter goes 0→38, 4 ranked rows slide in, top 3 get a "Shortlisted" pill, then a toast "Shortlist of 3 sent".
  - Demo keyframes appear at 4/10/16/22/28/36/44/52/60/68/76% of the cycle and fade out at 92–100%.
- Footer row with lede, a pulsing "Scroll" cue and CTAs.

**Candidate sections:**
1. Scroll-driven product tour: 5 steps (Score, Improve, Match, Guidance, Consultant) beside a sticky app frame whose panel crossfades (0.6s) to the active step. The active step is chosen by an IntersectionObserver with `rootMargin:-45% 0 -45% 0`. At ≤1000px the frame sits above the steps and sticks at top 104px.
2. Dark band "You never pay to find work through us" with a 4-fact strip (£0, ~60s, 2 markets, 1 consultant).
3. Sector list with hover indent.
4. Quote.
5. Dark CTA with sample score card.

**Employer sections:**
1. Two service cards (Executive search, HR consultancy), each with a three-cell key-value strip (Model, Shortlist or Start, Guarantee or Markets).
2. "Four names, not forty": an explainer list beside a ranked shortlist. Click a row to expand its evidence (bars and reasons); one row is open at a time.
3. Dark band timeline (Week 0 → Offer +90 days).
4. Three commitments.
5. Quote.
6. Dark consultation form.

## Marketing pages
- Shared page hero: eyebrow, display title with an accent italic phrase, lede, actions, optional meta row.
- Content uses the "art" pattern: a 5/7 grid with a sticky left title column (top 140px), body text, a "What you get" tick list in 2 columns, and an optional mini UI preview card.
- Services and Employers each show a cross-link banner when viewed by the other audience.
- How it works, Sectors, Reach and Contact switch copy and CTAs by audience. The contact form's enquiry type list differs per audience, and employers get an extra Company field.
- Legal pages have a sticky in-page nav on the left with sections on the right.

## Onboarding (`Onboarding.html`)
- Layout: a dark 340px left rail (who, headline, step list with done/current states, help contact). The main column has a top bar (step x of n, theme, "Save & exit"), a 2px progress bar, a centred 600px pane and a sticky footer with Back and Continue (plus "Skip for now" on optional steps).
- URL keeps `?step=` in sync. Done steps in the rail are clickable. Each pane animates in over 0.6s. At ≤900px the rail hides.
- **Candidate steps:**
  1. Account: LinkedIn or email, a 4-segment password strength meter, consent.
  2. Verify email: 6-box one-time code.
  3. Upload CV: drop zone, file row, then a 4-step parse checklist (✓ received, ✓ reading, ✓ building, spinner while scoring).
  4. Check profile: extracted fields with Edit, and skill chips.
  5. Preferences: market chips, seniority segmented control, salary floor and currency, work pattern, relocation toggle.
  6. Right to work: UK and UAE status, notice period, profile visibility radio cards.
  7. Done: ring animates to 78 with a summary list; CTA "Go to dashboard".
- **Employer steps:**
  1. Account.
  2. Company: name, site, HQ, size segmented control, sector chips, logo upload.
  3. Needs: checkbox cards, hiring volume, markets.
  4. First role (optional).
  5. Invite team (optional): email, role, remove.
  6. Meet consultant (optional): day picker and time slots.
  7. Ready: summary; CTA "Open client portal".

## Platform shell
- 232px sidebar with grouped nav (mono group labels), active item on paper-deep and a count badge.
  - Candidate sidebar adds a "Profile strength" card.
  - Footer holds avatar, name and the theme toggle.
- Sticky top bar: breadcrumb (mono), search with ⌘K, bell.
- Nav groups:
  - Candidate: Candidate, then Support.
  - Admin, matching the repo's `NAV`: Recruitment, Clients & comms, Content, System.
  - Employer: Overview, Post a job, Candidates, Messages.
- At ≤760px the sidebar hides and a fixed bottom tab bar with 5 tabs appears; each target is at least 44px.
- Page content uses a 12-column "bento" grid (`c-3`…`c-12`):
  - ≤1080px: everything spans full width except `c-6`, which takes half.
  - ≤760px: all spans full width.
- Tables: secondary columns get `hide-t` (hidden ≤1080px) and `hide-m` (hidden ≤760px). Tables must never scroll horizontally at around 924px.

## Charts (`design/uktl-charts.js`)
Build these as small React components:
- `area`: HTML axis labels and an SVG with `preserveAspectRatio="none"` and `vector-effect: non-scaling-stroke`. Points and tooltip are HTML-positioned in %. A dashed target line in warn colour. Reveal is a `clip-path` animation over 1.4s.
- `spark`: tiny area chart for KPI cells.
- `minibars`: small bars; the last bar is accent.
- `vbars`: vertical bars, highlighted bars in accent, optional dashed limit line.
- `gauge`: semicircle with `pathLength=100` and tick marks with labels. The number scales with the gauge width (`cqi`).
- `ring`: `pathLength=100` stroke ring.
- `radar`: 6 axes. "You" is filled at 15% accent; the reference is dashed ink-mute.
- `donut`: segments `d1`–`d4` = accent, then 62% and 34% accent mixed into paper (oklab), then ink-mute.
- `range`: market range track, role band and a "you" marker.
- `stepper`: 4-stage progress.

All chart fills animate in (stroke-dasharray from 0, `scaleY`/`scaleX` grow). Respect `prefers-reduced-motion`.

## Empty states
Each empty state has a dashed 64px glyph circle, a Fraunces 26px heading, a 44ch line and actions. Empty dashboards also show:
- an onboarding checklist (done items struck through, the current item outlined);
- KPI cells showing "—";
- a ghost chart: a dashed path over grid lines, with a pill message;
- skeleton rows with a pulse animation.

## Assets
- `src/assets/hero-mark.jpg` (from the repo), used greyscale with `mix-blend-mode` (multiply in light mode, screen and inverted in dark mode) as a masked hero background and on the onboarding rail.
- No icon set; glyphs are Unicode in Geist Mono (◐ ◇ ▤ ↑ ☆ ✉ ◷ § ○ ≡ ∿ ↻ ◎). Swap in your icon library if you prefer.
- All people, companies and numbers are placeholders.

## Files in `design/`
- Pages: `UKTL Landing.html`, `Services.html`, `Employers.html`, `How it works.html`, `Sectors.html`, `Reach.html`, `Contact.html`, `Privacy.html`, `Terms.html`, `Unsubscribe.html`, `Onboarding.html`, `UKTL Platform.html` (candidate, `?s=key`), `UKTL Employer.html`, `UKTL Admin.html`, `UKTL All Screens.html` (overview canvas).
- Styles: `uktl-system.css` (tokens, buttons, pills, fields), `uktl-landing.css` (hero and demos), `uktl-site.css` (marketing), `uktl-app.css` (platform).
- Scripts: `uktl-site.js` (chrome and audience logic), `uktl-charts.js`, `uktl-screens.js`, `uktl-screens-employer.js`, `uktl-screens-more.js`, `uktl-screens-admin.js`, `uktl-screens-empty.js`.
