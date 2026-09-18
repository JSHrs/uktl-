import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getEnv } from "./server/env";
import { requireViewer, requireAdmin } from "./server/viewer";
import { getCandidateSession } from "./supabase";
import { enforceRateLimit } from "./server/ratelimit";
import { createBookingIntent, bookingIntentStatus, deliverBookingEvent } from "./server/calendly";
export const createBookingIntentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ queryId: z.string().max(100).optional() })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      session = await getCandidateSession(),
      env = await getEnv();
    if (session.userId !== viewer.userId || !session.email)
      throw new Error("Sign in to schedule a consultation");
    await enforceRateLimit(env, "bookingIntent", viewer.userId!);
    try {
      return await createBookingIntent(env, viewer.userId!, session.email, data.queryId);
    } catch {
      throw new Error(
        "Verified consultation scheduling is unavailable. Please retry later or contact the team.",
      );
    }
  });
export const bookingIntentStatusFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).strict().parse(raw))
  .handler(async ({ data }) => {
    const v = await requireViewer();
    return bookingIntentStatus(await getEnv(), v.userId!, data.id);
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
      .object({ id: z.string().regex(/^[a-f0-9]{64}$/) })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    return deliverBookingEvent(await getEnv(), data.id);
  });
