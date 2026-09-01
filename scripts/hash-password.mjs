#!/usr/bin/env node
/**
 * Generate the PBKDF2-SHA256 hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hash-password.mjs
 *
 * The script reads the password from stdin (or the ADMIN_PASSWORD env var)
 * and prints the hex hash to copy into:
 *   wrangler secret put ADMIN_PASSWORD_HASH
 */

import { subtle } from "node:crypto";
import { createInterface } from "node:readline";

const SALT = "uktl-admin-salt-v1";
const ITERATIONS = 100_000;

async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMat = await subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(SALT), iterations: ITERATIONS },
    keyMat,
    256,
  );
  return Buffer.from(bits).toString("hex");
}

async function main() {
  const password = process.env.ADMIN_PASSWORD;

  if (password) {
    const hash = await hashPassword(password);
    console.log(hash);
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  rl.question("Admin password: ", async (pw) => {
    rl.close();
    if (!pw) {
      console.error("No password entered.");
      process.exit(1);
    }
    const hash = await hashPassword(pw);
    console.log("\nPBKDF2 hash (copy this as your ADMIN_PASSWORD_HASH secret):\n");
    console.log(hash);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
