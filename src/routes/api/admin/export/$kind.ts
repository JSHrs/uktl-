import { createFileRoute } from "@tanstack/react-router";
import { getRequestEnv } from "@/lib/server/request-env";
import { getViewer } from "@/lib/server/viewer";
import { enforceRateLimit, RateLimitError } from "@/lib/server/ratelimit";
import { buildExport, EXPORTS, type ExportKind } from "@/lib/server/admin-tools";

// Admin-only CSV downloads. Every export is written to the audit log in the
// same transaction as the read. Anything else gets a 404.
export const Route = createFileRoute("/api/admin/export/$kind")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const viewer = await getViewer();
        if (!viewer.isAdmin || !viewer.userId || !(params.kind in EXPORTS))
          return new Response("Not found", { status: 404 });
        const job = new URL(request.url).searchParams.get("job") ?? "";
        if (job && !/^[\w-]{1,100}$/.test(job)) return new Response("Not found", { status: 404 });
        try {
          const env = await getRequestEnv();
          await enforceRateLimit(env, "dataExport", viewer.userId);
          const out = await buildExport(env, params.kind as ExportKind, viewer.userId, job);
          return new Response(out.csv, {
            headers: {
              "content-type": "text/csv; charset=utf-8",
              "content-disposition": `attachment; filename="${out.filename}"`,
              "cache-control": "private, no-store",
              "x-content-type-options": "nosniff",
              "x-robots-tag": "noindex",
            },
          });
        } catch (e) {
          const limited = e instanceof RateLimitError;
          return new Response(limited ? "Too many exports. Try again later." : "Export unavailable", {
            status: limited ? 429 : 503,
          });
        }
      },
    },
  },
});
