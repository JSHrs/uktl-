-- Talent Compass core schema.
-- Runs against Cloudflare D1. Everything is candidate-centric: one CV upload
-- produces one candidate row plus normalised child tables.

CREATE TABLE IF NOT EXISTS candidates (
  id                      TEXT PRIMARY KEY,
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL,
  status                  TEXT NOT NULL,          -- uploaded | parsing | parsed | failed
  source_filename         TEXT,
  source_r2_key           TEXT,
  source_bytes            INTEGER,

  name                    TEXT,
  email                   TEXT,
  phone                   TEXT,
  location                TEXT,
  headline                TEXT,
  summary                 TEXT,

  total_years_experience  REAL,
  seniority               TEXT,                   -- junior | mid | senior | lead | director | executive
  work_authorization      TEXT,

  quality_score           INTEGER,                -- 0-100
  quality_notes           TEXT,                   -- JSON array of strings
  links                   TEXT,                   -- JSON { linkedin, github, portfolio }
  raw_profile             TEXT,                   -- full parsed JSON (source of truth)
  parse_error             TEXT
);

CREATE INDEX IF NOT EXISTS idx_candidates_email  ON candidates (email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates (status);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates (created_at DESC);

CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_id       TEXT NOT NULL,
  skill              TEXT NOT NULL,               -- normalised canonical skill
  skill_raw          TEXT NOT NULL,               -- original string from CV
  years_experience   REAL,
  PRIMARY KEY (candidate_id, skill),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cskills_skill ON candidate_skills (skill);

CREATE TABLE IF NOT EXISTS candidate_experience (
  id             TEXT PRIMARY KEY,
  candidate_id   TEXT NOT NULL,
  company        TEXT,
  title          TEXT,
  start_date     TEXT,
  end_date       TEXT,
  is_current     INTEGER DEFAULT 0,
  location       TEXT,
  description    TEXT,
  sort_order     INTEGER DEFAULT 0,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cexp_candidate ON candidate_experience (candidate_id, sort_order);

CREATE TABLE IF NOT EXISTS candidate_education (
  id             TEXT PRIMARY KEY,
  candidate_id   TEXT NOT NULL,
  institution    TEXT,
  degree         TEXT,
  field          TEXT,
  start_year     TEXT,
  end_year       TEXT,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id                     TEXT PRIMARY KEY,
  created_at             INTEGER NOT NULL,
  title                  TEXT NOT NULL,
  company                TEXT,
  location               TEXT,
  sector                 TEXT,
  seniority              TEXT,
  min_years_experience   REAL,
  description            TEXT,
  must_have_skills       TEXT,                    -- JSON array
  nice_to_have_skills    TEXT,                    -- JSON array
  status                 TEXT NOT NULL            -- open | closed
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS matches (
  candidate_id     TEXT NOT NULL,
  job_id           TEXT NOT NULL,
  score            INTEGER NOT NULL,              -- 0-100 composite
  skills_overlap   INTEGER,
  experience_fit   INTEGER,
  seniority_fit    INTEGER,
  location_fit     INTEGER,
  matched_skills   TEXT,                          -- JSON array
  missing_skills   TEXT,                          -- JSON array
  reasoning        TEXT,
  computed_at      INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, job_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_matches_candidate ON matches (candidate_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_job       ON matches (job_id, score DESC);
