BEGIN;
SET LOCAL search_path=recruitment,public;
INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ('90000000-0000-4000-8000-000000000001','operations-fixture@example.invalid',now());
SELECT set_config('uktl.actor_id','90000000-0000-4000-8000-000000000001',true);
INSERT INTO candidates(id,created_at,updated_at,status,source_r2_key,auth_user_id) VALUES('ops-candidate',1,1,'uploaded','cvs/ops-candidate/fixture.pdf','90000000-0000-4000-8000-000000000001');
INSERT INTO cv_versions(id,candidate_id,version,storage_key,filename,content_type,size_bytes,created_at) VALUES('ops-version','ops-candidate',1,'cvs/ops-candidate/old.pdf','old.pdf','application/pdf',20,1);
INSERT INTO processing_jobs(id,candidate_id,kind,status,idempotency_key,available_at,created_at,updated_at) VALUES('ops-job','ops-candidate','parse','pending','ops-job',1,1,1);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM audit_events WHERE entity_id='ops-candidate' AND actor_user_id='90000000-0000-4000-8000-000000000001' AND action='insert') THEN RAISE EXCEPTION 'Audit actor missing'; END IF;
END $$;
SELECT queue_candidate_erasure('ops-candidate','90000000-0000-4000-8000-000000000001');
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM candidates WHERE id='ops-candidate') OR EXISTS(SELECT 1 FROM processing_jobs WHERE id='ops-job') THEN RAISE EXCEPTION 'Erasure failed to invalidate worker'; END IF;
 IF NOT EXISTS(SELECT 1 FROM file_deletions WHERE candidate_id='ops-candidate' AND jsonb_array_length(storage_keys)=2 AND status='pending') THEN RAISE EXCEPTION 'Deletion lost object keys'; END IF;
 IF (SELECT count(*) FROM file_deletions WHERE candidate_id='ops-candidate')<>1 THEN RAISE EXCEPTION 'Duplicate deletion'; END IF;
END $$;
SELECT queue_candidate_erasure('ops-candidate','90000000-0000-4000-8000-000000000001');
INSERT INTO privacy_requests(user_id,kind,created_at,updated_at) VALUES('90000000-0000-4000-8000-000000000001','erasure',1,1);
DO $$ BEGIN
 BEGIN
 INSERT INTO privacy_requests(user_id,kind,created_at,updated_at) VALUES('90000000-0000-4000-8000-000000000001','erasure',1,1);
 RAISE EXCEPTION 'Duplicate active privacy request permitted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;
SELECT begin_ai_usage('fixture','fixture-model',1);
DO $$ BEGIN
 BEGIN PERFORM begin_ai_usage('fixture','fixture-model',1); RAISE EXCEPTION 'Budget not enforced';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Budget not enforced' THEN RAISE; END IF; END;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF has_table_privilege(current_user,'recruitment.privacy_requests','SELECT') OR has_table_privilege(current_user,'recruitment.file_deletions','SELECT') OR has_table_privilege(current_user,'recruitment.ai_usage','INSERT') THEN RAISE EXCEPTION 'Private operational data exposed'; END IF;
 IF has_function_privilege(current_user,'recruitment.queue_candidate_erasure(text,uuid)','EXECUTE') OR has_function_privilege(current_user,'recruitment.begin_ai_usage(text,text,integer)','EXECUTE') THEN RAISE EXCEPTION 'Privileged function exposed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
