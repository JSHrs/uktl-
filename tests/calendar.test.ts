import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateSlots,
  londonWallToUtc,
  londonDayBounds,
  validateRules,
  consultationIcs,
  consultationEmails,
  type CalendarSettings,
} from "../src/lib/server/calendar.ts";

const settings: CalendarSettings = {
  slot_minutes: 30,
  buffer_minutes: 0,
  min_notice_hours: 0,
  max_days_ahead: 14,
  daily_limit: 48,
  location: "Video call",
};
// Monday 6 October 2025, 00:00 UTC (01:00 BST).
const monday = Date.UTC(2025, 9, 6);

test("London wall times convert across both daylight-saving transitions", () => {
  assert.equal(londonWallToUtc(2025, 7, 1, 9 * 60), Date.UTC(2025, 6, 1, 8)); // BST
  assert.equal(londonWallToUtc(2025, 12, 1, 9 * 60), Date.UTC(2025, 11, 1, 9)); // GMT
  assert.equal(londonWallToUtc(2026, 3, 29, 60 + 30), null, "01:30 does not exist when clocks go forward");
  assert.equal(londonWallToUtc(2026, 3, 29, 3 * 60), Date.UTC(2026, 2, 29, 2));
  const spring = londonDayBounds(Date.UTC(2026, 2, 29, 12));
  assert.equal(spring.end - spring.start, 23 * 3600000);
  const autumn = londonDayBounds(Date.UTC(2026, 9, 25, 12));
  assert.equal(autumn.end - autumn.start, 25 * 3600000);
});

test("slots follow weekly hours in UK time, not server time", () => {
  const slots = generateSlots(settings, [{ weekday: 1, start_minute: 540, end_minute: 660 }], [], [], monday);
  const first = slots.filter((s) => s.start < monday + 86400000);
  assert.deepEqual(
    first.map((s) => new Date(s.start).toISOString().slice(11, 16)),
    ["08:00", "08:30", "09:00", "09:30"], // 09:00–11:00 BST
  );
  assert.ok(slots.every((s) => s.end - s.start === 30 * 60000));
  assert.equal(new Set(slots.map((s) => new Date(s.start).getUTCDay())).size, 1, "Mondays only");
});

test("notice, horizon, closures, buffers and the daily limit remove slots", () => {
  const rules = [{ weekday: 1, start_minute: 540, end_minute: 720 }];
  const nine = Date.UTC(2025, 9, 6, 8);
  assert.equal(
    generateSlots({ ...settings, min_notice_hours: 2 }, rules, [], [], nine - 3600000)[0].start,
    nine + 3600000,
    "starts after two hours' notice",
  );
  assert.ok(generateSlots({ ...settings, max_days_ahead: 1 }, rules, [], [], monday).every((s) => s.start <= monday + 86400000));
  const closed = generateSlots(settings, rules, [{ starts_at: monday, ends_at: monday + 86400000 }], [], monday);
  assert.ok(closed.every((s) => s.start >= monday + 86400000), "closure blocks the whole day");
  const booked = { starts_at: nine + 3600000, ends_at: nine + 5400000 }; // 10:00–10:30 BST
  const buffered = generateSlots({ ...settings, buffer_minutes: 15 }, rules, [], [booked], monday)
    .filter((s) => s.start < monday + 86400000)
    .map((s) => new Date(s.start).toISOString().slice(11, 16));
  assert.deepEqual(buffered, ["08:00", "10:00", "10:30"], "09:30 and 10:30 BST are inside the 15-minute buffer");
  const full = generateSlots({ ...settings, daily_limit: 1 }, rules, [], [booked], monday);
  assert.ok(full.every((s) => s.start >= monday + 86400000), "one booking fills a one-per-day calendar");
});

test("overlapping or inverted opening hours are rejected", () => {
  assert.throws(() => validateRules([{ weekday: 1, start_minute: 600, end_minute: 540 }]));
  assert.throws(() =>
    validateRules([
      { weekday: 2, start_minute: 540, end_minute: 720 },
      { weekday: 2, start_minute: 700, end_minute: 800 },
    ]),
  );
  assert.equal(
    validateRules([
      { weekday: 2, start_minute: 780, end_minute: 1020 },
      { weekday: 2, start_minute: 540, end_minute: 720 },
    ])[0].start_minute,
    540,
  );
});

test("calendar files escape text, fold long lines and cancel with the same UID", () => {
  const booking = {
    id: "cons_fixture",
    starts_at: Date.UTC(2025, 9, 6, 9),
    ends_at: Date.UTC(2025, 9, 6, 9, 30),
    location: "Video call; link, sent\nlater " + "x".repeat(120),
    status: "confirmed",
  };
  const ics = consultationIcs(booking, Date.UTC(2025, 9, 1));
  assert.match(ics, /DTSTART:20251006T090000Z/);
  assert.match(ics, /LOCATION:Video call\\; link\\, sent\\nlater/);
  assert.ok(ics.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));
  const cancelled = consultationIcs({ ...booking, status: "cancelled" });
  assert.match(cancelled, /METHOD:CANCEL/);
  assert.match(cancelled, /UID:cons_fixture@uktalentlink.co.uk/);
});

test("candidate email goes to the candidate with an invite; team email goes to the firm", () => {
  const mail = consultationEmails(
    {
      id: "cons_fixture",
      status: "confirmed",
      starts_at: Date.UTC(2025, 9, 6, 9),
      ends_at: Date.UTC(2025, 9, 6, 9, 30),
      location: "Video call",
      topic_area: "My CV and applications",
      contact_name: "Synthetic Candidate",
      contact_email: "candidate@example.invalid",
      contact_phone: null,
      notes: null,
      cancelled_by: null,
      rescheduled_to: null,
      auth_user_id: null,
      created_at: 0,
    },
    "confirmed",
    "https://uktl.example",
  );
  assert.deepEqual(mail.candidate.to, ["candidate@example.invalid"]);
  assert.match(mail.candidate.text, /Monday,? 6 October 2025, 10:00–10:30 \(UK time\)/);
  assert.match(mail.candidate.text, /https:\/\/uktl\.example\/app\/consultations/);
  assert.equal(mail.candidate.attachments[0].content_type, "text/calendar");
  assert.equal("to" in mail.team, false);
  assert.equal(mail.team.replyTo, "candidate@example.invalid");
});
