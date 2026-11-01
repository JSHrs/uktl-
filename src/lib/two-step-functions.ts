import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuthenticatedSupabase, setSessionCookies, tokenAssuranceLevel } from "./supabase";
import { readStaffAccess } from "./server/staff-access";
import { enforceRateLimit } from "./server/ratelimit";
import { getEnv } from "./server/env";

/*
 * Optional two-step verification for every account (candidates, employers and staff),
 * switched on in settings. Enforcement lives in getCandidateSession(): once an
 * authenticator is verified, every new sign-in must be completed with a code at
 * /auth/two-step. The database's staff check applies the same rule to staff rights.
 */

const factorId = z.string().uuid();
const code = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

async function verifiedTotp(client: Awaited<ReturnType<typeof getAuthenticatedSupabase>>["client"]) {
  const { data, error } = await client.auth.mfa.listFactors();
  if (error) throw new Error("Two-step settings are unavailable right now. Please try again.");
  return { verified: data.totp.filter((f) => f.status === "verified"), all: data.all };
}

/** Status for the settings card. Works for a signed-in session, including one awaiting its code. */
export const twoStepStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { client, session } = await getAuthenticatedSupabase();
  const { verified } = await verifiedTotp(client);
  const staff = !!(await readStaffAccess(client).catch(() => ({ role: null }))).role;
  return {
    enabled: verified.length > 0,
    factors: verified.map((f) => ({ id: f.id, name: f.friendly_name ?? "Authenticator", created_at: f.created_at })),
    verifiedSession: tokenAssuranceLevel(session.access_token) === "aal2",
    staff,
  };
});

/** Starts authenticator setup and returns the QR code and key to scan. */
export const twoStepEnrollFn = createServerFn({ method: "POST" }).handler(async () => {
  const { client, user } = await getAuthenticatedSupabase();
  await enforceRateLimit(await getEnv(), "staffMfa", user.id);
  const { verified, all } = await verifiedTotp(client);
  if (verified.length) throw new Error("Two-step verification is already on.");
  for (const f of all.filter((f) => f.factor_type === "totp" && f.status === "unverified")) {
    const r = await client.auth.mfa.unenroll({ factorId: f.id });
    if (r.error) throw new Error("Couldn't restart setup. Please try again.");
  }
  const { data, error } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "UK Talent Link" });
  if (error) throw new Error("Couldn't start setup. Please try again.");
  return { id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
});

/**
 * Verifies a code: finishes setup, or completes a sign-in that is awaiting its code.
 * The upgraded (aal2) session replaces the session cookies.
 */
export const twoStepVerifyFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ factorId: factorId.optional(), code }).parse(raw))
  .handler(async ({ data }) => {
    const { client, user } = await getAuthenticatedSupabase();
    await enforceRateLimit(await getEnv(), "staffMfa", user.id);
    let id = data.factorId;
    if (!id) {
      const { verified } = await verifiedTotp(client);
      id = verified[0]?.id;
      if (!id) throw new Error("Two-step verification isn't set up on this account.");
    }
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: id });
    if (challengeError) throw new Error("Couldn't check the code. Please try again.");
    const { data: session, error } = await client.auth.mfa.verify({ factorId: id, challengeId: challenge.id, code: data.code });
    if (error) throw new Error("That code is wrong or has expired. Try the current code from your app.");
    await setSessionCookies(session.access_token, session.refresh_token, session.expires_in);
    return { ok: true };
  });

/** Turns two-step off. Needs a session verified with a code (aal2). */
export const twoStepDisableFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ factorId }).parse(raw))
  .handler(async ({ data }) => {
    const { client, session } = await getAuthenticatedSupabase();
    if (tokenAssuranceLevel(session.access_token) !== "aal2")
      throw new Error("Enter a code from your authenticator first, then turn it off.");
    const { error } = await client.auth.mfa.unenroll({ factorId: data.factorId });
    if (error) throw new Error("Couldn't turn two-step verification off. Please try again.");
    // Refresh so the session no longer carries the removed factor.
    const refreshed = await client.auth.refreshSession();
    if (refreshed.data.session) {
      const s = refreshed.data.session;
      await setSessionCookies(s.access_token, s.refresh_token, s.expires_in);
    }
    return { ok: true };
  });
