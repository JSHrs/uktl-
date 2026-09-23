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
  if (!/^[a-z]{20}$/.test(ref) || supabase.hostname !== `${ref}.supabase.co` || supabase.protocol !== "https:" || supabase.pathname !== "/" || supabase.search || supabase.hash || supabase.username || supabase.password || ref === PRODUCTION_PROJECT) throw new Error("Staging requires a separate Supabase project");
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
export function validateAcceptanceProviders(env) {
  const required = ["ANTHROPIC_API_KEY", "RESEND_API_KEY", "REED_API_KEY", "CRON_SECRET", "CALENDLY_URL", "CALENDLY_API_TOKEN", "CALENDLY_WEBHOOK_SECRET", "CALENDLY_EVENT_TYPE_URI", "CV_SCAN_URL", "CV_SCAN_TOKEN"];
  const missing = required.filter(key => !env[key] || /REPLACE_WITH/.test(env[key]));
  if (missing.length) throw new Error(`Missing acceptance provider configuration: ${missing.join(", ")}`);
  if (env.CRON_SECRET.length < 32) throw new Error("CRON_SECRET must contain at least 32 characters");
  const limit = Number(env.AI_HOURLY_CALL_LIMIT || 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw new Error("AI_HOURLY_CALL_LIMIT must be between 1 and 10000");
  const scanner = new URL(env.CV_SCAN_URL);
  if (scanner.protocol !== "https:" || scanner.username || scanner.password || scanner.search || scanner.hash || scanner.port || !scanner.hostname.includes(".") || /^[\d.]+$/.test(scanner.hostname) || scanner.hostname.endsWith(".localhost") || scanner.hostname.endsWith(".local") || scanner.hostname.startsWith("[") || env.CV_SCAN_TOKEN.length < 32) throw new Error("CV_SCAN_URL and CV_SCAN_TOKEN must configure a private HTTPS scanner");
  const calendly = new URL(env.CALENDLY_URL);
  if (calendly.protocol !== "https:" || calendly.hostname !== "calendly.com" || calendly.port || calendly.username || calendly.password || calendly.search || calendly.hash || !/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/.test(calendly.pathname)) throw new Error("CALENDLY_URL must be an exact HTTPS scheduling URL");
  if (!/^https:\/\/api\.calendly\.com\/event_types\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(env.CALENDLY_EVENT_TYPE_URI)) throw new Error("CALENDLY_EVENT_TYPE_URI must identify the intended Calendly event type");
}
export function buildStagingDeployment(env) {
  const checked = validateStaging(env);
  validateAcceptanceProviders(env);
  const config = {
    name: "uktl-staging", account_id: env.CLOUDFLARE_ACCOUNT_ID,
    main: resolve("dist/server/index.mjs"), no_bundle: true,
    compatibility_date: "2025-09-24", compatibility_flags: ["nodejs_compat"],
    rules: [{type:"ESModule",globs:["**/*.mjs","**/*.js"]}],
    assets: {directory:resolve("dist/client"),binding:"ASSETS"}, workers_dev:true,
    vars: {DATA_BACKEND:"supabase",SUPABASE_URL:env.SUPABASE_URL,SUPABASE_ANON_KEY:env.SUPABASE_ANON_KEY,SITE_URL:checked.origin,CALENDLY_URL:env.CALENDLY_URL,CALENDLY_EVENT_TYPE_URI:env.CALENDLY_EVENT_TYPE_URI,CV_SCAN_URL:env.CV_SCAN_URL,AI_HOURLY_CALL_LIMIT:env.AI_HOURLY_CALL_LIMIT||"100"},
    observability: {enabled:true},
  };
  const secrets = {};
  for (const key of ["DATABASE_URL","SUPABASE_SERVICE_ROLE_KEY","ANTHROPIC_API_KEY","RESEND_API_KEY","REED_API_KEY","CRON_SECRET","CALENDLY_API_TOKEN","CALENDLY_WEBHOOK_SECRET","CV_SCAN_TOKEN"]) secrets[key] = env[key];
  return {config,secrets};
}
export function prepareStaging(env) {
  const {config,secrets}=buildStagingDeployment(env);
  mkdirSync(".deploy", { recursive: true, mode: 0o700 });
  writeFileSync(".deploy/staging.json",JSON.stringify(config,null,2),{mode:0o600});
  writeFileSync(".deploy/secrets.json",JSON.stringify(secrets),{mode:0o600});
  console.log("Staging configuration validated; private deployment files prepared.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { prepareStaging(process.env); } catch (error) { console.error(error.message); process.exitCode=1; }
}
