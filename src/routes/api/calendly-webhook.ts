import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/server/env";
import { boundedText } from "@/lib/server/hr";
import {
  verifyCalendlySignature,
  processCalendlyWebhook,
  deliverBookingEvent,
} from "@/lib/server/calendly";
export const Route = createFileRoute("/api/calendly-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = await getEnv();
          if (!env.CALENDLY_WEBHOOK_SECRET) return new Response("Unavailable", { status: 503 });
          if (Number(request.headers.get("content-length") ?? 0) > 200000)
            return new Response("Too large", { status: 413 });
          const raw = await boundedText(new Response(request.body), 200000);
          if (
            !(await verifyCalendlySignature(
              raw,
              request.headers.get("Calendly-Webhook-Signature"),
              env.CALENDLY_WEBHOOK_SECRET,
            ))
          )
            return new Response("Unauthorized", { status: 401 });
          const result = await processCalendlyWebhook(env, raw);
          if (result.eventId) {
            try {
              await deliverBookingEvent(env, result.eventId);
            } catch {
              /* Persisted outbox remains available for operator reconciliation. */
            }
          }
          return Response.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return new Response("Webhook could not be processed", { status: 503 });
        }
      },
    },
  },
});
