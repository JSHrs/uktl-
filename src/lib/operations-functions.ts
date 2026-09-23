import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestEnv } from "./server/request-env";
import { requireAdmin, requireViewer } from "./server/viewer";
import { enforceRateLimit } from "./server/ratelimit";
import { operationsSnapshot, finishFileDeletion } from "./server/operations";
import { requestPrivacyAction } from "./server/privacy";
export const getOperationsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return operationsSnapshot(await getRequestEnv());
});
export const retryFileDeletionFn = createServerFn({ method: "POST" })
  .inputValidator((r: unknown) => z.object({ id: z.string().uuid() }).strict().parse(r))
  .handler(async ({ data }) => {
    await requireAdmin();
    return finishFileDeletion(await getRequestEnv(), data.id);
  });
export const privacyRequestFn = createServerFn({ method: "POST" })
  .inputValidator((r: unknown) =>
    z
      .object({ kind: z.enum(["export", "erasure"]) })
      .strict()
      .parse(r),
  )
  .handler(async ({ data }) => {
    const v = await requireViewer(),
      env = await getRequestEnv();
    await enforceRateLimit(env, "privacy", v.userId!);
    return requestPrivacyAction(env, v.userId!, data.kind);
  });
export const myPrivacyRequestsFn = createServerFn({ method: "GET" }).handler(async () => {
  const v = await requireViewer();
  return (
    (
      await (
        await getRequestEnv()
      ).DB.prepare(
        "SELECT id,kind,status,created_at,updated_at,resolution FROM privacy_requests WHERE user_id=?::uuid ORDER BY created_at DESC LIMIT 50",
      )
        .bind(v.userId!)
        .all<{
          id: string;
          kind: string;
          status: string;
          created_at: number;
          resolution: string | null;
        }>()
    ).results ?? []
  );
});
export const reviewPrivacyRequestFn = createServerFn({ method: "POST" })
  .inputValidator((r: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["reviewing", "declined"]),
        resolution: z.string().trim().min(10).max(1000),
      })
      .strict()
      .parse(r),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const v = await requireViewer();
    const row = await (
      await getRequestEnv()
    ).DB.prepare(
      "UPDATE privacy_requests SET status=?,resolution=?,updated_at=?,reviewed_by=?::uuid WHERE id=?::uuid AND status IN ('pending','reviewing') RETURNING id",
    )
      .bind(data.status, data.resolution, Date.now(), v.userId!, data.id)
      .first();
    if (!row) throw new Error("Request changed; reload before reviewing");
    return { ok: true };
  });
