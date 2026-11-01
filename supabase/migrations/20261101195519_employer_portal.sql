-- Employer portal (owner request, 1 November 2026).
-- Employers describe their company, submit roles for UKTL to review, and respond to
-- candidates a consultant chooses to share. Shared candidates are anonymised: the
-- employer sees an alias, a consultant-written summary, a score, strengths and gaps,
-- never a name, contact details, CV or candidate record.
-- All tables are service-only. The app reaches them through the audited batch bridge
-- and every handler authorises the caller (employer owns the row, or verified staff).

CREATE TABLE recruitment.employer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL CHECK (length(company_name) BETWEEN 1 AND 200),
  job_title text CHECK (job_title IS NULL OR length(job_title) <= 200),
  website text CHECK (website IS NULL OR (length(website) <= 300 AND website ~* '^https?://')),
  headquarters text CHECK (headquarters IS NULL OR length(headquarters) <= 100),
  company_size text CHECK (company_size IS NULL OR company_size IN ('1-50','51-250','251-1000','1000+')),
  sectors jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sectors) = 'array' AND jsonb_array_length(sectors) <= 10),
  services jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(services) = 'array' AND jsonb_array_length(services) <= 5),
  hiring_markets jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(hiring_markets) = 'array' AND jsonb_array_length(hiring_markets) <= 10),
  hiring_volume text CHECK (hiring_volume IS NULL OR hiring_volume IN ('1-2','3-5','6-15','15+')),
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

CREATE TABLE recruitment.employer_roles (
  id text PRIMARY KEY CHECK (id ~ '^er_[a-f0-9]{16}$'),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  location text CHECK (location IS NULL OR length(location) <= 200),
  sector text CHECK (sector IS NULL OR length(sector) <= 100),
  seniority text CHECK (seniority IS NULL OR seniority IN ('junior','mid','senior','lead','executive')),
  min_years_experience double precision CHECK (min_years_experience IS NULL OR min_years_experience BETWEEN 0 AND 50),
  salary text CHECK (salary IS NULL OR length(salary) <= 100),
  description text CHECK (description IS NULL OR length(description) <= 8000),
  must_have_skills jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(must_have_skills) = 'array' AND jsonb_array_length(must_have_skills) <= 30),
  nice_to_have_skills jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(nice_to_have_skills) = 'array' AND jsonb_array_length(nice_to_have_skills) <= 30),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','live','closed','withdrawn')),
  job_id text UNIQUE REFERENCES recruitment.jobs(id) ON DELETE SET NULL,
  staff_note text CHECK (staff_note IS NULL OR length(staff_note) <= 2000),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at bigint,
  -- Aliases are never reused on a role, even after a share is withdrawn.
  next_alias_index integer NOT NULL DEFAULT 0 CHECK (next_alias_index BETWEEN 0 AND 702)
);
CREATE INDEX employer_roles_owner_idx ON recruitment.employer_roles (owner_user_id, created_at DESC);
CREATE INDEX employer_roles_status_idx ON recruitment.employer_roles (status, created_at DESC);

CREATE TABLE recruitment.employer_shortlist (
  role_id text NOT NULL REFERENCES recruitment.employer_roles(id) ON DELETE CASCADE,
  -- Deleting a candidate (erasure) removes every share of them.
  candidate_id text NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
  alias text NOT NULL CHECK (alias ~ '^Candidate [A-Z]{1,2}$'),
  summary text NOT NULL CHECK (length(summary) BETWEEN 1 AND 2000),
  score integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(strengths) = 'array' AND jsonb_array_length(strengths) <= 12),
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gaps) = 'array' AND jsonb_array_length(gaps) <= 12),
  shared_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_at bigint NOT NULL,
  employer_decision text NOT NULL DEFAULT 'pending' CHECK (employer_decision IN ('pending','interested','declined')),
  employer_note text CHECK (employer_note IS NULL OR length(employer_note) <= 1000),
  decided_at bigint,
  PRIMARY KEY (role_id, candidate_id),
  UNIQUE (role_id, alias)
);
CREATE INDEX employer_shortlist_candidate_idx ON recruitment.employer_shortlist (candidate_id);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['employer_profiles','employer_roles','employer_shortlist'] LOOP
  EXECUTE format('ALTER TABLE recruitment.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('REVOKE ALL ON recruitment.%I FROM PUBLIC, anon, authenticated', t);
  EXECUTE format('GRANT ALL ON recruitment.%I TO service_role', t);
  EXECUTE format('CREATE POLICY backend_service_access ON recruitment.%I TO service_role USING (true) WITH CHECK (true)', t);
 END LOOP;
END $$;
