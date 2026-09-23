# Astra — pick-up instructions (23 September 2026)

**Read this first.** It covers what is waiting for you, how to bring it in, and what must stay true afterwards. Delete this file in the same commit that lands the work (step 3).

## Where things stand

- **Source of truth:** `devacnt/UKTL` `main`. The owner confirmed this.
- **Mirror:** `JSHrs/uktl-` (formerly `JSHrs/talent-compass`). Its `main` equals devacnt `main` at `7a56f24`. Lovable builds from it.
- **Waiting for you:** branch `claude/cv-parsing-dashboard-design-MlDEc` on `JSHrs/uktl-` (PR #11). It is **five commits directly on top of `7a56f24`**: the four listed below, plus the commit that adds this file. It fast-forwards with no merge needed.
- The owner asked that nothing reach `main` in either repo until you pull it. It is not live anywhere yet.
- The previous JSHrs `main` is preserved at `archive/pre-uktl-sync`. Nothing on it needs porting.

## Step 1 — bring it into devacnt

```bash
cd UKTL                       # your devacnt/UKTL checkout, on main, clean
git fetch origin
git status                    # confirm main == origin/main
git fetch https://github.com/JSHrs/uktl-.git claude/cv-parsing-dashboard-design-MlDEc
git merge --ff-only FETCH_HEAD
```

If `--ff-only` refuses, you pushed to devacnt after `7a56f24`. In that case run `git merge FETCH_HEAD` instead and resolve conflicts, keeping your newer logic. The files touched are listed under "What the commits change".

## Step 2 — verify before pushing

```bash
npm ci
npm run test:unit          # expect 60/60
npx tsc --noEmit           # expect 0
npm run build              # expect exit 0
npm run test:e2e           # locally expect 32 passed, 14 skipped (the skipped ones need staging credentials)
```

## Step 3 — push to both repos

```bash
git rm ASTRA_PICKUP.md && git commit -m "Remove pick-up instructions after landing PR #11"
git push origin main                                     # devacnt/UKTL
git push https://github.com/JSHrs/uktl-.git main          # keep the mirror identical
```

Both repos then show the same `main`. PR #11 closes itself as merged, and Lovable rebuilds.

## What the commits change

1. **`9c24730` — one header, sign-in-guarded candidate area.**
   - `getSessionFn` returns `userId`, `email`, `isStaff` and `isAdmin`, built on your `getStaffAccess`/`hasStaffAccess`. The root `beforeLoad` puts it on `context.session`.
   - One `Nav` is used on the public site, `/app` and `/auth/*`. It shows "Sign in / Upload your CV", "My account", or "Staff dashboard" for MFA-verified staff.
   - `/app` redirects signed-out visitors to `/auth/login?redirect=…`, and login honours same-site redirects only.
   - Candidate menu: Dashboard · My CV · Job matches · All jobs · My interests · HR & Law · Profile. Staff menu: Candidates · Mandates · Upload a CV.
   - New candidate dashboard. The CV page hides consultant actions from candidates and keeps your `ProfileEditor` and `MatchEvidence`.
   - Your callback recovery route (→ `/auth/reset`) is kept.
   - Two of your specs (`discovery-access`, `hr-privacy`) now assert the sign-in redirect. The "Discovery is temporarily unavailable" state is only reachable when signed in, so it needs a staging test.
2. **`9a31c72` — candidate-first copy and light/dark mode.**
   - Every public page now leads with what candidates get.
   - Dark tokens apply under `prefers-color-scheme: dark`, and Tailwind `dark:` means system dark.
   - `.band` keeps the home page's feature bands dark in both themes, and `.hero-mark` inverts the hero illustration in dark mode.
3. **`69420a5` — candidate-only site (owner's instruction).** UKTL is a staffing firm, and employers do not register or enquire through the site.
   - Removed: the "I'm hiring" CTAs, employer enquiry types, the company field, and the four employer practices.
   - `/services` is now "What we offer" (anchors `cv-score`, `cv-tips`, `matching`, `workplace-guidance`, `consultants`), and the header link reads "What we offer".
4. **`05ede29` — the contact page follows the device theme** instead of being a pinned-dark band.

Files touched: `src/lib/functions.ts` (`getSessionFn`, `signOutFn`), `src/routes/__root.tsx`, `src/routes/app.tsx`, `src/routes/app/{index,upload,candidates/index,candidates/$id,jobs/index}.tsx`, `src/routes/auth.tsx`, `src/routes/auth/{login,register,callback}.tsx`, `src/components/site/{Nav,Footer}.tsx`, `src/components/app/AppLayout.tsx`, `src/routes/{index,approach,services,sectors,reach,contact}.tsx`, `src/styles.css`, `e2e/{app-nav,upload,discovery-access,hr-privacy}.spec.ts`, `CLAUDE.md`, `HANDOVER.md`.

## Rules that must stay true after this

- **Two user types only:** candidates and firm staff. No client or employer portal, and no employer-facing copy on the public site.
- **Everything under `/app` requires sign-in.** A candidate sees only their own records. Staff-only actions stay hidden from candidates and enforced server-side (`requireStaff`/`requireAdmin`).
- **The header and route guards read `context.session`.** After any sign-in or sign-out, call `router.invalidate()` so the header updates.
- **Colours come from the tokens in `styles.css`.** Anything new must look right in both light and dark. Use `.band` only for a section meant to stay dark in both themes.
- **Public copy must not invent facts about the firm.** No numbers, track record or promises that aren't verified. Addresses, phone number and the sector notes on `/sectors` still need the owner's confirmation.
- **Repo sync:** devacnt stays first. Push every change to both repos with identical commit IDs, and never push to JSHrs `main` alone. Lovable should not commit to JSHrs `main` directly; it would drift from devacnt.

## Open items for you

- Staff who haven't completed MFA are not yet `isStaff`, so the header shows them "My account" until they verify. `/admin` still sends them to `/auth/security`. Decide whether that needs a clearer prompt.
- Add a staging test for the signed-in "Discovery is temporarily unavailable" state.
- Confirm company facts with the owner: addresses, phone number, "Also: Dubai · Abu Dhabi", and the sector notes.
- The Claude GitHub App isn't installed on `JSHrs/uktl-`, so PR events don't reach Claude sessions automatically.
