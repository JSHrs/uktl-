import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/server/env";
import { validMaintenanceSecret } from "@/lib/server/processing";
export const Route = createFileRoute("/api/operations/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
        try {
          const env = await getEnv();
          if (
            !(await validMaintenanceSecret(request.headers.get("authorization"), env.CRON_SECRET))
          )
            return new Response("Unauthorized", { status: 401, headers });
          if (env.DATA_BACKEND !== "supabase") throw new Error();
          const now = Date.now();
          const row = await env.DB.prepare(
            `SELECT
   (SELECT COUNT(*)::int FROM processing_jobs WHERE status='failed' OR (status='running' AND locked_at<?1) OR (status='pending' AND available_at<?2)) AS cv_issues,
   (SELECT COUNT(*)::int FROM reed_sync_state WHERE status='complete' AND completed_at>?3) AS recent_sectors,
   (SELECT COUNT(*)::int FROM file_deletions WHERE status='pending' AND created_at<?2) AS cleanup_issues,
   (SELECT COUNT(*)::int FROM booking_events WHERE delivery_status IN ('failed','skipped')) AS delivery_issues`,
          )
            .bind(now - 900000, now - 3600000, now - 36 * 3600000)
            .first<{
              cv_issues: number;
              recent_sectors: number;
              cleanup_issues: number;
              delivery_issues: number;
            }>();
          if (!row) throw new Error();
          const healthy =
            row.cv_issues === 0 &&
            row.recent_sectors === 2 &&
            row.cleanup_issues === 0 &&
            row.delivery_issues === 0;
          return Response.json(
            { status: healthy ? "healthy" : "attention_required", checkedAt: now, ...row },
            { status: healthy ? 200 : 503, headers },
          );
        } catch {
          return Response.json({ status: "unavailable" }, { status: 503, headers });
        }
      },
    },
  },
});
