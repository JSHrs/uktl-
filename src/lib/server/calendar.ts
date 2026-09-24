import type { AppEnv } from "./env";
import { getHrJourney } from "./hr.ts";
import { sendNotificationEmail, type NotificationOutcome } from "./notify.ts";

/**
 * Native consultation calendar. One firm, one calendar, wall-clock hours in
 * Europe/London. Slot maths is pure and unit-tested; the database function
 * `reserve_consultation` re-checks every dynamic constraint under a lock.
 */
export const CALENDAR_TZ = "Europe/London";
const MINUTE = 60000;
const DAY = 86400000;
export const MAX_UPCOMING_PER_CANDIDATE = 2;

export type CalendarSettings = {
  slot_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_days_ahead: number;
  daily_limit: number;
  location: string;
};
export type AvailabilityRule = { id?: string; weekday: number; start_minute: number; end_minute: number };
export type TimeRange = { starts_at: number; ends_at: number };
export type Slot = { start: number; end: number };

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: CALENDAR_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** London wall-clock fields for an instant. */
export function londonParts(ms: number) {
  const p: Record<string, number> = {};
  for (const part of partsFormat.formatToParts(new Date(ms)))
    if (part.type !== "literal") p[part.type] = Number(part.value);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay() || 7;
  return { y: p.year, m: p.month, d: p.day, minute: p.hour * 60 + p.minute, weekday };
}

export function londonDateKey(ms: number) {
  const p = londonParts(ms);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

function wallMs(p: { y: number; m: number; d: number; minute: number }) {
  return Date.UTC(p.y, p.m - 1, p.d, 0, p.minute);
}

/** UTC instant for a London wall time, or null when the clocks skip it (spring forward). */
export function londonWallToUtc(y: number, m: number, d: number, minute: number): number | null {
  const wall = Date.UTC(y, m - 1, d, 0, minute);
  let t = wall - (wallMs(londonParts(wall)) - wall);
  t = wall - (wallMs(londonParts(t)) - t);
  return wallMs(londonParts(t)) === wall ? t : null;
}

/** [start, end) of the London calendar day containing an instant. */
export function londonDayBounds(ms: number): { start: number; end: number } {
  const p = londonParts(ms);
  const next = new Date(Date.UTC(p.y, p.m - 1, p.d + 1));
  return {
    start: londonWallToUtc(p.y, p.m, p.d, 0)!,
    end: londonWallToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0)!,
  };
}

const overlaps = (a: Slot, b: TimeRange, pad = 0) =>
  a.start < b.ends_at + pad && a.end > b.starts_at - pad;

/**
 * Bookable slots between now + notice and now + max days. `bookings` are
 * confirmed appointments; their buffers apply on both sides.
 */
export function generateSlots(
  settings: CalendarSettings,
  rules: AvailabilityRule[],
  blocks: TimeRange[],
  bookings: TimeRange[],
  now: number,
): Slot[] {
  const slotMs = settings.slot_minutes * MINUTE,
    buffer = settings.buffer_minutes * MINUTE,
    earliest = now + settings.min_notice_hours * 3600000,
    latest = now + settings.max_days_ahead * DAY;
  const today = londonParts(now);
  const perDay = new Map<string, number>();
  for (const b of bookings) perDay.set(londonDateKey(b.starts_at), (perDay.get(londonDateKey(b.starts_at)) ?? 0) + 1);
  const seen = new Set<number>(),
    slots: Slot[] = [];
  for (let offset = 0; offset <= settings.max_days_ahead + 1; offset++) {
    const date = new Date(Date.UTC(today.y, today.m - 1, today.d + offset));
    const y = date.getUTCFullYear(),
      m = date.getUTCMonth() + 1,
      d = date.getUTCDate(),
      weekday = date.getUTCDay() || 7;
    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;
      for (let minute = rule.start_minute; minute + settings.slot_minutes <= rule.end_minute; minute += settings.slot_minutes) {
        const start = londonWallToUtc(y, m, d, minute);
        if (start === null || seen.has(start) || start < earliest || start > latest) continue;
        const slot = { start, end: start + slotMs };
        if ((perDay.get(londonDateKey(start)) ?? 0) >= settings.daily_limit) continue;
        if (blocks.some((b) => overlaps(slot, b))) continue;
        if (bookings.some((b) => overlaps(slot, b, buffer))) continue;
        seen.add(start);
        slots.push(slot);
      }
    }
  }
  return slots.sort((a, b) => a.start - b.start);
}

