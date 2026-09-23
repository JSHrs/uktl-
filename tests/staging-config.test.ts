import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStaging,validateAcceptanceProviders,buildStagingDeployment } from "../scripts/prepare-staging.mjs";
const ref = "abcdefghijklmnopqrst";
const env = {CLOUDFLARE_API_TOKEN:"test",CLOUDFLARE_ACCOUNT_ID:"test",SUPABASE_URL:`https://${ref}.supabase.co`,SUPABASE_ANON_KEY:"sb_publishable_test",SUPABASE_SERVICE_ROLE_KEY:"sb_secret_test",DATABASE_URL:`postgresql://postgres.${ref}:test@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,SITE_URL:"https://uktl-staging.test.workers.dev"};
test("staging preflight refuses production data, mismatched DB, unsafe origin and exposed secret", () => {
  assert.equal(validateStaging(env).ref, ref);
  for (const patch of [{SUPABASE_URL:"https://fvkffdeindboirukscfq.supabase.co"},{DATABASE_URL:"postgresql://postgres:test@db.other.supabase.co/postgres"},{SITE_URL:"https://uktl-production.test.workers.dev"},{SITE_URL:"http://uktl-staging.test.workers.dev"},{SUPABASE_ANON_KEY:"sb_secret_test"},{DATABASE_URL:""}]) {
    assert.throws(() => validateStaging({...env,...patch}));
  }
});
const providers={CV_SCAN_URL:'https://scanner.example/scan',CV_SCAN_TOKEN:'synthetic-scanner-token-at-least-32-characters',ANTHROPIC_API_KEY:'synthetic-anthropic',RESEND_API_KEY:'synthetic-resend',REED_API_KEY:'synthetic-reed',CRON_SECRET:'synthetic-cron-secret-with-32-characters',CALENDLY_URL:'https://calendly.com/fixture/consultation',CALENDLY_EVENT_TYPE_URI:'https://api.calendly.com/event_types/11111111-1111-4111-8111-111111111111',CALENDLY_API_TOKEN:'synthetic-calendly-token',CALENDLY_WEBHOOK_SECRET:'synthetic-signing-secret'};
test('acceptance preflight requires every provider setting without revealing its value',()=>{
 validateAcceptanceProviders(providers);
 for(const key of Object.keys(providers))assert.throws(()=>validateAcceptanceProviders({...providers,[key]:''}),error=>error instanceof Error&&error.message.includes(key)&&!error.message.includes('synthetic-calendly-token'));
 for(const patch of [{CRON_SECRET:'short'},{CALENDLY_URL:'https://evil.invalid/fixture/consultation'},{CALENDLY_URL:providers.CALENDLY_URL+'?email=private'},{CALENDLY_EVENT_TYPE_URI:'https://api.calendly.com/other'}])assert.throws(()=>validateAcceptanceProviders({...providers,...patch}));
});
test('deployment sends Calendly credentials only as secrets and excludes test credentials',()=>{
 const {config,secrets}=buildStagingDeployment({...env,...providers,E2E_ADMIN_PASSWORD:'private-test-password'});
 assert.equal(config.vars.CALENDLY_EVENT_TYPE_URI,providers.CALENDLY_EVENT_TYPE_URI);
 assert.equal(secrets.CALENDLY_API_TOKEN,providers.CALENDLY_API_TOKEN);
 assert.equal(secrets.CALENDLY_WEBHOOK_SECRET,providers.CALENDLY_WEBHOOK_SECRET);
 const publicConfig=JSON.stringify(config);for(const key of ['CALENDLY_API_TOKEN','CALENDLY_WEBHOOK_SECRET','ANTHROPIC_API_KEY','DATABASE_URL'])assert.ok(!publicConfig.includes(providers[key]??env[key]));
 assert.ok(!JSON.stringify({config,secrets}).includes('private-test-password'));
});
