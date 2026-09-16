-- Public contact-form enquiries. Persisted so nothing is lost if the Resend
-- notification is not configured or fails.

CREATE TABLE IF NOT EXISTS enquiries (
  id            TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  company       TEXT,
  enquiry_type  TEXT,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new'   -- new | replied | closed
);

CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries (created_at DESC);
