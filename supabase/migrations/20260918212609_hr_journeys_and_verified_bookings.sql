ALTER TABLE recruitment.hr_queries ADD COLUMN revision integer NOT NULL DEFAULT 0;
ALTER TABLE recruitment.hr_queries ADD COLUMN additional_context text NOT NULL DEFAULT '';
CREATE INDEX hr_history_owner_idx ON recruitment.hr_queries(auth_user_id,created_at DESC,id);
ALTER TABLE recruitment.faq_topics ADD COLUMN transcript text;
ALTER TABLE recruitment.faq_topics ADD COLUMN video_key text;
ALTER TABLE recruitment.faq_topics ADD COLUMN captions_key text;
ALTER TABLE recruitment.faq_topics ADD COLUMN reviewed_at bigint;
CREATE FUNCTION recruitment.invalidate_faq_review() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF ROW(NEW.title,NEW.category,NEW.keywords,NEW.sector_tag) IS DISTINCT FROM ROW(OLD.title,OLD.category,OLD.keywords,OLD.sector_tag) THEN
  NEW.reviewed_at=NULL;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION recruitment.invalidate_faq_review() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER invalidate_faq_review BEFORE UPDATE ON recruitment.faq_topics FOR EACH ROW EXECUTE FUNCTION recruitment.invalidate_faq_review();
CREATE TABLE recruitment.hr_sources(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),url text NOT NULL UNIQUE,title text NOT NULL,category text NOT NULL,body text NOT NULL,content_hash text NOT NULL,retrieved_at bigint NOT NULL,reviewed_at bigint,reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,active boolean NOT NULL DEFAULT false);
CREATE INDEX hr_sources_category_idx ON recruitment.hr_sources(category) WHERE active;
CREATE INDEX hr_sources_reviewer_idx ON recruitment.hr_sources(reviewed_by);
CREATE TABLE recruitment.faq_plays(topic_id text NOT NULL REFERENCES recruitment.faq_topics(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,play_day date NOT NULL,created_at bigint NOT NULL,PRIMARY KEY(topic_id,user_id,play_day));
CREATE INDEX faq_plays_user_idx ON recruitment.faq_plays(user_id);
CREATE TABLE recruitment.booking_intents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,email text NOT NULL,query_id text REFERENCES recruitment.hr_queries(id) ON DELETE SET NULL,created_at bigint NOT NULL,expires_at bigint NOT NULL);
CREATE INDEX booking_intents_user_idx ON recruitment.booking_intents(user_id,created_at DESC);
CREATE INDEX booking_intents_query_idx ON recruitment.booking_intents(query_id);
ALTER TABLE recruitment.bookings ADD COLUMN provider_invitee_uri text UNIQUE;
ALTER TABLE recruitment.bookings ADD COLUMN provider_updated_at bigint;
ALTER TABLE recruitment.bookings ADD COLUMN starts_at bigint;
ALTER TABLE recruitment.bookings ADD COLUMN ends_at bigint;
ALTER TABLE recruitment.bookings ADD COLUMN cancel_url text;
ALTER TABLE recruitment.bookings ADD COLUMN reschedule_url text;
ALTER TABLE recruitment.bookings ADD COLUMN intent_id uuid REFERENCES recruitment.booking_intents(id) ON DELETE SET NULL;
ALTER TABLE recruitment.bookings ADD COLUMN old_invitee_uri text;
CREATE INDEX bookings_intent_idx ON recruitment.bookings(intent_id);
CREATE TABLE recruitment.booking_events(id text PRIMARY KEY,booking_id text NOT NULL REFERENCES recruitment.bookings(id) ON DELETE CASCADE,payload jsonb NOT NULL,created_at bigint NOT NULL,delivery_status text NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending','sending','sent','failed','skipped')),attempts integer NOT NULL DEFAULT 0,last_error text);
CREATE INDEX booking_events_pending_idx ON recruitment.booking_events(created_at) WHERE delivery_status IN ('pending','failed','skipped');
CREATE INDEX booking_events_booking_idx ON recruitment.booking_events(booking_id);
DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['hr_sources','faq_plays','booking_intents','booking_events'] LOOP
  EXECUTE format('ALTER TABLE recruitment.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('REVOKE ALL ON recruitment.%I FROM PUBLIC,anon,authenticated',n);
  EXECUTE format('GRANT ALL ON recruitment.%I TO service_role',n);
  EXECUTE format('CREATE POLICY backend_service_access ON recruitment.%I TO service_role USING(true) WITH CHECK(true)',n);
 END LOOP;
END $$;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('uktl-videos','uktl-videos',false,104857600,ARRAY['video/mp4','video/webm','text/vtt']) ON CONFLICT(id) DO NOTHING;
