CREATE TABLE recruitment.match_evidence (
 candidate_id text NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
 job_id text NOT NULL REFERENCES recruitment.jobs(id) ON DELETE CASCADE,
 fingerprint text NOT NULL, assessment jsonb NOT NULL, created_at bigint NOT NULL,
 PRIMARY KEY(candidate_id,job_id)
);
ALTER TABLE recruitment.match_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.match_evidence FROM PUBLIC,anon,authenticated;
GRANT ALL ON recruitment.match_evidence TO service_role;
CREATE POLICY backend_service_access ON recruitment.match_evidence TO service_role USING(true) WITH CHECK(true);
CREATE INDEX match_evidence_job_idx ON recruitment.match_evidence(job_id);

CREATE FUNCTION recruitment.assert_match_snapshot(p_candidate text,p_profile text,p_job text,p_job_token text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM recruitment.candidates c WHERE c.id=p_candidate AND c.status='parsed' AND c.raw_profile=p_profile FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile changed; retry assessment'; END IF;
 PERFORM 1 FROM recruitment.jobs j WHERE j.id=p_job AND md5(to_jsonb(j)::text)=p_job_token
   AND j.status='open' AND (j.expiry_date IS NULL OR j.expiry_date>=CURRENT_DATE::text) FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Vacancy changed; retry assessment'; END IF;
END $$;
REVOKE ALL ON FUNCTION recruitment.assert_match_snapshot(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION recruitment.assert_match_snapshot(text,text,text,text) TO service_role;
