BEGIN;
SET LOCAL search_path=recruitment,public;
DO $$ DECLARE a reed_sync_state; b reed_sync_state; n integer;
BEGIN
  SELECT * INTO a FROM claim_reed_sync('technology');
  IF a.attempts<>1 OR a.status<>'running' THEN RAISE EXCEPTION 'claim failed'; END IF;
  SELECT count(*) INTO n FROM claim_reed_sync('technology');
  IF n<>0 THEN RAISE EXCEPTION 'concurrent claim allowed'; END IF;
  UPDATE reed_sync_state SET locked_until=0 WHERE sector='technology';
  SELECT * INTO b FROM claim_reed_sync('technology');
  IF b.lease_token=a.lease_token OR b.attempts<>2 THEN RAISE EXCEPTION 'reclaim failed'; END IF;
  BEGIN
    PERFORM assert_reed_sync_lease('technology',a.lease_token);
    RAISE EXCEPTION 'stale writer accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM='stale writer accepted' THEN RAISE; END IF;
  END;
  PERFORM fail_reed_sync('technology',b.lease_token);
  IF (SELECT status FROM reed_sync_state WHERE sector='technology')<>'pending' THEN RAISE EXCEPTION 'retry not pending'; END IF;
  SELECT count(*) INTO n FROM claim_reed_sync('technology');
  IF n<>0 THEN RAISE EXCEPTION 'backoff ignored'; END IF;
  UPDATE reed_sync_state SET available_at=0 WHERE sector='technology';
  SELECT * INTO b FROM claim_reed_sync('technology');
  PERFORM fail_reed_sync('technology',b.lease_token);
  SELECT count(*) INTO n FROM claim_reed_sync('technology');
  IF n<>0 OR (SELECT status FROM reed_sync_state WHERE sector='technology')<>'failed' THEN RAISE EXCEPTION 'retry cap ignored'; END IF;
  SELECT * INTO b FROM claim_reed_sync('technology',true);
  IF b.attempts<>1 THEN RAISE EXCEPTION 'explicit retry failed'; END IF;
  UPDATE reed_sync_state SET status='complete',completed_at=(extract(epoch FROM now())*1000)::bigint,query_index=11,result_offset=0 WHERE sector='technology';
  SELECT count(*) INTO n FROM claim_reed_sync('technology',true);
  IF n<>0 THEN RAISE EXCEPTION 'same day duplicate cycle'; END IF;
  UPDATE reed_sync_state SET completed_at=1 WHERE sector='technology';
  SELECT * INTO b FROM claim_reed_sync('technology');
  IF b.query_index<>0 OR b.result_offset<>0 OR b.attempts<>1 THEN RAISE EXCEPTION 'new day did not restart'; END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM * FROM recruitment.claim_reed_sync('construction');
    RAISE EXCEPTION 'client can claim';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM * FROM recruitment.reed_sync_state;
    RAISE EXCEPTION 'client can read operational state';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
