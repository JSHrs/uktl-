import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/lib/server/env";
import { getCandidate } from "@/lib/server/db";
import { canAccessCandidate, getViewer } from "@/lib/server/viewer";

// Streams the original CV from R2. Same access rule as the candidate record:
// admin, or the candidate it belongs to. Anything else is a 404, not a 403.
export const Route = createFileRoute("/api/cv/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const viewer = await getViewer();
        let env: Awaited<ReturnType<typeof getEnv>>;
        try {
          env = await getEnv();
        } catch {
          return new Response("File storage is not configured in this environment", { status: 503 });
        }

        const candidate = await getCandidate(env, params.id);
        if (!candidate?.source_r2_key || !canAccessCandidate(viewer, candidate.auth_user_id)) {
          return new Response("Not found", { status: 404 });
        }

        const object = await env.CV_BUCKET.get(candidate.source_r2_key);
        if (!object) return new Response("Not found", { status: 404 });

        const filename = (candidate.source_filename ?? `${candidate.id}.pdf`).replace(/[^\w.\-]+/g, "_");
        return new Response(object.body, {
          headers: {
            "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
            "content-disposition": `attachment; filename="${filename}"`,
            "content-length": String(object.size),
            "cache-control": "private, no-store",
            "x-content-type-options": "nosniff",
            "content-security-policy": "sandbox",
          },
        });
      },
    },
  },
});
