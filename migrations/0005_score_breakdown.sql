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

-- HR query history
CREATE TABLE IF NOT EXISTS hr_queries (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  auth_user_id    TEXT,
  question        TEXT NOT NULL,
  category        TEXT,
  faq_topic_id    INTEGER,
  resolved        INTEGER DEFAULT 0,
  resolution_type TEXT,    -- 'video' | 'ai' | 'booking' | 'dismissed'
  ai_response     TEXT
);

CREATE INDEX IF NOT EXISTS idx_hr_queries_created ON hr_queries (created_at DESC);
