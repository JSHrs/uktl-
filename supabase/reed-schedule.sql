-- Operator activation only, after staging acceptance. Not a migration.
-- Wake every ten minutes; saved state starts at most one completed cycle per UTC day.
-- 202 means ongoing progress, 200 means completed cycles, 503 means an error.
-- Provision these Vault entries securely first:
-- uktl_reed_function_url: exact https://<staging-project>.supabase.co/functions/v1/reed-sync
-- uktl_cron_secret: same >=32-character secret as Edge UKTL_CRON_SECRET and Worker CRON_SECRET.
-- Enable pg_cron and pg_net using the project dashboard before running.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='uktl_reed_function_url'
      AND decrypted_secret ~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/reed-sync$')
     OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='uktl_cron_secret' AND length(decrypted_secret)>=32)
  THEN RAISE EXCEPTION 'Verified function URL and cron secret must be configured first'; END IF;
END $$;
SELECT cron.schedule('uktl-reed-daily','*/10 * * * *', $job$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='uktl_reed_function_url'),
    headers := jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='uktl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$job$);
