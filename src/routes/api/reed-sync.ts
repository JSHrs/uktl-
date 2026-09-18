import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/server/env";
import { validMaintenanceSecret } from "@/lib/server/processing";
import { enforceRateLimit } from "@/lib/server/ratelimit";
import { resumeReedSync } from "@/lib/server/reed-sync";
export const Route = createFileRoute("/api/reed-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization || !/^Bearer \S{32,}$/.test(authorization))
          return new Response("Unauthorized", {
            status: 401,
            headers: { "Cache-Control": "no-store" },
          });
        try {
          const env = await getEnv();
          if (!(await validMaintenanceSecret(authorization, env.CRON_SECRET)))
            return new Response("Unauthorized", { status: 401 });
          const { sector } = await request.json();
          if (sector !== "construction" && sector !== "technology")
            return new Response("Invalid sector", { status: 400 });
          await enforceRateLimit(env, "reedSync", `scheduled:${sector}`);
          const result = await resumeReedSync(env, sector);
          return Response.json(result, {
            status: result.failed ? 503 : result.partial ? 202 : 200,
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return Response.json({ error: "Vacancy sync unavailable" }, { status: 503 });
        }
      },
    },
  },
});
