-- Backend-only operational records. Never store CV text, email or provider bodies here.
CREATE TABLE recruitment.privacy_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('export','erasure')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','completed','declined')),
 created_at bigint NOT NULL, updated_at bigint NOT NULL, reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 resolution text CHECK(length(resolution)<=1000)
);
CREATE UNIQUE INDEX privacy_request_open ON recruitment.privacy_requests(user_id,kind) WHERE status IN ('pending','reviewing');
CREATE INDEX privacy_request_queue ON recruitment.privacy_requests(status,created_at);
CREATE INDEX privacy_reviewed_by ON recruitment.privacy_requests(reviewed_by);
CREATE TABLE recruitment.file_deletions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id text NOT NULL UNIQUE,
 requested_by uuid, storage_keys jsonb NOT NULL CHECK(jsonb_typeof(storage_keys)='array'),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed')),
 created_at bigint NOT NULL, completed_at bigint
);
CREATE INDEX file_deletions_queue ON recruitment.file_deletions(status,created_at);
CREATE TABLE recruitment.ai_usage (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), purpose text NOT NULL, model text NOT NULL,
 status text NOT NULL CHECK(status IN ('started','succeeded','failed')), input_tokens bigint, output_tokens bigint,
 cache_read_tokens bigint, cache_write_tokens bigint, created_at bigint NOT NULL, completed_at bigint,
 CHECK(input_tokens>=0 AND output_tokens>=0 AND cache_read_tokens>=0 AND cache_write_tokens>=0)
);
CREATE INDEX ai_usage_created ON recruitment.ai_usage(created_at);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['privacy_requests','file_deletions','ai_usage'] LOOP
  EXECUTE format('ALTER TABLE recruitment.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON recruitment.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON recruitment.%I TO service_role',t);
 END LOOP;
END $$;
-- Minimal audit payload: mutations are logged in the same transaction. No row snapshots.
CREATE FUNCTION recruitment.audit_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE row_data jsonb; actor uuid; BEGIN
 row_data:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 actor:=nullif(current_setting('uktl.actor_id',true),'')::uuid;
 INSERT INTO recruitment.audit_events(actor_user_id,actor_kind,action,entity_type,entity_id)
 VALUES(actor,CASE WHEN actor IS NULL THEN 'system' ELSE 'user' END,lower(TG_OP),TG_TABLE_NAME,
 COALESCE(row_data->>'id',row_data->>'request_id',row_data->>'user_id',(row_data->>'candidate_id')||':'||(row_data->>'job_id'),'unknown'));
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION recruitment.audit_mutation() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['candidates','jobs','matches','faq_topics','hr_sources','bookings','enquiries','staff_users','privacy_requests','file_deletions'] LOOP
  EXECUTE format('CREATE TRIGGER audit_mutation AFTER INSERT OR UPDATE OR DELETE ON recruitment.%I FOR EACH ROW EXECUTE FUNCTION recruitment.audit_mutation()',t);
 END LOOP;
END $$;
REVOKE UPDATE,DELETE,TRUNCATE ON recruitment.audit_events FROM service_role;

-- A candidate deletion first preserves every private object key, then deletes the
-- row in one transaction. FK cascades invalidate active worker leases. Storage is
-- removed afterwards by an idempotent retryable worker; no untracked orphan keys.
CREATE FUNCTION recruitment.queue_candidate_erasure(candidate text, actor uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE deletion uuid; keys jsonb; owner uuid;
BEGIN
 PERFORM 1 FROM recruitment.candidates WHERE id=candidate FOR UPDATE;
 IF NOT FOUND THEN SELECT id INTO deletion FROM recruitment.file_deletions WHERE candidate_id=candidate; RETURN deletion; END IF;
 SELECT auth_user_id INTO owner FROM recruitment.candidates WHERE id=candidate;
 SELECT COALESCE(jsonb_agg(k),'[]'::jsonb) INTO keys FROM (
 SELECT source_r2_key k FROM recruitment.candidates WHERE id=candidate AND source_r2_key IS NOT NULL
 UNION SELECT storage_key FROM recruitment.cv_versions WHERE candidate_id=candidate) paths;
 INSERT INTO recruitment.file_deletions(candidate_id,requested_by,storage_keys,created_at)
 VALUES(candidate,actor,keys,floor(extract(epoch FROM clock_timestamp())*1000)) RETURNING id INTO deletion;
 UPDATE public.profiles SET d1_candidate_id=NULL WHERE d1_candidate_id=candidate;
 DELETE FROM recruitment.candidates WHERE id=candidate;
 RETURN deletion;
END $$;
REVOKE ALL ON FUNCTION recruitment.queue_candidate_erasure(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION recruitment.queue_candidate_erasure(text,uuid) TO service_role;
CREATE FUNCTION recruitment.begin_ai_usage(purpose_name text, model_name text, hourly_limit integer) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE call_id uuid; t bigint:=floor(extract(epoch FROM clock_timestamp())*1000); n bigint;
BEGIN
 IF hourly_limit<1 OR hourly_limit>10000 OR length(purpose_name)>50 OR length(model_name)>100 THEN RAISE EXCEPTION 'Invalid AI budget configuration'; END IF;
 PERFORM pg_advisory_xact_lock(492741128);
 SELECT count(*) INTO n FROM recruitment.ai_usage WHERE created_at>t-3600000;
 IF n>=hourly_limit THEN RAISE EXCEPTION 'AI request budget reached'; END IF;
 INSERT INTO recruitment.ai_usage(purpose,model,status,created_at) VALUES(purpose_name,model_name,'started',t) RETURNING id INTO call_id;
 RETURN call_id;
END $$;
REVOKE ALL ON FUNCTION recruitment.begin_ai_usage(text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION recruitment.begin_ai_usage(text,text,integer) TO service_role;
