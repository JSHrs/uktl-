-- Safe on an empty live schema or isolated CI database: all fixtures roll back.
BEGIN;
SET LOCAL search_path=recruitment,public;
DO $$
DECLARE u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); c text:=gen_random_uuid()::text;
 j text:=gen_random_uuid()::text; work recruitment.processing_jobs; next_work recruitment.processing_jobs;
 n bigint:=floor(extract(epoch FROM clock_timestamp())*1000); rev integer;
BEGIN
 IF EXISTS(SELECT 1 FROM processing_jobs WHERE status IN ('pending','running')) THEN RAISE EXCEPTION 'Use isolated database: active queue exists'; END IF;
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(u,u||'@example.invalid',now()),(other_user,other_user||'@example.invalid',now());
 INSERT INTO candidates(id,created_at,updated_at,status,auth_user_id) VALUES(c,n,n,'uploaded',u);
 INSERT INTO processing_jobs(id,candidate_id,kind,status,idempotency_key,available_at,created_at,updated_at) VALUES(j,c,'parse','pending',j,n,n,n);
 SELECT * INTO work FROM recruitment.claim_cv_job();
 IF work.id<>j OR work.attempts<>1 OR work.lease_token IS NULL THEN RAISE EXCEPTION 'Claim failed'; END IF;
 IF EXISTS(SELECT 1 FROM recruitment.claim_cv_job()) THEN RAISE EXCEPTION 'Active lease claimed twice'; END IF;
 PERFORM recruitment.assert_cv_lease(j,work.lease_token);
 BEGIN
   PERFORM recruitment.assert_cv_lease(j,gen_random_uuid());
   RAISE EXCEPTION 'Invalid token accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 UPDATE processing_jobs SET locked_at=n-900001 WHERE id=j;
 SELECT * INTO next_work FROM recruitment.claim_cv_job();
 IF next_work.attempts<>2 OR next_work.lease_token=work.lease_token THEN RAISE EXCEPTION 'Crash recovery failed'; END IF;
 BEGIN
   PERFORM recruitment.assert_cv_lease(j,work.lease_token);
   RAISE EXCEPTION 'Expired token accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
   PERFORM recruitment.revise_cv_profile(c,other_user,0,'{"name":"Intruder"}');
   RAISE EXCEPTION 'Wrong owner accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 SELECT recruitment.revise_cv_profile(c,u,0,'{"name":"Corrected","skills":[],"experience":[],"education":[]}') INTO rev;
 IF rev<>1 OR (SELECT name FROM candidates WHERE id=c)<>'Corrected' THEN RAISE EXCEPTION 'Correction failed'; END IF;
 BEGIN
   PERFORM recruitment.revise_cv_profile(c,u,0,'{"name":"Stale edit"}');
   RAISE EXCEPTION 'Stale edit accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
   PERFORM recruitment.assert_cv_lease(j,next_work.lease_token);
   UPDATE candidates SET name='Old AI result' WHERE id=c;
   RAISE EXCEPTION 'Superseded worker accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 IF (SELECT name FROM candidates WHERE id=c)<>'Corrected' THEN RAISE EXCEPTION 'Correction overwritten'; END IF;
 SELECT * INTO work FROM recruitment.claim_cv_job();
 IF work.kind<>'match' OR work.profile_revision<>1 THEN RAISE EXCEPTION 'Revision not queued'; END IF;
 PERFORM recruitment.fail_cv_job(work.id,work.lease_token);
 IF (SELECT status FROM processing_jobs WHERE id=work.id)<>'pending' THEN RAISE EXCEPTION 'Retry not pending'; END IF;
 IF EXISTS(SELECT 1 FROM recruitment.claim_cv_job()) THEN RAISE EXCEPTION 'Backoff ignored'; END IF;
 UPDATE processing_jobs SET available_at=n-1 WHERE id=work.id;
 SELECT * INTO work FROM recruitment.claim_cv_job();
 PERFORM recruitment.fail_cv_job(work.id,work.lease_token);
 UPDATE processing_jobs SET available_at=n-1 WHERE id=work.id;
 SELECT * INTO work FROM recruitment.claim_cv_job();
 IF work.attempts<>3 THEN RAISE EXCEPTION 'Attempt count incorrect'; END IF;
 -- Crash on last attempt is terminal after lease expiry.
 UPDATE processing_jobs SET locked_at=n-900001 WHERE id=work.id;
 IF EXISTS(SELECT 1 FROM recruitment.claim_cv_job()) THEN RAISE EXCEPTION 'Retry ceiling exceeded'; END IF;
 IF (SELECT status FROM candidates WHERE id=c)<>'failed' THEN RAISE EXCEPTION 'Exhausted candidate not marked'; END IF;
 IF has_function_privilege('authenticated','recruitment.claim_cv_job()','EXECUTE') OR has_function_privilege('anon','recruitment.revise_cv_profile(text,uuid,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'Backend function exposed'; END IF;
END $$;
ROLLBACK;
