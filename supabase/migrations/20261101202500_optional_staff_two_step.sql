-- Owner decision (1 November 2026): two-step verification is optional for staff,
-- as it is for candidates and employers. Staff can switch it on in their settings.
--
-- `mfa_verified` keeps its meaning "this session meets the account's two-step
-- requirement", so every caller (staff_role(), RLS policies, hasStaffAccess) is
-- unchanged:
--   * a staff member with no verified authenticator: any live session qualifies;
--   * a staff member who has turned an authenticator on: the session must still be
--     AAL2 and bound to that verified factor, exactly as before.
-- Membership, active flag, confirmed email, ban and live-session checks are unchanged.
CREATE OR REPLACE FUNCTION uktl_private.my_staff_access() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object('role', staff.role, 'mfa_verified',
      COALESCE(
        NOT EXISTS (
          SELECT 1 FROM auth.mfa_factors f
          WHERE f.user_id = staff.user_id AND f.status = 'verified'
        )
        OR (auth.jwt()->>'aal' = 'aal2' AND sess.aal = 'aal2' AND EXISTS (
          SELECT 1 FROM auth.mfa_factors factor
          WHERE factor.id = sess.factor_id AND factor.user_id = staff.user_id
            AND factor.status = 'verified'
        )), false))
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
