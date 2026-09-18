import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/server/env";
import { validMaintenanceSecret } from "@/lib/server/processing";
import { enforceRateLimit } from "@/lib/server/ratelimit";
import { syncReedJobs } from "@/lib/server/reed";
export const Route = createFileRoute("/api/reed-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = await getEnv();
          if (
            !(await validMaintenanceSecret(request.headers.get("authorization"), env.CRON_SECRET))
          )
            return new Response("Unauthorized", { status: 401 });
          const { sector } = await request.json();
          if (sector !== "construction" && sector !== "technology")
            return new Response("Invalid sector", { status: 400 });
          await enforceRateLimit(env, "reedSync", "admin");
          const result = await syncReedJobs(env, { sector, keywords: "", resultsToTake: 200 });
          return Response.json(result, {
            status: result.partial ? 503 : 200,
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return Response.json({ error: "Vacancy sync unavailable" }, { status: 503 });
        }
      },
    },
  },
});
