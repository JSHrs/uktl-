-- Run as postgres, with ON_ERROR_STOP. Fixtures are always rolled back.
BEGIN;
DO $$
DECLARE
  admin_id uuid := gen_random_uuid(); candidate_id uuid := gen_random_uuid();
  session_id uuid := gen_random_uuid(); factor_id uuid := gen_random_uuid();
  fixture_id text := gen_random_uuid()::text; access jsonb; row_count integer;
BEGIN
  INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
    VALUES(admin_id,admin_id||'@example.invalid',now(),'{"role":"admin"}'),
          (candidate_id,candidate_id||'@example.invalid',now(),'{"role":"admin"}');
  INSERT INTO recruitment.staff_users(user_id,role,active,created_at) VALUES(admin_id,'admin',true,1);
  INSERT INTO auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
    VALUES(factor_id,admin_id,'totp','verified',now(),now());
  INSERT INTO auth.sessions(id,user_id,factor_id,aal,created_at,updated_at)
    VALUES(session_id,admin_id,factor_id,'aal2',now(),now());
  INSERT INTO recruitment.candidates(id,created_at,updated_at,status,auth_user_id)
    VALUES(fixture_id,1,1,'uploaded',candidate_id);
  INSERT INTO recruitment.faq_topics(id,title,category,keywords,created_at) VALUES(fixture_id,'RLS fixture','general','[]',1);

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'session_id',session_id,'aal','aal2','role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  access := public.get_my_staff_access();
  IF access <> '{"role":"admin","mfa_verified":true}'::jsonb THEN RAISE EXCEPTION 'Admin AAL2 rejected: %',access; END IF;
  IF NOT EXISTS(SELECT 1 FROM recruitment.candidates WHERE id=fixture_id) THEN RAISE EXCEPTION 'Admin cannot read candidate'; END IF;
  IF NOT EXISTS(SELECT 1 FROM recruitment.faq_topics WHERE id=fixture_id) THEN RAISE EXCEPTION 'Admin cannot read FAQ'; END IF;
  BEGIN
    UPDATE recruitment.staff_users SET role='admin' WHERE user_id=admin_id;
    RAISE EXCEPTION 'Self-promotion allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;

  -- Consultant has recruitment access but no admin content access.
  UPDATE recruitment.staff_users SET role='consultant' WHERE user_id=admin_id;
  SET LOCAL ROLE authenticated;
  IF (public.get_my_staff_access()->>'role') <> 'consultant' THEN RAISE EXCEPTION 'Role change not immediate'; END IF;
  IF NOT EXISTS(SELECT 1 FROM recruitment.candidates WHERE id=fixture_id) THEN RAISE EXCEPTION 'Consultant cannot read candidate'; END IF;
  IF EXISTS(SELECT 1 FROM recruitment.faq_topics WHERE id=fixture_id) THEN RAISE EXCEPTION 'Consultant acquired admin scope'; END IF;
  RESET ROLE;

  -- JWT AAL1 never receives staff privilege even when the session was upgraded.
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'session_id',session_id,'aal','aal1')::text,true);
  SET LOCAL ROLE authenticated;
  IF (public.get_my_staff_access()->>'mfa_verified')::boolean THEN RAISE EXCEPTION 'AAL1 granted MFA'; END IF;
  IF EXISTS(SELECT 1 FROM recruitment.candidates WHERE id=fixture_id) THEN RAISE EXCEPTION 'AAL1 cross-account access'; END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'session_id',session_id,'aal','aal2')::text,true);

  UPDATE recruitment.staff_users SET active=false WHERE user_id=admin_id;
  SET LOCAL ROLE authenticated;
  IF public.get_my_staff_access()->>'role' IS NOT NULL THEN RAISE EXCEPTION 'Inactive staff retained role'; END IF;
  IF EXISTS(SELECT 1 FROM recruitment.candidates WHERE id=fixture_id) THEN RAISE EXCEPTION 'Inactive staff read candidate'; END IF;
  RESET ROLE;
  UPDATE recruitment.staff_users SET active=true WHERE user_id=admin_id;

  UPDATE auth.users SET email_confirmed_at=NULL WHERE id=admin_id;
  SET LOCAL ROLE authenticated;
  IF public.get_my_staff_access()->>'role' IS NOT NULL THEN RAISE EXCEPTION 'Unverified email accepted'; END IF;
  RESET ROLE;
  UPDATE auth.users SET email_confirmed_at=now(),banned_until=now()+interval '1 hour' WHERE id=admin_id;
  SET LOCAL ROLE authenticated;
  IF public.get_my_staff_access()->>'role' IS NOT NULL THEN RAISE EXCEPTION 'Banned user accepted'; END IF;
  RESET ROLE;
  UPDATE auth.users SET banned_until=NULL WHERE id=admin_id;

  UPDATE auth.mfa_factors SET status='unverified' WHERE id=factor_id;
  SET LOCAL ROLE authenticated;
  IF (public.get_my_staff_access()->>'mfa_verified')::boolean THEN RAISE EXCEPTION 'Removed factor accepted'; END IF;
  RESET ROLE;
  UPDATE auth.mfa_factors SET status='verified' WHERE id=factor_id;
  UPDATE auth.sessions SET not_after=now()-interval '1 minute' WHERE id=session_id;
  SET LOCAL ROLE authenticated;
  IF public.get_my_staff_access()->>'role' IS NOT NULL THEN RAISE EXCEPTION 'Expired session accepted'; END IF;
  RESET ROLE;
  DELETE FROM auth.sessions WHERE id=session_id;
  SET LOCAL ROLE authenticated;
  IF public.get_my_staff_access()->>'role' IS NOT NULL THEN RAISE EXCEPTION 'Revoked session accepted'; END IF;
  RESET ROLE;

  -- Metadata cannot promote a candidate; ownership policies still function.
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',candidate_id,'aal','aal2','user_metadata',jsonb_build_object('role','admin'))::text,true);
  SET LOCAL ROLE authenticated;
  IF public.get_my_staff_access()->>'role' IS NOT NULL THEN RAISE EXCEPTION 'Metadata promotion accepted'; END IF;
  IF NOT EXISTS(SELECT 1 FROM recruitment.candidates WHERE id=fixture_id) THEN RAISE EXCEPTION 'Candidate lost own access'; END IF;
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id=admin_id) THEN RAISE EXCEPTION 'Cross-account profile leaked'; END IF;
  UPDATE public.profiles SET name='Updated candidate' WHERE id=candidate_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count <> 1 THEN RAISE EXCEPTION 'Own profile update failed'; END IF;
  UPDATE public.profiles SET name='Forbidden' WHERE id=admin_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count <> 0 THEN RAISE EXCEPTION 'Cross-account update allowed'; END IF;
  BEGIN
    UPDATE public.profiles SET d1_candidate_id=fixture_id WHERE id=candidate_id;
    RAISE EXCEPTION 'Protected profile column allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM public.get_my_staff_access();
    RAISE EXCEPTION 'Anonymous staff RPC allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
END $$;
ROLLBACK;
SELECT 'PASS: staff roles, MFA, revocation, candidate ownership and protected writes; all fixtures rolled back' AS result;
