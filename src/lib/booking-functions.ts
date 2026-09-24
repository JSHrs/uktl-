import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestEnv as getEnv } from "./server/request-env";
import { requireViewer, requireAdmin, requireStaff } from "./server/viewer";
import { getCandidateSession } from "./supabase";
import { enforceRateLimit } from "./server/ratelimit";
import {
  availableSlots,
  reserveConsultation,
  listMyConsultations,
  cancelConsultation,
  deliverBookingEvent,
  loadCalendar,
  listUpcomingConsultations,
  validateRules,
  londonWallToUtc,
} from "./server/calendar";

// ── Candidate ────────────────────────────────────────────────────────────────

export const consultationSlotsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ reschedule: z.string().max(100).optional() }).strict().parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    await requireViewer();
    const offer = await availableSlots(await getEnv(), Date.now(), data.reschedule);
    return { timezone: offer.timezone, slotMinutes: offer.slotMinutes, location: offer.location, slots: offer.slots };
  });

export const bookConsultationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        startsAt: z.number().int().positive(),
        name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(40).optional(),
        topic: z.string().trim().max(120).optional(),
        notes: z.string().trim().max(1000).optional(),
        queryId: z.string().max(100).optional(),
        replaces: z.string().max(100).optional(),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      session = await getCandidateSession(),
      env = await getEnv();
    if (session.userId !== viewer.userId || !session.email)
      throw new Error("Sign in with a verified email to book a consultation");
    await enforceRateLimit(env, "bookingIntent", viewer.userId!);
    const booking = await reserveConsultation(env, {
      userId: viewer.userId!,
      email: session.email,
      name: data.name,
      phone: data.phone,
      topic: data.topic,
      notes: data.notes,
      queryId: data.queryId,
      startsAt: data.startsAt,
      replaces: data.replaces,
    });
    // The appointment is the record; email is a notification that staff can retry.
    try {
      await deliverBookingEvent(env, booking.eventId);
    } catch {
      /* Outbox row stays pending for Admin → Consultations. */
    }
    return { id: booking.id, start: booking.start, end: booking.end };
  });

export const myBookingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await requireViewer();
  return listMyConsultations(await getEnv(), viewer.userId!);
});

export const cancelMyBookingFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().min(1).max(100) }).strict().parse(raw))
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      env = await getEnv();
    await enforceRateLimit(env, "bookingIntent", viewer.userId!);
    const { eventId } = await cancelConsultation(env, data.id, viewer.userId!);
    try {
      await deliverBookingEvent(env, eventId);
    } catch {
      /* Retryable from the admin outbox. */
    }
    return { ok: true };
  });

// ── Staff ────────────────────────────────────────────────────────────────────

export const adminCalendarFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const env = await getEnv(),
    now = Date.now();
  const cal = await loadCalendar(env, now - 86400000, now + 366 * 86400000);
  return { ...cal, upcoming: await listUpcomingConsultations(env, now) };
});

const Settings = z
  .object({
    slot_minutes: z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
    buffer_minutes: z.number().int().min(0).max(120),
    min_notice_hours: z.number().int().min(0).max(336),
    max_days_ahead: z.number().int().min(1).max(180),
    daily_limit: z.number().int().min(1).max(48),
    location: z.string().trim().min(1).max(300),
  })
  .strict();

export const saveCalendarSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => Settings.parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    await (await getEnv()).DB.prepare(
      "UPDATE booking_settings SET slot_minutes=?,buffer_minutes=?,min_notice_hours=?,max_days_ahead=?,daily_limit=?,location=?,updated_at=? WHERE id",
    )
      .bind(
        data.slot_minutes,
        data.buffer_minutes,
        data.min_notice_hours,
        data.max_days_ahead,
        data.daily_limit,
        data.location,
        Date.now(),
      )
      .run();
    return { ok: true };
  });

export const saveAvailabilityFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        rules: z
          .array(
            z
              .object({
                weekday: z.number().int().min(1).max(7),
                start_minute: z.number().int().min(0).max(1439),
                end_minute: z.number().int().min(1).max(1440),
              })
              .strict(),
          )
          .max(50),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const rules = validateRules(data.rules),
      env = await getEnv(),
      now = Date.now();
    // Replace the weekly pattern atomically; existing appointments are unaffected.
    await env.DB.batch([
      env.DB.prepare("DELETE FROM availability_rules"),
      ...rules.map((r) =>
        env.DB.prepare(
          "INSERT INTO availability_rules(weekday,start_minute,end_minute,created_at) VALUES(?,?,?,?)",
        ).bind(r.weekday, r.start_minute, r.end_minute, now),
      ),
    ]);
    return { ok: true };
  });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const addAvailabilityBlockFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ from: isoDate, to: isoDate, reason: z.string().trim().max(200).optional() })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    // Whole London days, `to` inclusive.
    const [fy, fm, fd] = data.from.split("-").map(Number),
      [ty, tm, td] = data.to.split("-").map(Number);
    const next = new Date(Date.UTC(ty, tm - 1, td + 1));
    const startsAt = londonWallToUtc(fy, fm, fd, 0),
      endsAt = londonWallToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0);
    if (startsAt === null || endsAt === null || endsAt <= startsAt || endsAt - startsAt > 366 * 86400000)
      throw new Error("Choose a closure of one day to one year");
    await (await getEnv()).DB.prepare(
      "INSERT INTO availability_blocks(starts_at,ends_at,reason,created_at) VALUES(?,?,?,?)",
    )
      .bind(startsAt, endsAt, data.reason || null, Date.now())
      .run();
    return { ok: true };
  });

export const removeAvailabilityBlockFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).strict().parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    await (await getEnv()).DB.prepare("DELETE FROM availability_blocks WHERE id=?::uuid").bind(data.id).run();
    return { ok: true };
  });

export const staffCancelBookingFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().min(1).max(100) }).strict().parse(raw))
  .handler(async ({ data }) => {
    await requireStaff();
    const env = await getEnv();
    const { eventId } = await cancelConsultation(env, data.id, null);
    try {
      await deliverBookingEvent(env, eventId);
    } catch {
      /* Retryable from the outbox list. */
    }
    return { ok: true };
  });

export const bookingDeliveryEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return (
    (
      await (
        await getEnv()
      ).DB.prepare(
        "SELECT id,booking_id,delivery_status,attempts,last_error,created_at FROM booking_events ORDER BY created_at DESC LIMIT 50",
      ).all<{
        id: string;
        booking_id: string;
        delivery_status: string;
        attempts: number;
        last_error: string | null;
        created_at: number;
      }>()
    ).results ?? []
  );
});

export const retryBookingEventFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ id: z.string().min(1).max(120) })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    return deliverBookingEvent(await getEnv(), data.id);
  });
