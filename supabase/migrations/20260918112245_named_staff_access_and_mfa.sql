-- Staff privileges depend on live membership and Auth session, never user metadata.
CREATE SCHEMA IF NOT EXISTS uktl_private;
REVOKE ALL ON SCHEMA uktl_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA uktl_private TO authenticated;

CREATE FUNCTION uktl_private.my_staff_access() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object('role', staff.role, 'mfa_verified',
      COALESCE(auth.jwt()->>'aal' = 'aal2' AND sess.aal = 'aal2' AND EXISTS (
        SELECT 1 FROM auth.mfa_factors factor
        WHERE factor.id = sess.factor_id AND factor.user_id = staff.user_id
          AND factor.status = 'verified'
      ), false))
    FROM recruitment.staff_users staff
    JOIN auth.users usr ON usr.id = staff.user_id
    JOIN auth.sessions sess ON sess.user_id = usr.id AND sess.id::text = auth.jwt()->>'session_id'
    WHERE staff.user_id = auth.uid() AND staff.active
      AND usr.email_confirmed_at IS NOT NULL
      AND (usr.banned_until IS NULL OR usr.banned_until <= now())
      AND (sess.not_after IS NULL OR sess.not_after > now())
  ), '{"role":null,"mfa_verified":false}'::jsonb);
$$;
REVOKE ALL ON FUNCTION uktl_private.my_staff_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION uktl_private.my_staff_access() TO authenticated;

CREATE FUNCTION public.get_my_staff_access() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT uktl_private.my_staff_access();
$$;
REVOKE ALL ON FUNCTION public.get_my_staff_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_staff_access() TO authenticated;

CREATE FUNCTION uktl_private.staff_role() RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT CASE WHEN (access->>'mfa_verified')::boolean THEN access->>'role' END
  FROM (SELECT uktl_private.my_staff_access() AS access) verified;
$$;
REVOKE ALL ON FUNCTION uktl_private.staff_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION uktl_private.staff_role() TO authenticated;

-- Candidate ownership policies remain in force. Staff only receive the minimum
-- read access needed by current screens; mutations are authenticated server actions.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['candidates','candidate_skills','candidate_experience','candidate_education','matches','jobs','candidate_swipes','applications','saved_jobs','cv_versions','candidate_consents','stage_history'] LOOP
    EXECUTE format('GRANT SELECT ON recruitment.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY verified_staff_read ON recruitment.%I FOR SELECT TO authenticated USING ((SELECT uktl_private.staff_role()) IN (''admin'',''consultant''))',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['faq_topics','bookings','hr_queries','enquiries','audit_events'] LOOP
    EXECUTE format('GRANT SELECT ON recruitment.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY verified_admin_read ON recruitment.%I FOR SELECT TO authenticated USING ((SELECT uktl_private.staff_role()) = ''admin'')',t);
  END LOOP;
END $$;

-- No authenticated grant/policy to mutate staff_users or protected profile roles.
CREATE FUNCTION uktl_private.touch_profile() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
REVOKE ALL ON FUNCTION uktl_private.touch_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION uktl_private.touch_profile();
