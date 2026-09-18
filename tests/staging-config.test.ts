import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStaging } from "../scripts/prepare-staging.mjs";
const ref = "abcdefghijklmnopqrst";
const env = {CLOUDFLARE_API_TOKEN:"test",CLOUDFLARE_ACCOUNT_ID:"test",SUPABASE_URL:`https://${ref}.supabase.co`,SUPABASE_ANON_KEY:"sb_publishable_test",SUPABASE_SERVICE_ROLE_KEY:"sb_secret_test",DATABASE_URL:`postgresql://postgres.${ref}:test@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,SITE_URL:"https://uktl-staging.test.workers.dev"};
test("staging preflight refuses production data, mismatched DB, unsafe origin and exposed secret", () => {
  assert.equal(validateStaging(env).ref, ref);
  for (const patch of [{SUPABASE_URL:"https://fvkffdeindboirukscfq.supabase.co"},{DATABASE_URL:"postgresql://postgres:test@db.other.supabase.co/postgres"},{SITE_URL:"https://uktl-production.test.workers.dev"},{SITE_URL:"http://uktl-staging.test.workers.dev"},{SUPABASE_ANON_KEY:"sb_secret_test"},{DATABASE_URL:""}]) {
    assert.throws(() => validateStaging({...env,...patch}));
  }
});
