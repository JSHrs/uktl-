-- HR & Employment Law module schema.
-- FAQ topics are defined by the client; the platform provides structure and matching.

CREATE TABLE IF NOT EXISTS faq_topics (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,   -- dismissal | contracts | discrimination | pay | redundancy | working-time | holiday | leave | whistleblowing | settlement
  keywords    TEXT NOT NULL,   -- JSON array of strings used for keyword matching
  sector_tag  TEXT,            -- 'construction' | 'technology' | NULL = all sectors
  video_url   TEXT,            -- Supabase Storage URL
  thumbnail   TEXT,            -- Supabase Storage URL
  duration_s  INTEGER,         -- video duration in seconds
  published   INTEGER DEFAULT 1,
  view_count  INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faq_category  ON faq_topics (category, published);
CREATE INDEX IF NOT EXISTS idx_faq_published ON faq_topics (published, created_at DESC);

-- Per-user HR question history
CREATE TABLE IF NOT EXISTS hr_queries (
  id           TEXT PRIMARY KEY,
  user_id      TEXT,            -- nullable for anonymous sessions
  question     TEXT NOT NULL,
  category     TEXT,
  faq_topic_id TEXT,            -- matched topic, if found
  resolved     TEXT,            -- 'yes' | 'no' | 'partly' | NULL
  ai_response  TEXT,            -- Claude response if escalated
  asked_at     INTEGER NOT NULL,
  FOREIGN KEY (faq_topic_id) REFERENCES faq_topics(id)
);

CREATE INDEX IF NOT EXISTS idx_hrq_user ON hr_queries (user_id, asked_at DESC);
