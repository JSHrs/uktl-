ALTER TABLE recruitment.privacy_requests DROP CONSTRAINT privacy_requests_user_id_fkey;
ALTER TABLE recruitment.privacy_requests ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE recruitment.privacy_requests ADD CONSTRAINT privacy_requests_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE TABLE recruitment.account_erasures(
 request_id uuid PRIMARY KEY REFERENCES recruitment.privacy_requests(id) ON DELETE RESTRICT,
 target_user_id uuid UNIQUE, approved_by uuid NOT NULL, file_deletion_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
 status text NOT NULL CHECK(status IN ('pending','completed')), created_at bigint NOT NULL, completed_at bigint
);
ALTER TABLE recruitment.account_erasures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.account_erasures FROM PUBLIC,anon,authenticated;
GRANT ALL ON recruitment.account_erasures TO service_role;
CREATE INDEX account_erasures_pending ON recruitment.account_erasures(created_at) WHERE status='pending';
CREATE TRIGGER audit_mutation AFTER INSERT OR UPDATE OR DELETE ON recruitment.account_erasures FOR EACH ROW EXECUTE FUNCTION recruitment.audit_mutation();

-- Serialize new owner writes against erasure. In-flight requests cannot recreate
-- deleted records after the deletion manifest commits. No Auth-managed tables modified.
CREATE FUNCTION recruitment.reject_erased_owner_write() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner uuid; row_data jsonb:=to_jsonb(NEW);
BEGIN
 owner:=COALESCE(row_data->>'auth_user_id',row_data->>'user_id',CASE WHEN TG_TABLE_SCHEMA='public' AND TG_TABLE_NAME='profiles' THEN row_data->>'id' END)::uuid;
 IF owner IS NULL THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner::text,74142));
 IF EXISTS(SELECT 1 FROM recruitment.account_erasures WHERE target_user_id=owner) THEN RAISE EXCEPTION 'Account removal is in progress'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION recruitment.reject_erased_owner_write() FROM PUBLIC,anon,authenticated;
-- This guard is backend-only: public profiles use their existing RLS and are
-- removed through Auth at completion; adding a private-table query to their
-- user-scoped trigger would accidentally deny all normal profile updates.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['candidates','hr_queries','bookings','booking_intents','faq_plays'] LOOP
  EXECUTE format('CREATE TRIGGER reject_erased_owner_write BEFORE INSERT OR UPDATE ON recruitment.%I FOR EACH ROW EXECUTE FUNCTION recruitment.reject_erased_owner_write()',t);
 END LOOP;
END $$;

CREATE FUNCTION recruitment.begin_account_erasure(request uuid,actor uuid,review_complete boolean) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner uuid; candidate record; file_ids jsonb:='[]'::jsonb; t bigint:=floor(extract(epoch FROM clock_timestamp())*1000);
BEGIN
 IF review_complete IS DISTINCT FROM true THEN RAISE EXCEPTION 'Retention and provider review required'; END IF;
 SELECT user_id INTO owner FROM recruitment.privacy_requests WHERE id=request AND kind='erasure' AND status IN ('pending','reviewing') FOR UPDATE;
 IF NOT FOUND THEN
  IF EXISTS(SELECT 1 FROM recruitment.account_erasures WHERE request_id=request) THEN RETURN request; END IF;
  RAISE EXCEPTION 'Erasure request not available';
 END IF;
 IF EXISTS(SELECT 1 FROM recruitment.account_erasures WHERE request_id=request) THEN RETURN request; END IF;
 IF owner IS NULL OR owner=actor OR EXISTS(SELECT 1 FROM recruitment.staff_users WHERE user_id=owner) THEN RAISE EXCEPTION 'Staff accounts require a separate recovery process'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner::text,74142));
 IF EXISTS(SELECT 1 FROM recruitment.account_erasures WHERE request_id=request) THEN RETURN request; END IF;
 IF (SELECT count(*) FROM recruitment.candidates WHERE auth_user_id=owner)>1000 THEN RAISE EXCEPTION 'Account requires a bounded manual deletion plan'; END IF;
 -- Prevent new writes before removing any data; this insert is committed atomically.
 INSERT INTO recruitment.account_erasures(request_id,target_user_id,approved_by,status,created_at) VALUES(request,owner,actor,'pending',t);
 FOR candidate IN SELECT id FROM recruitment.candidates WHERE auth_user_id=owner ORDER BY id LOOP
  file_ids:=file_ids||jsonb_build_array(recruitment.queue_candidate_erasure(candidate.id,actor));
 END LOOP;
 DELETE FROM recruitment.bookings WHERE auth_user_id=owner;
 DELETE FROM recruitment.booking_intents WHERE user_id=owner;
 DELETE FROM recruitment.hr_queries WHERE auth_user_id=owner;
 DELETE FROM recruitment.faq_plays WHERE user_id=owner;
 DELETE FROM public.bookings WHERE user_id=owner;
 DELETE FROM public.hr_queries WHERE user_id=owner;
 DELETE FROM recruitment.privacy_requests WHERE user_id=owner AND id<>request;
 -- Auth deletion will remove the account/profile after private object cleanup.
 UPDATE recruitment.account_erasures SET file_deletion_ids=file_ids WHERE request_id=request;
 UPDATE recruitment.privacy_requests SET user_id=NULL,status='reviewing',reviewed_by=actor,updated_at=t,resolution='Approved account removal is in progress.' WHERE id=request;
 RETURN request;
END $$;
REVOKE ALL ON FUNCTION recruitment.begin_account_erasure(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION recruitment.begin_account_erasure(uuid,uuid,boolean) TO service_role;
