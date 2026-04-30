-- UK Talent Link — initial schema
-- Tables: leads, candidates, content_items, analytics_events, sessions

CREATE TABLE IF NOT EXISTS leads (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  name            TEXT NOT NULL,
  company         TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,
  service         TEXT NOT NULL,
  message         TEXT,
  score           INTEGER NOT NULL DEFAULT 0,
  priority        TEXT NOT NULL DEFAULT 'Medium',     -- High | Medium | Low
  status          TEXT NOT NULL DEFAULT 'New',        -- New | Contacted | Qualified | Proposal Sent | Closed Won | Closed Lost
  ai_draft        TEXT,
  notified        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_leads_status   ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created  ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS candidates (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  client          TEXT,
  email           TEXT,
  stage           TEXT NOT NULL DEFAULT 'Sourced',    -- Sourced | Shortlisted | Interview | Offer | Placed | Rejected
  score           INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  ai_analysis     TEXT
);
CREATE INDEX IF NOT EXISTS idx_candidates_stage   ON candidates(stage);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at DESC);

CREATE TABLE IF NOT EXISTS content_items (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL,                       -- Blog Article | LinkedIn Post | Email Newsletter
  tone            TEXT,
  content         TEXT NOT NULL,
  word_count      INTEGER NOT NULL DEFAULT 0,
  published       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_content_created ON content_items(created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  id              TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  type            TEXT NOT NULL,                       -- page_view | form_start | form_submit
  page            TEXT,
  metadata        TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type    ON analytics_events(type);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash      TEXT PRIMARY KEY,
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL
);
