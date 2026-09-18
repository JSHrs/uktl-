import type { SupabaseClient } from "@supabase/supabase-js";

type SessionUser = { userId: string | null; email: string | null };
const anonymous: SessionUser = { userId: null, email: null };

/** Authorize from a server-validated user, never unverified cookie claims. */
export async function resolveCandidateSession(
  auth: Pick<SupabaseClient["auth"], "getUser" | "refreshSession">,
  accessToken: string | undefined,
  refreshToken: string | undefined,
  persist: (access: string, refresh: string, expires: number) => Promise<void>,
): Promise<SessionUser> {
  if (accessToken) {
    const { data, error } = await auth.getUser(accessToken);
    if (!error && data.user) return { userId: data.user.id, email: data.user.email ?? null };
  }
  if (!refreshToken) return anonymous;
  const { data, error } = await auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return anonymous;
  const session = data.session;
  const verified = await auth.getUser(session.access_token);
  if (verified.error || !verified.data.user) return anonymous;
  await persist(session.access_token, session.refresh_token, session.expires_in);
  return { userId: verified.data.user.id, email: verified.data.user.email ?? null };
}
