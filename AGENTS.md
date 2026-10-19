# Architecture decisions

- Session/OAuth cookies get their SameSite policy from `src/lib/server/cookie-policy.ts`: partitioned SameSite=None on Lovable preview hosts, Lax everywhere else — the editor embeds previews in a cross-site iframe where Lax cookies are dropped, so sign-in never sticks there.
- Prebuilt previews live on the public `/simulation` route with in-memory sample state and no recruitment API calls; simulated roles never enter real session or authorization state.
- The admin preview uses a dedicated operations workspace reflecting the actual admin menu; candidate onboarding stays separate so staff tools never appear in the candidate preview.
- Staff registration uses ordinary account creation with a staff-specific explanation; only existing trusted membership approval and MFA grant administrative access, never a registration query parameter.
