-- Pipeline stage per candidate–mandate pair. Re-scoring never resets it.

ALTER TABLE matches ADD COLUMN stage TEXT NOT NULL DEFAULT 'matched';
  -- matched | screening | shortlisted | interviewing | offered | placed | rejected
ALTER TABLE matches ADD COLUMN stage_updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_matches_job_stage ON matches (job_id, stage);
