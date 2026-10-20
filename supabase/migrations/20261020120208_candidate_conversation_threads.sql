CREATE TABLE recruitment.conversation_messages (
 id uuid PRIMARY KEY,
 candidate_id text NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
 sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 sender_kind text NOT NULL CHECK(sender_kind IN ('candidate','staff')),
 body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 8000),
 created_at bigint NOT NULL
);
CREATE INDEX conversation_messages_thread ON recruitment.conversation_messages(candidate_id,created_at DESC,id DESC);
ALTER TABLE recruitment.conversation_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON recruitment.conversation_messages FROM PUBLIC,anon,authenticated;
GRANT ALL ON recruitment.conversation_messages TO service_role;
CREATE POLICY backend_service_access ON recruitment.conversation_messages TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER audit_mutation AFTER INSERT OR UPDATE OR DELETE ON recruitment.conversation_messages FOR EACH ROW EXECUTE FUNCTION recruitment.audit_mutation();
