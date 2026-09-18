ALTER TABLE recruitment.jobs
  ADD COLUMN salary_min DOUBLE PRECISION CHECK (salary_min >= 0),
  ADD COLUMN salary_max DOUBLE PRECISION CHECK (salary_max >= 0),
  ADD COLUMN salary_currency TEXT,
  ADD COLUMN salary_period TEXT,
  ADD CONSTRAINT job_salary_range CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min);
-- Existing RLS and backend-only grants remain in force. No provider calls or
-- scheduler activation occur during migration.
