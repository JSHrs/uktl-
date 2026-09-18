-- 0009 — durable rate limiting + notification delivery state
--
-- rate_limits: fixed-window counters for costly endpoints (CV upload, AI
-- escalation, admin login, public forms, Reed sync). Workers are stateless, so
-- the counter has to be durable to be enforceable.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket       TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Notification delivery state. The enquiry/booking row is the record; email is
-- only a notification, so a failed send is tracked and retryable by an admin
-- without losing or duplicating the record.
ALTER TABLE enquiries ADD COLUMN notification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE enquiries ADD COLUMN notification_error TEXT;
ALTER TABLE enquiries ADD COLUMN notification_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN notification_at INTEGER;

ALTER TABLE bookings ADD COLUMN notification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN notification_error TEXT;
ALTER TABLE bookings ADD COLUMN notification_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN notification_at INTEGER;
