import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireViewer, requireStaff } from "./server/viewer";
import { getRequestEnv } from "./server/request-env";
import { enforceRateLimit } from "./server/ratelimit";
import { readConversation, postConversation } from "./server/conversations";
const candidateId = z.string().min(1).max(100).optional();
export const conversationFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ candidateId, before: z.object({time:z.number().int().positive(),id:z.string().uuid()}).optional() }).strict().parse(raw),
  )
  .handler(async ({ data }) =>
    readConversation(await getRequestEnv(), await requireViewer(), data.candidateId, data.before),
  );
export const sendConversationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ candidateId, id: z.string().uuid(), body: z.string().trim().min(1).max(8000) })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      env = await getRequestEnv();
    await enforceRateLimit(env, "candidateOutreach", viewer.userId!);
    return postConversation(env, viewer, data);
  });
export const conversationListFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({ query: z.string().trim().max(100).default("") })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const env = await getRequestEnv();
    const rows = await env.DB.prepare(
      `SELECT c.id,c.name,max(m.created_at) AS last_message FROM candidates c LEFT JOIN conversation_messages m ON m.candidate_id=c.id WHERE c.auth_user_id IS NOT NULL AND (?='' OR lower(coalesce(c.name,'')) LIKE '%'||lower(?)||'%') GROUP BY c.id,c.name ORDER BY max(m.created_at) DESC NULLS LAST,c.created_at DESC LIMIT 100`,
    )
      .bind(data.query, data.query)
      .all<{ id: string; name: string | null; last_message: number | null }>();
    return rows.results ?? [];
  });
