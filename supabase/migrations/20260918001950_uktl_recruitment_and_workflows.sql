-- Supabase recruitment schema. Epoch milliseconds preserve the existing API contract.
-- No seed/demo jobs are imported. Existing public auth profiles remain intact.
CREATE SCHEMA IF NOT EXISTS recruitment;
REVOKE ALL ON SCHEMA recruitment FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA recruitment TO service_role;
SET search_path = recruitment, public;

CREATE TABLE recruitment.candidates (
  id TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  status TEXT NOT NULL,
  source_filename TEXT,
  source_r2_key TEXT,
  source_bytes BIGINT,
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  headline TEXT,
  summary TEXT,
  total_years_experience DOUBLE PRECISION,
  seniority TEXT,
  work_authorization TEXT,
  quality_score BIGINT,
  quality_notes TEXT,
  links TEXT,
  raw_profile TEXT,
  parse_error TEXT,
  score_breakdown TEXT,
  improvement_report TEXT,
  auth_user_id UUID,
  PRIMARY KEY (id),
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE recruitment.candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.candidates FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.candidates TO service_role;

CREATE TABLE recruitment.candidate_skills (
  candidate_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  skill_raw TEXT NOT NULL,
  years_experience DOUBLE PRECISION,
  PRIMARY KEY (candidate_id, skill),
  FOREIGN KEY (candidate_id) REFERENCES recruitment.candidates(id) ON DELETE CASCADE
);
ALTER TABLE recruitment.candidate_skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.candidate_skills FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.candidate_skills TO service_role;

CREATE TABLE recruitment.candidate_experience (
  id TEXT,
  candidate_id TEXT NOT NULL,
  company TEXT,
  title TEXT,
  start_date TEXT,
  end_date TEXT,
  is_current BIGINT DEFAULT 0,
  location TEXT,
  description TEXT,
  sort_order BIGINT DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES recruitment.candidates(id) ON DELETE CASCADE
);
ALTER TABLE recruitment.candidate_experience ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.candidate_experience FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.candidate_experience TO service_role;

CREATE TABLE recruitment.candidate_education (
  id TEXT,
  candidate_id TEXT NOT NULL,
  institution TEXT,
  degree TEXT,
  field TEXT,
  start_year TEXT,
  end_year TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES recruitment.candidates(id) ON DELETE CASCADE
);
ALTER TABLE recruitment.candidate_education ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.candidate_education FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.candidate_education TO service_role;

CREATE TABLE recruitment.jobs (
  id TEXT,
  created_at BIGINT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  sector TEXT,
  seniority TEXT,
  min_years_experience DOUBLE PRECISION,
  description TEXT,
  must_have_skills TEXT,
  nice_to_have_skills TEXT,
  status TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  source_url TEXT,
  posted_date TEXT,
  expiry_date TEXT,
  PRIMARY KEY (id)
);
ALTER TABLE recruitment.jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.jobs FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.jobs TO service_role;

CREATE TABLE recruitment.matches (
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  score BIGINT NOT NULL,
  skills_overlap BIGINT,
  experience_fit BIGINT,
  seniority_fit BIGINT,
  location_fit BIGINT,
  matched_skills TEXT,
  missing_skills TEXT,
  reasoning TEXT,
  computed_at BIGINT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'matched',
  stage_updated_at BIGINT,
  PRIMARY KEY (candidate_id, job_id),
  FOREIGN KEY (job_id) REFERENCES recruitment.jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES recruitment.candidates(id) ON DELETE CASCADE
);
ALTER TABLE recruitment.matches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.matches FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.matches TO service_role;

CREATE TABLE recruitment.faq_topics (
  id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT NOT NULL,
  sector_tag TEXT,
  video_url TEXT,
  thumbnail TEXT,
  duration_s BIGINT,
  published BIGINT DEFAULT 1,
  view_count BIGINT DEFAULT 0,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (id)
);
ALTER TABLE recruitment.faq_topics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.faq_topics FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.faq_topics TO service_role;

CREATE TABLE recruitment.candidate_swipes (
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  action TEXT NOT NULL,
  swiped_at BIGINT NOT NULL,
  PRIMARY KEY (candidate_id, job_id),
  FOREIGN KEY (job_id) REFERENCES recruitment.jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES recruitment.candidates(id) ON DELETE CASCADE
);
ALTER TABLE recruitment.candidate_swipes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.candidate_swipes FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.candidate_swipes TO service_role;

CREATE TABLE recruitment.bookings (
  id TEXT,
  created_at BIGINT NOT NULL,
  user_email TEXT,
  auth_user_id UUID,
  topic_area TEXT,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  calendly_uri TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_error TEXT,
  notification_attempts BIGINT NOT NULL DEFAULT 0,
  notification_at BIGINT,
  PRIMARY KEY (id),
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE recruitment.bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.bookings FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.bookings TO service_role;

CREATE TABLE recruitment.hr_queries (
  id TEXT,
  created_at BIGINT NOT NULL,
  auth_user_id UUID,
  question TEXT NOT NULL,
  category TEXT,
  faq_topic_id TEXT,
  resolved BIGINT NOT NULL DEFAULT 0,
  resolution_type TEXT,
  ai_response TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE recruitment.hr_queries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.hr_queries FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.hr_queries TO service_role;

CREATE TABLE recruitment.enquiries (
  id TEXT,
  created_at BIGINT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  enquiry_type TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_error TEXT,
  notification_attempts BIGINT NOT NULL DEFAULT 0,
  notification_at BIGINT,
  PRIMARY KEY (id)
);
ALTER TABLE recruitment.enquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.enquiries FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.enquiries TO service_role;

CREATE TABLE recruitment.rate_limits (
  bucket TEXT,
  window_start BIGINT NOT NULL,
  count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket)
);
ALTER TABLE recruitment.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON recruitment.rate_limits TO service_role;

CREATE INDEX idx_candidates_email  ON candidates (email);
CREATE INDEX idx_candidates_status ON candidates (status);
CREATE INDEX idx_candidates_created ON candidates (created_at DESC);
CREATE INDEX idx_cskills_skill ON candidate_skills (skill);
CREATE INDEX idx_cexp_candidate ON candidate_experience (candidate_id, sort_order);
CREATE INDEX idx_jobs_status ON jobs (status, created_at DESC);
CREATE INDEX idx_matches_candidate ON matches (candidate_id, score DESC);
CREATE INDEX idx_matches_job       ON matches (job_id, score DESC);
CREATE INDEX idx_faq_category  ON faq_topics (category, published);
CREATE INDEX idx_faq_published ON faq_topics (published, created_at DESC);
CREATE INDEX idx_swipes_candidate
  ON candidate_swipes (candidate_id, swiped_at DESC);
CREATE INDEX idx_candidates_auth_user ON candidates (auth_user_id);
CREATE INDEX idx_bookings_created ON bookings (created_at DESC);
CREATE INDEX idx_bookings_email   ON bookings (contact_email);
CREATE INDEX idx_hr_queries_created ON hr_queries (created_at DESC);
CREATE INDEX idx_hr_queries_user    ON hr_queries (auth_user_id, created_at DESC);
CREATE UNIQUE INDEX idx_jobs_source_id ON jobs (source, source_id)
  WHERE source_id IS NOT NULL;
CREATE INDEX idx_enquiries_created ON enquiries (created_at DESC);
CREATE INDEX idx_matches_job_stage ON matches (job_id, stage);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

ALTER TABLE candidates ADD CONSTRAINT candidates_status_check CHECK(status IN ('uploaded','parsing','parsed','failed'));
ALTER TABLE candidates ADD CONSTRAINT candidate_quality_check CHECK(quality_score BETWEEN 0 AND 100);
ALTER TABLE candidates ADD CONSTRAINT candidate_years_check CHECK(total_years_experience >= 0);
ALTER TABLE candidates ADD CONSTRAINT candidate_bytes_check CHECK(source_bytes >= 0);
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK(status IN ('open','closed'));
ALTER TABLE matches ADD CONSTRAINT matches_score_check CHECK(score BETWEEN 0 AND 100);
ALTER TABLE matches ADD CONSTRAINT matches_stage_check CHECK(stage IN ('matched','screening','shortlisted','interviewing','offered','placed','rejected'));
ALTER TABLE candidate_swipes ADD CONSTRAINT swipe_action_check CHECK(action IN ('interested','dismissed'));
ALTER TABLE hr_queries ADD CONSTRAINT hr_resolved_check CHECK(resolved IN (0,1));
ALTER TABLE hr_queries ADD CONSTRAINT hr_faq_fk FOREIGN KEY(faq_topic_id) REFERENCES faq_topics(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK(status IN ('pending','confirmed','cancelled'));
ALTER TABLE enquiries ADD CONSTRAINT enquiries_status_check CHECK(status IN ('new','replied','closed'));
CREATE INDEX candidate_education_owner_idx ON candidate_education(candidate_id);
CREATE INDEX bookings_owner_idx ON bookings(auth_user_id);
CREATE INDEX hr_queries_faq_idx ON hr_queries(faq_topic_id);
CREATE INDEX swipes_job_idx ON candidate_swipes(job_id);

-- Extended recruitment workflows; private by default, accessed through authorised handlers.
SET search_path = recruitment, public;
CREATE TABLE organisations(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at BIGINT NOT NULL);
CREATE TABLE organisation_memberships(organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('owner','recruiter','reviewer')),created_at BIGINT NOT NULL,PRIMARY KEY(organisation_id,user_id));
CREATE INDEX memberships_user_idx ON organisation_memberships(user_id);
CREATE TABLE staff_users(user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('admin','consultant')),active BOOLEAN NOT NULL DEFAULT true,created_at BIGINT NOT NULL);
ALTER TABLE jobs ADD COLUMN organisation_id TEXT REFERENCES organisations(id) ON DELETE RESTRICT;
CREATE INDEX jobs_organisation_idx ON jobs(organisation_id);
CREATE TABLE client_mandates(organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,created_at BIGINT NOT NULL,PRIMARY KEY(organisation_id,job_id));
CREATE INDEX client_mandates_job_idx ON client_mandates(job_id);
CREATE TABLE cv_versions(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,version INTEGER NOT NULL CHECK(version>0),storage_key TEXT NOT NULL UNIQUE,filename TEXT NOT NULL,content_type TEXT NOT NULL,size_bytes BIGINT NOT NULL CHECK(size_bytes>0),created_at BIGINT NOT NULL,UNIQUE(candidate_id,version));
CREATE TABLE applications(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied','withdrawn')),created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,UNIQUE(candidate_id,job_id));
CREATE INDEX applications_job_idx ON applications(job_id,status);
CREATE TABLE saved_jobs(candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,created_at BIGINT NOT NULL,PRIMARY KEY(candidate_id,job_id));
CREATE INDEX saved_jobs_job_idx ON saved_jobs(job_id);
CREATE TABLE candidate_notes(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','shared')),created_at BIGINT NOT NULL);
CREATE INDEX notes_candidate_idx ON candidate_notes(candidate_id,created_at DESC);
CREATE INDEX notes_job_idx ON candidate_notes(job_id);
CREATE INDEX notes_author_idx ON candidate_notes(author_user_id);
CREATE TABLE tasks(id TEXT PRIMARY KEY,candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 500),due_at BIGINT,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done','cancelled')),created_at BIGINT NOT NULL,completed_at BIGINT);
CREATE INDEX tasks_queue_idx ON tasks(status,due_at);
CREATE INDEX tasks_candidate_idx ON tasks(candidate_id);
CREATE INDEX tasks_job_idx ON tasks(job_id);
CREATE INDEX tasks_assignee_idx ON tasks(assigned_user_id);
CREATE TABLE interviews(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,starts_at BIGINT NOT NULL,ends_at BIGINT NOT NULL CHECK(ends_at>starts_at),status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','completed','cancelled')),meeting_url TEXT,created_at BIGINT NOT NULL);
CREATE INDEX interviews_candidate_idx ON interviews(candidate_id,starts_at);
CREATE INDEX interviews_job_idx ON interviews(job_id,starts_at);
CREATE TABLE shortlist_items(organisation_id TEXT NOT NULL,job_id TEXT NOT NULL,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,identity_shared BOOLEAN NOT NULL DEFAULT false,created_at BIGINT NOT NULL,PRIMARY KEY(organisation_id,job_id,candidate_id),FOREIGN KEY(organisation_id,job_id) REFERENCES client_mandates(organisation_id,job_id) ON DELETE CASCADE);
CREATE INDEX shortlist_candidate_idx ON shortlist_items(candidate_id);
CREATE TABLE client_feedback(id TEXT PRIMARY KEY,organisation_id TEXT NOT NULL,job_id TEXT NOT NULL,candidate_id TEXT NOT NULL,author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,decision TEXT CHECK(decision IN ('interested','interview','declined')),body TEXT CHECK(length(body)<=10000),created_at BIGINT NOT NULL,FOREIGN KEY(organisation_id,job_id,candidate_id) REFERENCES shortlist_items(organisation_id,job_id,candidate_id) ON DELETE CASCADE);
CREATE INDEX feedback_shortlist_idx ON client_feedback(organisation_id,job_id,candidate_id);
CREATE INDEX feedback_author_idx ON client_feedback(author_user_id);
CREATE TABLE processing_jobs(id TEXT PRIMARY KEY,candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,kind TEXT NOT NULL CHECK(kind IN ('parse','match','delete','export')),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','succeeded','failed')),attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),idempotency_key TEXT NOT NULL UNIQUE,available_at BIGINT NOT NULL,locked_at BIGINT,last_error TEXT,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL);
CREATE INDEX processing_queue_idx ON processing_jobs(status,available_at);
CREATE INDEX processing_candidate_idx ON processing_jobs(candidate_id);
CREATE TABLE match_runs(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,algorithm_version TEXT NOT NULL,profile_hash TEXT,created_at BIGINT NOT NULL,metrics JSONB NOT NULL DEFAULT '{}'::jsonb);
CREATE INDEX match_runs_candidate_idx ON match_runs(candidate_id,created_at DESC);
CREATE TABLE candidate_consents(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,purpose TEXT NOT NULL CHECK(purpose IN ('processing','outreach','identity_sharing')),granted BOOLEAN NOT NULL,policy_version TEXT NOT NULL,created_at BIGINT NOT NULL);
CREATE INDEX consents_candidate_idx ON candidate_consents(candidate_id,purpose,created_at DESC);
CREATE TABLE audit_events(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,actor_user_id UUID,actor_kind TEXT NOT NULL,action TEXT NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,metadata JSONB NOT NULL DEFAULT '{}'::jsonb,created_at BIGINT NOT NULL DEFAULT (extract(epoch FROM clock_timestamp())*1000)::bigint);
CREATE INDEX audit_entity_idx ON audit_events(entity_type,entity_id,created_at DESC);
CREATE INDEX audit_actor_idx ON audit_events(actor_user_id,created_at DESC);
CREATE TABLE stage_history(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,from_stage TEXT,to_stage TEXT NOT NULL,created_at BIGINT NOT NULL);
CREATE INDEX stage_history_candidate_idx ON stage_history(candidate_id,created_at DESC);
CREATE INDEX stage_history_job_idx ON stage_history(job_id,created_at DESC);
CREATE OR REPLACE FUNCTION recruitment.capture_stage_change() RETURNS TRIGGER LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.stage IS DISTINCT FROM OLD.stage THEN
  INSERT INTO recruitment.stage_history(candidate_id,job_id,from_stage,to_stage,created_at) VALUES(NEW.candidate_id,NEW.job_id,OLD.stage,NEW.stage,COALESCE(NEW.stage_updated_at,(extract(epoch FROM clock_timestamp())*1000)::bigint));
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION recruitment.capture_stage_change() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_stage_change AFTER UPDATE OF stage ON matches FOR EACH ROW EXECUTE FUNCTION recruitment.capture_stage_change();
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='recruitment' LOOP
  EXECUTE format('ALTER TABLE recruitment.%I ENABLE ROW LEVEL SECURITY',t.tablename);
  EXECUTE format('REVOKE ALL ON recruitment.%I FROM PUBLIC,anon,authenticated',t.tablename);
  EXECUTE format('GRANT ALL ON recruitment.%I TO service_role',t.tablename);
 END LOOP;
END $$;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA recruitment TO service_role;
-- Candidate reads are scoped by Auth UID even if this schema is later exposed.
GRANT USAGE ON SCHEMA recruitment TO authenticated;
GRANT SELECT ON candidates,candidate_skills,candidate_experience,candidate_education,matches,applications,saved_jobs,cv_versions,candidate_consents TO authenticated;
CREATE POLICY own_candidate ON candidates FOR SELECT TO authenticated USING(auth_user_id=(SELECT auth.uid()));
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['candidate_skills','candidate_experience','candidate_education','matches','applications','saved_jobs','cv_versions','candidate_consents'] LOOP
  EXECUTE format('CREATE POLICY own_candidate_record ON recruitment.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM recruitment.candidates c WHERE c.id=candidate_id AND c.auth_user_id=(SELECT auth.uid())))',t);
 END LOOP;
END $$;
GRANT SELECT ON organisation_memberships TO authenticated;
CREATE POLICY own_membership ON organisation_memberships FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
-- Never grant clients table access to candidate identities or unredacted notes.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('uktl-cvs','uktl-cvs',false,10485760,ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
ON CONFLICT(id) DO NOTHING;
-- CV download remains through the authenticated server route; no public object policy.
RESET search_path;
