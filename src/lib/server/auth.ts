const PBKDF2_SALT = "uktl-admin-salt-v1";
const PBKDF2_ITER = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(PBKDF2_SALT), iterations: PBKDF2_ITER },
    key, 256,
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time comparison to prevent timing attacks
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/**
 * Verifies an admin password against the configured PBKDF2 hash.
 * Fails closed: with no ADMIN_PASSWORD_HASH configured NO password is accepted.
 * There is deliberately no development/demo fallback password.
 */
export async function verifyPassword(submitted: string, storedHash: string | undefined): Promise<boolean> {
  if (!storedHash) return false;
  if (!submitted) return false;
  const hash = await hashPassword(submitted);
  return safeEqual(hash, storedHash);
}

export const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
export const SESSION_COOKIE = "admin_session";

export async function createSessionToken(secret: string): Promise<string> {
  if (!secret) throw new Error("JWT_SECRET is required to issue an admin session");
  const enc = new TextEncoder();
  const iat = Date.now();
  const payload = JSON.stringify({ iat, exp: iat + TOKEN_TTL_MS, v: 1 });
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${btoa(payload)}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

/**
 * Verifies signature AND payload shape. A token whose payload is missing,
 * malformed, un-versioned, already expired, or expires further in the future
 * than the issuing TTL allows (a forged/extended lifetime) is rejected.
 */
export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const payload = atob(payloadB64);
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const signatureValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
    if (!signatureValid) return false;

    const claims = JSON.parse(payload) as unknown;
    if (typeof claims !== "object" || claims === null) return false;
    const { exp, v } = claims as { exp?: unknown; v?: unknown };
    if (v !== 1) return false;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return false;

    const now = Date.now();
    if (now >= exp) return false;
    // Reject a lifetime longer than we ever issue (clock skew allowance: 1 min).
    if (exp - now > TOKEN_TTL_MS + 60_000) return false;
    return true;
  } catch {
    return false;
  }
}
