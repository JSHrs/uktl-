-- Backend-only durable work. Browser roles cannot claim leases or supply worker tokens.
ALTER TABLE recruitment.candidates ADD COLUMN profile_revision integer NOT NULL DEFAULT 0 CHECK (profile_revision >= 0);
ALTER TABLE recruitment.processing_jobs ADD COLUMN profile_revision integer NOT NULL DEFAULT 0 CHECK (profile_revision >= 0);
ALTER TABLE recruitment.processing_jobs ADD COLUMN lease_token uuid;
CREATE INDEX processing_expired_leases ON recruitment.processing_jobs(locked_at) WHERE status='running';

CREATE FUNCTION recruitment.claim_cv_job()
RETURNS SETOF recruitment.processing_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE work recruitment.processing_jobs; now_ms bigint := floor(extract(epoch FROM clock_timestamp())*1000);
BEGIN
  -- A crash on the final attempt must not leave work running forever.
  WITH exhausted AS (
    UPDATE recruitment.processing_jobs SET status='failed', lease_token=NULL,
      last_error='Processing could not complete after three attempts.', updated_at=now_ms
    WHERE kind IN ('parse','match') AND status='running' AND locked_at < now_ms-900000 AND attempts>=3
    RETURNING candidate_id,profile_revision
  ) UPDATE recruitment.candidates c SET status='failed',parse_error='Processing could not complete after three attempts.',updated_at=now_ms
    FROM exhausted e WHERE c.id=e.candidate_id AND c.profile_revision=e.profile_revision;
  SELECT j.* INTO work FROM recruitment.processing_jobs j JOIN recruitment.candidates c ON c.id=j.candidate_id
    WHERE j.kind IN ('parse','match') AND j.profile_revision=c.profile_revision AND j.attempts<3
      AND ((j.status='pending' AND j.available_at<=now_ms) OR (j.status='running' AND j.locked_at<now_ms-900000))
    ORDER BY j.available_at,j.id LIMIT 1 FOR UPDATE OF j,c SKIP LOCKED;
  IF work.id IS NULL THEN RETURN; END IF;
  UPDATE recruitment.processing_jobs SET status='running',attempts=attempts+1,locked_at=now_ms,
    lease_token=gen_random_uuid(),updated_at=now_ms WHERE id=work.id RETURNING * INTO work;
  UPDATE recruitment.candidates SET status='parsing',parse_error=NULL,updated_at=now_ms WHERE id=work.candidate_id;
  RETURN NEXT work;
END $$;

-- This MUST be the first statement in the same transaction as all result writes.
CREATE FUNCTION recruitment.assert_cv_lease(job_id text, token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM recruitment.processing_jobs j JOIN recruitment.candidates c ON c.id=j.candidate_id
    WHERE j.id=job_id AND j.lease_token=token AND j.status='running'
      AND j.profile_revision=c.profile_revision
      AND j.locked_at>=floor(extract(epoch FROM clock_timestamp())*1000)-900000
    FOR UPDATE OF j,c;
  IF NOT FOUND THEN RAISE EXCEPTION 'Processing lease is no longer current'; END IF;
  RETURN true;
END $$;

CREATE FUNCTION recruitment.fail_cv_job(job_id text,token uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE work recruitment.processing_jobs; now_ms bigint := floor(extract(epoch FROM clock_timestamp())*1000);
BEGIN
  PERFORM recruitment.assert_cv_lease(job_id,token);
  SELECT * INTO work FROM recruitment.processing_jobs WHERE id=job_id;
  UPDATE recruitment.processing_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'pending' END,
    available_at=now_ms+CASE WHEN attempts=1 THEN 60000 ELSE 300000 END,
    last_error='Processing is temporarily unavailable. Your private upload has been retained.',
    lease_token=NULL,locked_at=NULL,updated_at=now_ms WHERE id=job_id;
  UPDATE recruitment.candidates SET status=CASE WHEN work.attempts>=3 THEN 'failed' ELSE 'uploaded' END,
    parse_error=CASE WHEN work.attempts>=3 THEN 'Processing could not complete after three attempts.' ELSE NULL END,
    updated_at=now_ms WHERE id=work.candidate_id;
END $$;

-- Called by the authenticated server after bounded input validation. Ownership and
-- optimistic revision are also checked under a row lock, not merely in the UI.
CREATE FUNCTION recruitment.revise_cv_profile(candidate text,owner_id uuid,expected_revision integer,profile_text text)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE revision integer; now_ms bigint := floor(extract(epoch FROM clock_timestamp())*1000); p jsonb:=profile_text::jsonb;
BEGIN
  IF octet_length(profile_text)>100000 OR jsonb_typeof(p)<>'object' THEN RAISE EXCEPTION 'Invalid profile'; END IF;
  SELECT profile_revision INTO revision FROM recruitment.candidates WHERE id=candidate AND auth_user_id=owner_id FOR UPDATE;
  IF NOT FOUND OR revision<>expected_revision THEN RAISE EXCEPTION 'Profile changed or is unavailable; reload before saving'; END IF;
  UPDATE recruitment.processing_jobs SET status='failed',lease_token=NULL,last_error='Superseded by a profile correction.',updated_at=now_ms
    WHERE candidate_id=candidate AND status IN ('pending','running');
  revision:=revision+1;
  UPDATE recruitment.candidates SET raw_profile=profile_text,profile_revision=revision,status='uploaded',parse_error=NULL,
    name=p->>'name',email=p->>'email',phone=p->>'phone',location=p->>'location',headline=p->>'headline',summary=p->>'summary',
    quality_score=NULL,quality_notes=NULL,score_breakdown=NULL,improvement_report=NULL,updated_at=now_ms WHERE id=candidate;
  INSERT INTO recruitment.processing_jobs(id,candidate_id,kind,status,attempts,idempotency_key,profile_revision,available_at,created_at,updated_at)
    VALUES(gen_random_uuid()::text,candidate,'match','pending',0,candidate||':revision:'||revision,revision,now_ms,now_ms,now_ms);
  RETURN revision;
END $$;

REVOKE ALL ON FUNCTION recruitment.claim_cv_job(),recruitment.assert_cv_lease(text,uuid),recruitment.fail_cv_job(text,uuid),recruitment.revise_cv_profile(text,uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION recruitment.claim_cv_job(),recruitment.assert_cv_lease(text,uuid),recruitment.fail_cv_job(text,uuid),recruitment.revise_cv_profile(text,uuid,integer,text) TO service_role;
