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

export async function verifyPassword(submitted: string, storedHash: string | undefined): Promise<boolean> {
  if (!storedHash) return submitted === "admin123"; // dev fallback
  const hash = await hashPassword(submitted);
  return safeEqual(hash, storedHash);
}

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
export const SESSION_COOKIE = "admin_session";
export const DEV_JWT_SECRET = "uktl-dev-jwt-secret-v1-change-for-production";

export async function createSessionToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS, v: 1 });
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${btoa(payload)}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return false;
    const payload = atob(payloadB64);
    const { exp } = JSON.parse(payload) as { exp: number };
    if (Date.now() > exp) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
  } catch {
    return false;
  }
}
