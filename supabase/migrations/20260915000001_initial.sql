-- UK Talent Link — Supabase schema
-- Applies to: PostgreSQL (Supabase project)
-- Run: supabase db push  OR  apply via Supabase dashboard > SQL editor

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Candidate profiles (linked to Supabase Auth users) ───────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name              TEXT,
  email             TEXT,
  phone             TEXT,
  location          TEXT,
  sector_preference TEXT,  -- 'construction' | 'technology' | 'both'
  d1_candidate_id   TEXT,  -- links to Cloudflare D1 candidates.id after CV upload
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Consultation bookings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id          UUID REFERENCES auth.users ON DELETE SET NULL,
  contact_name     TEXT NOT NULL,
  contact_email    TEXT NOT NULL,
  contact_phone    TEXT,
  topic_area       TEXT,
  calendly_uri     TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | cancelled
  notes            TEXT
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin can read all bookings (via service role key — bypasses RLS)

-- ── HR query history ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_queries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id          UUID REFERENCES auth.users ON DELETE SET NULL,
  question         TEXT NOT NULL,
  category         TEXT,
  faq_topic_id     INTEGER,
  resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_type  TEXT,  -- 'video' | 'ai' | 'booking'
  ai_response      TEXT
);

ALTER TABLE hr_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own queries"
  ON hr_queries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert queries"
  ON hr_queries FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ── Analytics view (admin-only via service role) ──────────────────────────────
CREATE OR REPLACE VIEW admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM bookings)                                  AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed')       AS confirmed_bookings,
  (SELECT COUNT(*) FROM hr_queries)                                AS total_queries,
  (SELECT COUNT(*) FROM hr_queries WHERE resolved = TRUE)          AS resolved_queries,
  (SELECT COUNT(*) FROM hr_queries WHERE resolution_type = 'ai')   AS ai_escalations,
  (SELECT COUNT(*) FROM hr_queries WHERE resolution_type = 'booking') AS booking_conversions;
