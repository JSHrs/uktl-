import { getCookie } from "@tanstack/start-server-core";
import { getEnv } from "./env";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/**
 * The admin session signing key. There is no development fallback: without
 * JWT_SECRET no admin session can be issued or verified, so admin access
 * fails closed.
 */
export function getJwtSecret(env: { JWT_SECRET?: string }): string {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured — admin sessions are disabled");
  }
  return env.JWT_SECRET;
}

export async function isAdminRequest(): Promise<boolean> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return false;
  let secret: string;
  try {
    secret = getJwtSecret(await getEnv());
  } catch {
    // No bindings or no signing key configured → nobody is an admin.
    return false;
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

/** Any authenticated principal — admin consultant or signed-in candidate. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.isAdmin && !viewer.userId) {
    throw new Error("Please sign in to continue");
  }
  return viewer;
}

// Admin sees everything; a signed-in candidate only their own linked record.
export function canAccessCandidate(viewer: Viewer, ownerId: string | null | undefined): boolean {
  if (viewer.isAdmin) return true;
  return !!viewer.userId && ownerId === viewer.userId;
}
