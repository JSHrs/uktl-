import { z } from "zod";
import type { AppEnv } from "./env";
import { boundedText, getHrJourney } from "./hr.ts";
import { sendNotificationEmail } from "./notify.ts";
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const inviteePattern = new RegExp(
  `^https://api\\.calendly\\.com/scheduled_events/${UUID}/invitees/${UUID}$`,
);
const eventPattern = new RegExp(`^https://api\\.calendly\\.com/scheduled_events/${UUID}$`);
const typePattern = new RegExp(`^https://api\\.calendly\\.com/event_types/${UUID}$`);
const encoder = new TextEncoder();
export async function sha256(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export function calendlyEmbedUrl(raw: string | undefined, intent: string) {
  if (!raw) throw new Error("Consultation scheduling is not configured");
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "calendly.com" ||
    u.port ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname)
  )
    throw new Error("Consultation scheduling is not configured");
  u.searchParams.set("utm_source", "uktl");
  u.searchParams.set("utm_content", z.string().uuid().parse(intent));
  return u.href;
}
export async function verifyCalendlySignature(
  raw: string,
  header: string | null,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!secret || !header) return false;
  const parts = header.split(",").map((p) => p.trim());
  const times = parts.filter((p) => p.startsWith("t="));
  if (times.length !== 1 || !/^t=\d{10}$/.test(times[0])) return false;
  const timestamp = times[0].slice(2);
  if (Math.abs(now - Number(timestamp) * 1000) > 180000) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  for (const part of parts.filter((p) => /^v1=[a-fA-F0-9]{64}$/.test(p))) {
    const signature = Uint8Array.from(part.slice(3).match(/../g)!, (h) => parseInt(h, 16));
    if (await crypto.subtle.verify("HMAC", key, signature, encoder.encode(`${timestamp}.${raw}`)))
      return true;
  }
  return false;
}
export async function createBookingIntent(
  env: AppEnv,
  userId: string,
  email: string,
  queryId?: string,
) {
  const id = crypto.randomUUID(),
    url = calendlyEmbedUrl(env.CALENDLY_URL, id);
  if (
    !env.CALENDLY_API_TOKEN ||
    !env.CALENDLY_WEBHOOK_SECRET ||
    !typePattern.test(env.CALENDLY_EVENT_TYPE_URI ?? "")
  )
    throw new Error("Verified scheduling is not configured");
  if (queryId) await getHrJourney(env, userId, queryId);
  await env.DB.prepare(
    "INSERT INTO booking_intents(id,user_id,email,query_id,created_at,expires_at) VALUES(?::uuid,?::uuid,?,?,?,?)",
  )
    .bind(
      id,
      userId,
      email.trim().toLowerCase(),
      queryId ?? null,
      Date.now(),
      Date.now() + 86400000,
    )
    .run();
  return { id, url };
}
export async function bookingIntentStatus(env: AppEnv, userId: string, id: string) {
  const owner = await env.DB.prepare(
    "SELECT id FROM booking_intents WHERE id=?::uuid AND user_id=?::uuid",
  )
    .bind(id, userId)
    .first();
  if (!owner) throw new Error("Booking unavailable");
  return (
    (
      await env.DB.prepare(
        "SELECT id,status,starts_at,ends_at,cancel_url,reschedule_url FROM bookings WHERE intent_id=?::uuid AND auth_user_id=? ORDER BY provider_updated_at DESC LIMIT 10",
      )
        .bind(id, userId)
        .all<{
          id: string;
          status: string;
          starts_at: number;
          ends_at: number;
          cancel_url: string | null;
          reschedule_url: string | null;
        }>()
    ).results ?? []
  );
}
const Invitee = z.object({
  uri: z.string().regex(inviteePattern),
  email: z.string().email().max(320),
  name: z.string().max(300),
  status: z.enum(["active", "canceled"]),
  event: z.string().regex(eventPattern),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  tracking: z.object({ utm_content: z.string().nullable().optional() }).nullish(),
  old_invitee: z.string().nullable().optional(),
  cancel_url: z.string().nullable().optional(),
  reschedule_url: z.string().nullable().optional(),
});
const Event = z.object({
  uri: z.string().regex(eventPattern),
  event_type: z.string().regex(typePattern),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
});
function managementUrl(raw: string | null | undefined, kind: "cancellations" | "reschedulings") {
  if (!raw) return null;
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "calendly.com" ||
    u.port ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !new RegExp(`^/${kind}/${UUID}$`).test(u.pathname)
  )
    return null;
  return u.href;
}
async function providerGet(env: AppEnv, uri: string) {
  if (!env.CALENDLY_API_TOKEN) throw new Error("Calendly unavailable");
  const response = await fetch(uri, {
    headers: { Authorization: `Bearer ${env.CALENDLY_API_TOKEN}`, Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Calendly unavailable");
  return JSON.parse(await boundedText(response, 200000)).resource;
}
export async function processCalendlyWebhook(env: AppEnv, raw: string) {
  const notice = z
    .object({
      event: z.enum(["invitee.created", "invitee.canceled"]),
      payload: z.object({ uri: z.string().regex(inviteePattern) }),
    })
    .parse(JSON.parse(raw));
  const invitee = Invitee.parse(await providerGet(env, notice.payload.uri));
  if (invitee.uri !== notice.payload.uri) throw new Error("Invitee mismatch");
  const event = Event.parse(await providerGet(env, invitee.event));
  if (event.uri !== invitee.event) throw new Error("Event mismatch");
  if (!env.CALENDLY_EVENT_TYPE_URI || event.event_type !== env.CALENDLY_EVENT_TYPE_URI)
    return { ignored: true };
  const updated = Date.parse(invitee.updated_at),
    created = Date.parse(invitee.created_at),
    starts = Date.parse(event.start_time),
    ends = Date.parse(event.end_time);
  if (ends <= starts || updated < created || updated > Date.now() + 180000)
    throw new Error("Invalid provider times");
  const intentId = z.string().uuid().safeParse(invitee.tracking?.utm_content);
  const intent = intentId.success
    ? await env.DB.prepare(
        "SELECT id,user_id,query_id FROM booking_intents WHERE id=?::uuid AND email=? AND created_at<=? AND expires_at>=?",
      )
        .bind(intentId.data, invitee.email.toLowerCase(), created, created)
        .first<{ id: string; user_id: string; query_id: string | null }>()
    : null;
  const id = "cal_" + (await sha256(invitee.uri)),
    status = invitee.status === "active" ? "confirmed" : "cancelled",
    eventId = await sha256(`${invitee.uri}|${updated}|${status}`);
  const payload = {
    status,
    name: invitee.name,
    email: invitee.email,
    startsAt: starts,
    endsAt: ends,
  };
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO bookings(id,created_at,auth_user_id,user_email,contact_name,contact_email,calendly_uri,status,provider_invitee_uri,provider_updated_at,starts_at,ends_at,cancel_url,reschedule_url,intent_id,old_invitee_uri,notification_status)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?::uuid,?,'skipped')
 ON CONFLICT(provider_invitee_uri) DO UPDATE SET status=excluded.status,provider_updated_at=excluded.provider_updated_at,starts_at=excluded.starts_at,ends_at=excluded.ends_at,cancel_url=excluded.cancel_url,reschedule_url=excluded.reschedule_url,old_invitee_uri=excluded.old_invitee_uri
 WHERE excluded.provider_updated_at>bookings.provider_updated_at OR (excluded.provider_updated_at=bookings.provider_updated_at AND excluded.status='cancelled' AND bookings.status<>'cancelled')`,
    ).bind(
      id,
      created,
      intent?.user_id ?? null,
      intent ? invitee.email : null,
      invitee.name,
      invitee.email,
      event.uri,
      status,
      invitee.uri,
      updated,
      starts,
      ends,
      managementUrl(invitee.cancel_url, "cancellations"),
      managementUrl(invitee.reschedule_url, "reschedulings"),
      intent?.id ?? null,
      invitee.old_invitee && inviteePattern.test(invitee.old_invitee) ? invitee.old_invitee : null,
    ),
    env.DB.prepare(
      `INSERT INTO booking_events(id,booking_id,payload,created_at) SELECT ?,id,?::jsonb,? FROM bookings WHERE id=? AND provider_updated_at=? AND status=? ON CONFLICT(id) DO NOTHING`,
    ).bind(eventId, payload, Date.now(), id, updated, status),
  ]);
  return { ignored: false, eventId };
}
export async function deliverBookingEvent(env: AppEnv, id: string) {
  const row = await env.DB.prepare(
    `UPDATE booking_events SET delivery_status='sending',attempts=attempts+1 WHERE id=? AND delivery_status IN('pending','failed','skipped') AND created_at>? RETURNING payload`,
  )
    .bind(id, Date.now() - 23 * 3600000)
    .first<{
      payload: { status: string; name: string; email: string; startsAt: number; endsAt: number };
    }>();
  if (!row) return { status: "skipped" as const };
  const p = row.payload;
  const result = await sendNotificationEmail(
    env,
    {
      subject: `Verified consultation ${p.status}`,
      replyTo: p.email,
      text: `Calendly verified a consultation ${p.status}.\nName: ${p.name}\nEmail: ${p.email}\nStarts (UTC): ${new Date(p.startsAt).toISOString()}\nEnds (UTC): ${new Date(p.endsAt).toISOString()}\nCheck the admin booking log for the latest status.`,
    },
    `uktl-calendly-${id}`,
  );
  await env.DB.prepare("UPDATE booking_events SET delivery_status=?,last_error=? WHERE id=?")
    .bind(result.status, result.status === "sent" ? null : result.reason, id)
    .run();
  return result;
}
