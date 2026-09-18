ALTER TABLE jobs ADD COLUMN salary_min REAL CHECK (salary_min >= 0);
ALTER TABLE jobs ADD COLUMN salary_max REAL CHECK (salary_max >= 0);
ALTER TABLE jobs ADD COLUMN salary_currency TEXT;
ALTER TABLE jobs ADD COLUMN salary_period TEXT;
