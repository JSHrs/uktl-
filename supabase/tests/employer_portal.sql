-- Isolated CI fixtures only; everything rolls back.
-- Employer portal tables are service-only: no browser role can read or write them,
-- including the employer who owns the rows (the app authorises every request).
BEGIN;
DO $$ DECLARE owner uuid:=gen_random_uuid(); t text; BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(owner,owner||'@example.invalid',now());
 INSERT INTO recruitment.employer_roles(id,owner_user_id,created_at,updated_at,title) VALUES('er_00000000000000aa',owner,1,1,'Fixture');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner,'role','authenticated')::text,true);
 FOREACH t IN ARRAY ARRAY['employer_profiles','employer_roles','employer_shortlist'] LOOP
  SET LOCAL ROLE authenticated;
  BEGIN EXECUTE format('SELECT 1 FROM recruitment.%I LIMIT 1',t); RAISE EXCEPTION 'authenticated read %',t; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  SET LOCAL ROLE anon;
  BEGIN EXECUTE format('SELECT 1 FROM recruitment.%I LIMIT 1',t); RAISE EXCEPTION 'anon read %',t; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='recruitment' AND tablename=t AND policyname='backend_service_access') THEN RAISE EXCEPTION 'missing service policy on %',t; END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('recruitment.'||t)::regclass) THEN RAISE EXCEPTION 'RLS off on %',t; END IF;
 END LOOP;
 BEGIN INSERT INTO recruitment.employer_roles(id,owner_user_id,created_at,updated_at,title,status) VALUES('er_00000000000000ab',owner,1,1,'Bad','approved'); RAISE EXCEPTION 'status not constrained'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;
