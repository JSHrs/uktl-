-- Restrict the admin aggregate view even if default schema grants expose it.
ALTER VIEW public.admin_analytics SET (security_invoker = true);
REVOKE ALL ON public.admin_analytics FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_analytics TO service_role;

-- Signup must continue running as the owner, with no mutable search path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Client profile edits must not change the authoritative identity or CV mirror.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (name, phone, location, sector_preference) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