export function validateRules(rules: AvailabilityRule[]) {
  const sorted = [...rules].sort((a, b) => a.weekday - b.weekday || a.start_minute - b.start_minute);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (!Number.isInteger(r.weekday) || r.weekday < 1 || r.weekday > 7) throw new Error("Invalid weekday");
    if (r.start_minute < 0 || r.end_minute > 1440 || r.end_minute <= r.start_minute)
      throw new Error("Each opening period must end after it starts");
    const prev = sorted[i - 1];
    if (prev && prev.weekday === r.weekday && prev.end_minute > r.start_minute)
      throw new Error("Opening periods on the same day must not overlap");
  }
  return sorted;
}

// ── Database access ──────────────────────────────────────────────────────────

function requireSupabase(env: AppEnv) {
  if (env.DATA_BACKEND !== "supabase") throw new Error("Consultation calendar requires the Supabase backend");
}

export async function loadCalendar(env: AppEnv, from: number, to: number) {
  requireSupabase(env);
  const [settings, rules, blocks, bookings] = await env.DB.batch([
    env.DB.prepare(
      "SELECT slot_minutes,buffer_minutes,min_notice_hours,max_days_ahead,daily_limit,location FROM booking_settings WHERE id",
    ),
    env.DB.prepare("SELECT id,weekday,start_minute,end_minute FROM availability_rules ORDER BY weekday,start_minute"),
    env.DB.prepare(
      "SELECT id,starts_at,ends_at,reason FROM availability_blocks WHERE ends_at>? AND starts_at<? ORDER BY starts_at",
    ).bind(from, to),
    env.DB.prepare(
      "SELECT id,starts_at,ends_at FROM bookings WHERE source='native' AND status='confirmed' AND ends_at>? AND starts_at<? ORDER BY starts_at",
    ).bind(from - DAY, to + DAY),
  ]);
  const s = settings.results?.[0] as CalendarSettings | undefined;
  if (!s) throw new Error("Consultation calendar is not configured");
  const num = <T extends Record<string, unknown>>(rows: unknown[] | undefined) =>
    (rows ?? []).map((r) => {
      const o = { ...(r as T) } as Record<string, unknown>;
      for (const k of ["weekday", "start_minute", "end_minute", "starts_at", "ends_at"])
        if (k in o) o[k] = Number(o[k]);
      return o;
    });
  return {
    settings: {
      ...s,
      slot_minutes: Number(s.slot_minutes),
      buffer_minutes: Number(s.buffer_minutes),
      min_notice_hours: Number(s.min_notice_hours),
      max_days_ahead: Number(s.max_days_ahead),
      daily_limit: Number(s.daily_limit),
    },
    rules: num(rules.results) as (AvailabilityRule & { id: string })[],
    blocks: num(blocks.results) as (TimeRange & { id: string; reason: string | null })[],
    bookings: num(bookings.results) as (TimeRange & { id: string })[],
  };
}

export async function availableSlots(env: AppEnv, now = Date.now(), excludeBookingId?: string) {
  const cal = await loadCalendar(env, now, now + 181 * DAY);
  const busy = cal.bookings.filter((b) => b.id !== excludeBookingId);
  return {
    settings: cal.settings,
    timezone: CALENDAR_TZ,
    slotMinutes: cal.settings.slot_minutes,
    location: cal.settings.location,
    slots: generateSlots(cal.settings, cal.rules, cal.blocks, busy, now),
  };
}

export type ReserveInput = {
  userId: string;
  email: string;
  name: string;
  phone?: string | null;
  topic?: string | null;
  notes?: string | null;
  queryId?: string | null;
  startsAt: number;
  replaces?: string | null;
};

const RESERVE_ERRORS: Record<string, string> = {
  slot_taken: "That time has just been taken. Choose another slot.",
  unavailable: "That time is no longer available. Choose another slot.",
  day_full: "That day is fully booked. Choose another day.",
  limit: `You can hold up to ${MAX_UPCOMING_PER_CANDIDATE} upcoming consultations. Cancel or reschedule one first.`,
  not_found: "The appointment you are rescheduling is no longer active.",
  invalid: "That time is not available. Choose another slot.",
};

