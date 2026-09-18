import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const PRODUCTION_PROJECT = "fvkffdeindboirukscfq";
export function validateStaging(env) {
  const required = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "SITE_URL"];
  const missing = required.filter(k => !env[k] || /REPLACE_WITH/.test(env[k]));
  if (missing.length) throw new Error(`Missing staging configuration: ${missing.join(", ")}`);
  const supabase = new URL(env.SUPABASE_URL);
  const ref = supabase.hostname.split(".")[0];
  if (!/^[a-z]{20}$/.test(ref) || supabase.hostname !== `${ref}.supabase.co` || supabase.protocol !== "https:" || ref === PRODUCTION_PROJECT) throw new Error("Staging requires a separate Supabase project");
  const origin = new URL(env.SITE_URL);
  if (origin.protocol !== "https:" || !/^uktl-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin.hostname) || origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) throw new Error("SITE_URL must be the HTTPS uktl-staging Workers origin");
  const database = new URL(env.DATABASE_URL);
  const isDirect = database.hostname === `db.${ref}.supabase.co`;
  const isPooler = database.hostname.endsWith(".pooler.supabase.com") && decodeURIComponent(database.username).endsWith(`.${ref}`);
  if (!["postgres:", "postgresql:"].includes(database.protocol) || !(isDirect || isPooler) || !database.password || env.DATABASE_URL.includes(PRODUCTION_PROJECT)) throw new Error("DATABASE_URL must target the same isolated staging project");
  if (env.SUPABASE_ANON_KEY.startsWith("sb_secret_") || env.SUPABASE_ANON_KEY === env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Public and service keys must be separate");
  for (const [key, role] of [["SUPABASE_ANON_KEY", "anon"], ["SUPABASE_SERVICE_ROLE_KEY", "service_role"]]) {
    if (env[key].startsWith("eyJ")) {
      let claims; try { claims = JSON.parse(Buffer.from(env[key].split(".")[1], "base64url").toString()); } catch { throw new Error(`${key} is malformed`); }
      if (claims.role !== role || claims.ref !== ref) throw new Error(`${key} belongs to a different project or role`);
    } else if (!env[key].startsWith(role === "anon" ? "sb_publishable_" : "sb_secret_")) throw new Error(`${key} is not a supported Supabase key`);
  }
  return { ref, origin: origin.origin };
}
export function prepareStaging(env) {
  const checked = validateStaging(env);
  mkdirSync(".deploy", { recursive: true, mode: 0o700 });
  const config = {
    name: "uktl-staging", account_id: env.CLOUDFLARE_ACCOUNT_ID,
    main: resolve("dist/server/index.mjs"), no_bundle: true,
    compatibility_date: "2025-09-24", compatibility_flags: ["nodejs_compat"],
    rules: [{type:"ESModule",globs:["**/*.mjs","**/*.js"]}],
    assets: {directory:resolve("dist/client"),binding:"ASSETS"}, workers_dev:true,
    vars: {DATA_BACKEND:"supabase",SUPABASE_URL:env.SUPABASE_URL,SUPABASE_ANON_KEY:env.SUPABASE_ANON_KEY,SITE_URL:checked.origin,CALENDLY_URL:env.CALENDLY_URL || ""},
    observability: {enabled:true},
  };
  const secrets = {};
  for (const key of ["DATABASE_URL","SUPABASE_SERVICE_ROLE_KEY","ANTHROPIC_API_KEY","RESEND_API_KEY","REED_API_KEY","CRON_SECRET"]) if (env[key]) secrets[key] = env[key];
  writeFileSync(".deploy/staging.json",JSON.stringify(config,null,2),{mode:0o600});
  writeFileSync(".deploy/secrets.json",JSON.stringify(secrets),{mode:0o600});
  console.log("Staging configuration validated; private deployment files prepared.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { prepareStaging(process.env); } catch (error) { console.error(error.message); process.exitCode=1; }
}
