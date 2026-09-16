-- Candidate job-discovery swipe preferences.
-- Records whether a candidate expressed interest or dismissed a vacancy.

CREATE TABLE IF NOT EXISTS candidate_swipes (
  candidate_id  TEXT NOT NULL,
  job_id        TEXT NOT NULL,
  action        TEXT NOT NULL CHECK(action IN ('interested', 'dismissed')),
  swiped_at     INTEGER NOT NULL,
  PRIMARY KEY (candidate_id, job_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)       REFERENCES jobs(id)       ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_swipes_candidate
  ON candidate_swipes (candidate_id, swiped_at DESC);
