-- Explicit service-only policies; browser roles retain no grants or policies.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['privacy_requests','file_deletions','ai_usage','account_erasures'] LOOP
  EXECUTE format('CREATE POLICY backend_service_access ON recruitment.%I TO service_role USING (true) WITH CHECK (true)',t);
 END LOOP;
END $$;
