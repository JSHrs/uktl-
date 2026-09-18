-- Add source tracking to jobs for Reed.co.uk integration.
ALTER TABLE jobs ADD COLUMN source      TEXT DEFAULT 'manual';   -- 'manual' | 'reed'
ALTER TABLE jobs ADD COLUMN source_id   TEXT;                    -- Reed job ID (for dedup)
ALTER TABLE jobs ADD COLUMN source_url  TEXT;                    -- original job posting URL
ALTER TABLE jobs ADD COLUMN posted_date TEXT;                    -- ISO date from Reed
ALTER TABLE jobs ADD COLUMN expiry_date TEXT;                    -- ISO date from Reed

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_id ON jobs (source, source_id)
  WHERE source_id IS NOT NULL;
