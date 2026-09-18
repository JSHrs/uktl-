-- Explicit backend policies document intentional denial to browser roles.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='recruitment' LOOP
  EXECUTE format('CREATE POLICY backend_service_access ON recruitment.%I TO service_role USING (true) WITH CHECK (true)',t.tablename);
 END LOOP;
END $$;
ALTER TABLE recruitment.candidate_skills ADD CONSTRAINT skill_years_check CHECK(years_experience>=0);
ALTER TABLE recruitment.jobs ADD CONSTRAINT job_years_check CHECK(min_years_experience>=0);
ALTER TABLE recruitment.matches ADD CONSTRAINT matches_components_check CHECK(skills_overlap BETWEEN 0 AND 100 AND experience_fit BETWEEN 0 AND 100 AND seniority_fit BETWEEN 0 AND 100 AND location_fit BETWEEN 0 AND 100);
ALTER TABLE recruitment.rate_limits ADD CONSTRAINT rate_count_check CHECK(count>=0);
ALTER TABLE recruitment.candidates ADD CONSTRAINT candidate_notes_json_check CHECK(quality_notes IS NULL OR jsonb_typeof(quality_notes::jsonb)='array');
ALTER TABLE recruitment.candidates ADD CONSTRAINT candidate_profile_json_check CHECK(raw_profile IS NULL OR jsonb_typeof(raw_profile::jsonb)='object');
ALTER TABLE recruitment.jobs ADD CONSTRAINT job_skills_json_check CHECK((must_have_skills IS NULL OR jsonb_typeof(must_have_skills::jsonb)='array') AND (nice_to_have_skills IS NULL OR jsonb_typeof(nice_to_have_skills::jsonb)='array'));
