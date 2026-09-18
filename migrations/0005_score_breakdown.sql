-- Add score breakdown, improvement report, and auth linking to candidates.
-- These fields are populated during CV parse (Claude quality pass).

ALTER TABLE candidates ADD COLUMN score_breakdown TEXT;      -- JSON ScoreBreakdown
ALTER TABLE candidates ADD COLUMN improvement_report TEXT;   -- JSON ImprovementReport
ALTER TABLE candidates ADD COLUMN auth_user_id TEXT;         -- Supabase Auth user UUID

CREATE INDEX IF NOT EXISTS idx_candidates_auth_user ON candidates (auth_user_id);

-- Bookings table — consultation bookings from the HR module.
CREATE TABLE IF NOT EXISTS bookings (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  user_email      TEXT,
  auth_user_id    TEXT,
  topic_area      TEXT,
  contact_name    TEXT,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  calendly_uri    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | cancelled
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_email   ON bookings (contact_email);

-- HR query history.
-- 0003 already created hr_queries with (user_id, asked_at, resolved TEXT); the
-- HR module runtime writes created_at / auth_user_id / resolution_type, so the
-- table is rebuilt in place and existing rows carried across.
CREATE TABLE hr_queries_v2 (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  auth_user_id    TEXT,
  question        TEXT NOT NULL,
  category        TEXT,
  faq_topic_id    TEXT,    -- faq_topics.id
  resolved        INTEGER NOT NULL DEFAULT 0,
  resolution_type TEXT,    -- 'video' | 'ai' | 'booking' | 'dismissed'
  ai_response     TEXT
);

INSERT INTO hr_queries_v2
  (id, created_at, auth_user_id, question, category, faq_topic_id, resolved, ai_response)
SELECT id, asked_at, user_id, question, category, faq_topic_id,
       CASE WHEN resolved = 'yes' THEN 1 ELSE 0 END, ai_response
  FROM hr_queries;

DROP TABLE hr_queries;
ALTER TABLE hr_queries_v2 RENAME TO hr_queries;

CREATE INDEX IF NOT EXISTS idx_hr_queries_created ON hr_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_queries_user    ON hr_queries (auth_user_id, created_at DESC);
