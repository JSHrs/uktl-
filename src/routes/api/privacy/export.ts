import { createFileRoute } from "@tanstack/react-router";
import { requireViewer } from "@/lib/server/viewer";
import { getRequestEnv } from "@/lib/server/request-env";
import { exportOwnData } from "@/lib/server/privacy";
import { enforceRateLimit } from "@/lib/server/ratelimit";
export const Route = createFileRoute("/api/privacy/export")({
  server: {
    handlers: {
      GET: async () => {
        const headers = {
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "content-type": "application/json",
        };
        try {
          const v = await requireViewer(),
            env = await getRequestEnv();
          await enforceRateLimit(env, "privacy", v.userId!);
          const data = await exportOwnData(env, v.userId!);
          return new Response(JSON.stringify(data, null, 2), {
            headers: {
              ...headers,
              "content-disposition": 'attachment; filename="uktl-personal-data.json"',
            },
          });
        } catch {
          return Response.json(
            {
              error: "Export unavailable. Sign in or request a reviewed export from your profile.",
            },
            { status: 503, headers },
          );
        }
      },
    },
  },
});
