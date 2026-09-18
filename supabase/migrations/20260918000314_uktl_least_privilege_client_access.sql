-- Public forms use authenticated/rate-limited server handlers, not direct writes to these mirrors.
REVOKE ALL ON public.profiles, public.bookings, public.hr_queries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles, public.bookings, public.hr_queries TO authenticated;
GRANT UPDATE (name, phone, location, sector_preference) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles, public.bookings, public.hr_queries TO service_role;
ALTER POLICY "Users can read own profile" ON public.profiles TO authenticated USING ((SELECT auth.uid()) = id);
ALTER POLICY "Users can update own profile" ON public.profiles TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
ALTER POLICY "Users can read own bookings" ON public.bookings TO authenticated USING ((SELECT auth.uid()) = user_id);
ALTER POLICY "Users can read own queries" ON public.hr_queries TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY "Users can insert own bookings" ON public.bookings;
DROP POLICY "Users can insert queries" ON public.hr_queries;
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS hr_queries_user_id_idx ON public.hr_queries(user_id);