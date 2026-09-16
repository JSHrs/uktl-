import { getCookie } from "@tanstack/start-server-core";
import { getEnv } from "./env";
import { DEV_JWT_SECRET, SESSION_COOKIE, verifySessionToken } from "./auth";

export function getJwtSecret(env: { JWT_SECRET?: string }): string {
  return env.JWT_SECRET ?? DEV_JWT_SECRET;
}

export async function isAdminRequest(): Promise<boolean> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return false;
  let secret = DEV_JWT_SECRET;
  try {
    const env = await getEnv();
    secret = getJwtSecret(env);
  } catch {
    /* preview */
  }
  return verifySessionToken(token, secret);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) throw new Error("Unauthorized — admin session required");
}

export type Viewer = { isAdmin: boolean; userId: string | null };

export async function getViewer(): Promise<Viewer> {
  const { getCandidateSession } = await import("../supabase");
  const [isAdmin, session] = await Promise.all([isAdminRequest(), getCandidateSession()]);
  return { isAdmin, userId: session.userId };
}

// Admin sees everything; a signed-in candidate only their own linked record.
export function canAccessCandidate(viewer: Viewer, ownerId: string | null | undefined): boolean {
  if (viewer.isAdmin) return true;
  return !!viewer.userId && ownerId === viewer.userId;
}
