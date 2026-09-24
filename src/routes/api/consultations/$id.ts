import { createFileRoute } from "@tanstack/react-router";
import { getRequestEnv } from "@/lib/server/request-env";
import { getViewer } from "@/lib/server/viewer";
import { consultationIcs, getConsultation } from "@/lib/server/calendar";

// Calendar file for one consultation: the candidate it belongs to, or staff.
export const Route = createFileRoute("/api/consultations/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const viewer = await getViewer();
        if (!viewer.userId) return new Response("Not found", { status: 404 });
        try {
          const booking = await getConsultation(await getRequestEnv(), params.id);
          if (!booking || (!viewer.isStaff && booking.auth_user_id !== viewer.userId))
            return new Response("Not found", { status: 404 });
          return new Response(consultationIcs(booking), {
            headers: {
              "content-type": "text/calendar; charset=utf-8",
              "content-disposition": `attachment; filename="uktl-consultation.ics"`,
              "cache-control": "private, no-store",
              "x-content-type-options": "nosniff",
            },
          });
        } catch {
          return new Response("Calendar unavailable", { status: 503 });
        }
      },
    },
  },
});
