CREATE TABLE recruitment.reed_sync_state (
  sector TEXT PRIMARY KEY CHECK(sector IN ('construction','technology')),
  query_index INTEGER NOT NULL DEFAULT 0 CHECK(query_index BETWEEN 0 AND 32),
  result_offset BIGINT NOT NULL DEFAULT 0 CHECK(result_offset>=0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','failed','complete')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
  lease_token UUID,
  locked_until BIGINT,
  available_at BIGINT NOT NULL DEFAULT 0,
  started_at BIGINT,
  updated_at BIGINT NOT NULL DEFAULT 0,
  completed_at BIGINT,
  saved_count BIGINT NOT NULL DEFAULT 0 CHECK(saved_count>=0),
  skipped_count BIGINT NOT NULL DEFAULT 0 CHECK(skipped_count>=0),
  last_error TEXT
);
ALTER TABLE recruitment.reed_sync_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.reed_sync_state FROM PUBLIC,anon,authenticated;
GRANT ALL ON recruitment.reed_sync_state TO service_role;
CREATE POLICY backend_service_access ON recruitment.reed_sync_state TO service_role USING(true) WITH CHECK(true);

CREATE FUNCTION recruitment.claim_reed_sync(p_sector TEXT,p_retry BOOLEAN DEFAULT false)
RETURNS SETOF recruitment.reed_sync_state LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r recruitment.reed_sync_state; t BIGINT := (extract(epoch FROM clock_timestamp())*1000)::bigint;
  day_start BIGINT := (extract(epoch FROM (date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'))*1000)::bigint;
BEGIN
  IF p_sector NOT IN ('construction','technology') THEN RAISE EXCEPTION 'Invalid sector'; END IF;
  INSERT INTO recruitment.reed_sync_state(sector) VALUES(p_sector) ON CONFLICT DO NOTHING;
  SELECT * INTO r FROM recruitment.reed_sync_state WHERE sector=p_sector FOR UPDATE;
  IF r.status='running' AND r.locked_until>t THEN RETURN; END IF;
  IF r.status='complete' THEN
    IF r.completed_at>=day_start THEN RETURN; END IF;
    UPDATE recruitment.reed_sync_state SET status='pending',query_index=0,result_offset=0,
      attempts=0,available_at=0,started_at=NULL,saved_count=0,skipped_count=0 WHERE sector=p_sector;
    SELECT * INTO r FROM recruitment.reed_sync_state WHERE sector=p_sector;
  END IF;
  IF r.attempts>=3 OR r.status='failed' THEN
    IF NOT p_retry THEN
      UPDATE recruitment.reed_sync_state SET status='failed',lease_token=NULL,locked_until=NULL,
        last_error='Import paused after three unsuccessful attempts. Review configuration and retry.',updated_at=t WHERE sector=p_sector;
      RETURN;
    END IF;
    UPDATE recruitment.reed_sync_state SET attempts=0,available_at=0,status='pending' WHERE sector=p_sector;
    SELECT * INTO r FROM recruitment.reed_sync_state WHERE sector=p_sector;
  END IF;
  IF r.available_at>t THEN RETURN; END IF;
  RETURN QUERY UPDATE recruitment.reed_sync_state SET status='running',attempts=r.attempts+1,
    lease_token=gen_random_uuid(),locked_until=t+120000,started_at=coalesce(r.started_at,t),updated_at=t
    WHERE sector=p_sector RETURNING *;
END $$;

CREATE FUNCTION recruitment.assert_reed_sync_lease(p_sector TEXT,p_token UUID)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM recruitment.reed_sync_state WHERE sector=p_sector AND status='running'
    AND lease_token=p_token AND locked_until>(extract(epoch FROM clock_timestamp())*1000)::bigint FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sync lease expired or superseded'; END IF;
END $$;

CREATE FUNCTION recruitment.fail_reed_sync(p_sector TEXT,p_token UUID)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t BIGINT := (extract(epoch FROM clock_timestamp())*1000)::bigint;
BEGIN
  PERFORM recruitment.assert_reed_sync_lease(p_sector,p_token);
  UPDATE recruitment.reed_sync_state SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'pending' END,
    available_at=t+attempts*60000,lease_token=NULL,locked_until=NULL,updated_at=t,
    last_error='Vacancy import could not finish this batch. Progress retained; provider details suppressed.'
    WHERE sector=p_sector;
END $$;
REVOKE ALL ON FUNCTION recruitment.claim_reed_sync(TEXT,BOOLEAN) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION recruitment.assert_reed_sync_lease(TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION recruitment.fail_reed_sync(TEXT,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION recruitment.claim_reed_sync(TEXT,BOOLEAN),recruitment.assert_reed_sync_lease(TEXT,UUID),recruitment.fail_reed_sync(TEXT,UUID) TO service_role;