export async function reserveConsultation(env: AppEnv, input: ReserveInput, now = Date.now()) {
  const offer = await availableSlots(env, now, input.replaces ?? undefined);
  const slot = offer.slots.find((s) => s.start === input.startsAt);
  if (!slot) throw new Error(RESERVE_ERRORS.invalid);
  if (input.queryId) await getHrJourney(env, input.userId, input.queryId);
  const cal = offer;
  const day = londonDayBounds(slot.start);
  const id = "cons_" + crypto.randomUUID().replace(/-/g, "");
  const result = await env.DB.prepare(
    `SELECT reserve_consultation(?,?::uuid,?,?,?,?,?,?,?::bigint,?::bigint,?::bigint,?::bigint,?::bigint,?::integer,?,?) AS outcome`,
  )
    .bind(
      id,
      input.userId,
      input.email.trim().toLowerCase(),
      input.name,
      input.phone || null,
      input.topic || null,
      input.notes || null,
      input.queryId || null,
      slot.start,
      slot.end,
      cal.settings.buffer_minutes * MINUTE,
      day.start,
      day.end,
      cal.settings.daily_limit,
      cal.settings.location,
      input.replaces || null,
    )
    .first<{ outcome: string }>();
  if (result?.outcome !== "booked") throw new Error(RESERVE_ERRORS[result?.outcome ?? ""] ?? RESERVE_ERRORS.invalid);
  return { id, start: slot.start, end: slot.end, eventId: `${id}:confirmed` };
}

export type ConsultationRow = {
  id: string;
  status: string;
  starts_at: number;
  ends_at: number;
  location: string | null;
  topic_area: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  notes: string | null;
  cancelled_by: string | null;
  rescheduled_to: string | null;
  auth_user_id: string | null;
  created_at: number;
};

const CONSULTATION_COLUMNS =
  "id,status,starts_at,ends_at,location,topic_area,contact_name,contact_email,contact_phone,notes,cancelled_by,rescheduled_to,auth_user_id,created_at";

function toConsultation(r: Record<string, unknown>): ConsultationRow {
  return { ...(r as ConsultationRow), starts_at: Number(r.starts_at), ends_at: Number(r.ends_at), created_at: Number(r.created_at) };
}

export async function listMyConsultations(env: AppEnv, userId: string) {
  requireSupabase(env);
  const rows = await env.DB.prepare(
    `SELECT ${CONSULTATION_COLUMNS} FROM bookings WHERE auth_user_id=? AND source='native' ORDER BY starts_at DESC LIMIT 25`,
  )
    .bind(userId)
    .all<Record<string, unknown>>();
  return (rows.results ?? []).map(toConsultation);
}

export async function getConsultation(env: AppEnv, id: string) {
  requireSupabase(env);
  const row = await env.DB.prepare(`SELECT ${CONSULTATION_COLUMNS} FROM bookings WHERE id=? AND source='native'`)
    .bind(id)
    .first<Record<string, unknown>>();
  return row ? toConsultation(row) : null;
}

export async function listUpcomingConsultations(env: AppEnv, now = Date.now()) {
  requireSupabase(env);
  const rows = await env.DB.prepare(
    `SELECT ${CONSULTATION_COLUMNS} FROM bookings WHERE source='native' AND ends_at>? ORDER BY starts_at LIMIT 200`,
  )
    .bind(now - DAY)
    .all<Record<string, unknown>>();
  return (rows.results ?? []).map(toConsultation);
}

/** Cancels a future confirmed appointment. `userId` null means a staff cancellation. */
export async function cancelConsultation(env: AppEnv, id: string, userId: string | null, now = Date.now()) {
  requireSupabase(env);
  const by = userId ? "candidate" : "staff";
  const [updated] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE bookings SET status='cancelled',cancelled_at=?,cancelled_by=? WHERE id=? AND source='native' AND status='confirmed' AND starts_at>? AND (?::uuid IS NULL OR auth_user_id=?::uuid) RETURNING id`,
    ).bind(now, by, id, now, userId, userId),
    env.DB.prepare(
      `INSERT INTO booking_events(id,booking_id,payload,created_at) SELECT ?,id,jsonb_build_object('type','cancelled','by',?::text),? FROM bookings WHERE id=? AND status='cancelled' AND cancelled_at=? ON CONFLICT(id) DO NOTHING`,
    ).bind(`${id}:cancelled`, by, now, id, now),
  ]);
  if (!updated.results?.length) throw new Error("This appointment can no longer be cancelled");
  return { eventId: `${id}:cancelled` };
}

// ── Calendar files and notifications ─────────────────────────────────────────

function icsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function icsTime(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
/** Folds content lines at 75 octets as RFC 5545 requires. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 74;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function consultationIcs(
  b: Pick<ConsultationRow, "id" | "starts_at" | "ends_at" | "location" | "status">,
  now = Date.now(),
) {
  const cancelled = b.status === "cancelled";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UK Talent Link//Consultations//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${cancelled ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${b.id}@uktalentlink.co.uk`,
    `SEQUENCE:${cancelled ? 1 : 0}`,
    `DTSTAMP:${icsTime(now)}`,
    `DTSTART:${icsTime(b.starts_at)}`,
    `DTEND:${icsTime(b.ends_at)}`,
    `SUMMARY:${icsText("Consultation with UK Talent Link")}`,
    ...(b.location ? [`LOCATION:${icsText(b.location)}`] : []),
    `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}

function base64Utf8(text: string) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function formatLondonRange(start: number, end: number) {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: CALENDAR_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: CALENDAR_TZ, hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time.format(start)}–${time.format(end)} (UK time)`;
}

