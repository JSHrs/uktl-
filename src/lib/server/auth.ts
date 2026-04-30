// JWT auth using Web Crypto (Workers-native — no Node deps).
// Single-admin model: one bcrypt-equivalent password hash in env, one JWT secret.

import type { AppEnv } from "./env";

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// PBKDF2 password hashing — replaces bcrypt for Workers compatibility.
// Format: pbkdf2$<iterations>$<saltB64>$<hashB64>
const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as unknown as ArrayBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64urlEncode(salt)}$${b64urlEncode(new Uint8Array(bits))}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const salt = b64urlDecode(parts[2]);
  const expected = b64urlDecode(parts[3]);
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as unknown as ArrayBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    key,
    expected.length * 8,
  );
  const got = new Uint8Array(bits);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  return diff === 0;
}

// HS256 JWT (header.payload.signature, base64url-encoded)
type JwtPayload = { sub: string; iat: number; exp: number };

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signJwt(
  payload: { sub: string; ttlSeconds?: number },
  secret: string,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = payload.ttlSeconds ?? 60 * 60 * 24 * 7;
  const body: JwtPayload = { sub: payload.sub, iat: now, exp: now + ttl };
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const claims = b64urlEncode(enc.encode(JSON.stringify(body)));
  const data = `${header}.${claims}`;
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(data) as unknown as ArrayBuffer,
  );
  const sig = b64urlEncode(new Uint8Array(sigBuf));
  return { token: `${data}.${sig}`, expiresAt: body.exp * 1000 };
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const key = await hmacKey(secret);
  const sig = b64urlDecode(parts[2]);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig as unknown as ArrayBuffer,
    enc.encode(data) as unknown as ArrayBuffer,
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(dec.decode(b64urlDecode(parts[1]))) as JwtPayload;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function authenticate(
  env: AppEnv,
  password: string,
): Promise<{ token: string; expiresAt: number } | null> {
  if (!env.ADMIN_PASSWORD_HASH || !env.JWT_SECRET) return null;
  const ok = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  if (!ok) return null;
  return signJwt({ sub: "admin" }, env.JWT_SECRET);
}

export async function isValidToken(env: AppEnv, token: string): Promise<boolean> {
  if (!env.JWT_SECRET) return false;
  const payload = await verifyJwt(token, env.JWT_SECRET);
  return !!payload;
}
