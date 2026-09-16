import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getCookie, setCookie, deleteCookie } from "@tanstack/start-server-core";
import { getEnv } from "./server/env";

// ── Browser client ────────────────────────────────────────────────────────────
// Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (public, safe for browser).
// Call this only in browser/isomorphic contexts.
export function getBrowserSupabase(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set");
  return createClient(url, key);
}

// ── Server admin client ───────────────────────────────────────────────────────
// Uses the service role key — bypasses RLS. Only use server-side.
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  const env = await getEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Session cookie names ──────────────────────────────────────────────────────
const ACCESS_COOKIE  = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";

// ── Auth helpers (call inside server functions only) ──────────────────────────
export async function getCandidateSession(): Promise<{
  userId: string | null;
  email: string | null;
}> {
  try {
    const accessToken  = await getCookie(ACCESS_COOKIE);
    const refreshToken = await getCookie(REFRESH_COOKIE);
    if (!accessToken) return { userId: null, email: null };

    const env = await getEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return { userId: null, email: null };

    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? "",
    });
    if (error || !data.user) return { userId: null, email: null };
    return { userId: data.user.id, email: data.user.email ?? null };
  } catch {
    return { userId: null, email: null };
  }
}

export async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): Promise<void> {
  await setCookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: expiresIn,
    path: "/",
  });
  await setCookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function clearSessionCookies(): Promise<void> {
  await deleteCookie(ACCESS_COOKIE, { path: "/" });
  await deleteCookie(REFRESH_COOKIE, { path: "/" });
}