export function consultationEmails(
  b: ConsultationRow,
  type: "confirmed" | "rescheduled" | "cancelled",
  siteUrl: string | undefined,
  cancelledBy?: string,
) {
  const when = formatLondonRange(b.starts_at, b.ends_at);
  const manage = siteUrl ? `${siteUrl.replace(/\/$/, "")}/app/consultations` : null;
  const name = b.contact_name || "there";
  const heading =
    type === "cancelled" ? "cancelled" : type === "rescheduled" ? "rescheduled" : "confirmed";
  const candidate = {
    to: [b.contact_email],
    subject: `Your UK Talent Link consultation is ${heading}`,
    text:
      `Hello ${name},\n\n` +
      (type === "cancelled"
        ? `Your consultation on ${when} has been cancelled${cancelledBy === "staff" ? " by our team. We will be in touch to arrange another time" : ""}.\n`
        : `Your consultation is ${heading} for ${when}.\nLocation: ${b.location ?? "to be confirmed by your consultant"}\n\nA calendar file is attached.\n`) +
      (manage ? `\nManage your consultations: ${manage}\n` : "") +
      `\nUK Talent Link\n`,
    attachments: [
      {
        filename: "consultation.ics",
        content: base64Utf8(consultationIcs(b)),
        content_type: "text/calendar",
      },
    ],
  };
  const team = {
    replyTo: b.contact_email,
    subject: `Consultation ${heading}: ${b.contact_name ?? b.contact_email} — ${when}`,
    text:
      `Consultation ${heading}${type === "cancelled" ? ` by ${cancelledBy ?? "candidate"}` : ""}.\n\n` +
      `When: ${when}\nName: ${b.contact_name ?? "—"}\nEmail: ${b.contact_email}\nPhone: ${b.contact_phone ?? "—"}\n` +
      `Topic: ${b.topic_area ?? "—"}\n` +
      (b.notes ? `\nCandidate notes:\n${b.notes}\n` : "") +
      `\nSee Admin → Consultations for the full calendar.\n`,
    attachments: candidate.attachments,
  };
  return { candidate, team };
}

/** Sends one outbox event (candidate + team emails). Idempotent per event. */
export async function deliverBookingEvent(env: AppEnv, eventId: string): Promise<NotificationOutcome> {
  const row = await env.DB.prepare(
    `UPDATE booking_events SET delivery_status='sending',attempts=attempts+1 WHERE id=? AND delivery_status IN('pending','failed','skipped') AND created_at>? RETURNING booking_id,payload`,
  )
    .bind(eventId, Date.now() - 23 * 3600000)
    .first<{ booking_id: string; payload: { type?: string; by?: string } }>();
  if (!row) return { status: "skipped", reason: "Already sent, in progress, or requires reconciliation" };
  const booking = await getConsultation(env, row.booking_id);
  let outcome: NotificationOutcome;
  if (!booking) outcome = { status: "skipped", reason: "Appointment no longer exists" };
  else {
    const type = row.payload?.type === "cancelled" ? "cancelled" : row.payload?.type === "rescheduled" ? "rescheduled" : "confirmed";
    const mail = consultationEmails(booking, type, env.SITE_URL, row.payload?.by);
    const results = [
      await sendNotificationEmail(env, mail.candidate, `uktl-consult-${eventId}-candidate`),
      await sendNotificationEmail(env, mail.team, `uktl-consult-${eventId}-team`),
    ];
    outcome = results.find((r) => r.status === "failed") ?? results.find((r) => r.status === "skipped") ?? { status: "sent" };
  }
  await env.DB.prepare("UPDATE booking_events SET delivery_status=?,last_error=? WHERE id=?")
    .bind(outcome.status, outcome.status === "sent" ? null : outcome.reason, eventId)
    .run();
  return outcome;
}
