import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getRequestEnv as getEnv } from "./server/request-env";
import { requireViewer, requireAdmin, getViewer } from "./server/viewer";
import { listFaqTopics } from "./server/db";
import {
  createHrJourney,
  getHrJourney,
  saveHrResolution,
  rankFaqs,
  answerHrJourney,
  recordVideoPlay,
  retrieveHrSource,
} from "./server/hr";
import { enforceRateLimit } from "./server/ratelimit";
const id = z.string().min(1).max(100);
export const createHrQuestionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        question: z.string().trim().min(3).max(4000),
        category: z.string().max(100).optional(),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      env = await getEnv();
    await enforceRateLimit(env, "hrQuestion", viewer.userId!);
    return createHrJourney(env, viewer.userId!, data.question, data.category);
  });
export const listHrHistoryFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({ cursor: z.object({ at: z.number().int().nonnegative(), id }).optional() })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      env = await getEnv();
    const cursor = data.cursor;
    const rows =
      (
        await env.DB.prepare(
          `SELECT id,question,created_at,resolution_type FROM hr_queries WHERE auth_user_id=? AND (created_at<? OR (created_at=? AND id>?)) ORDER BY created_at DESC,id LIMIT 26`,
        )
          .bind(
            viewer.userId!,
            cursor?.at ?? Number.MAX_SAFE_INTEGER,
            cursor?.at ?? Number.MAX_SAFE_INTEGER,
            cursor?.id ?? "",
          )
          .all<{
            id: string;
            question: string;
            created_at: number;
            resolution_type: string | null;
          }>()
      ).results ?? [];
    const items = rows.slice(0, 25),
      last = items.at(-1);
    return {
      items,
      nextCursor: rows.length > 25 && last ? { at: Number(last.created_at), id: last.id } : null,
    };
  });
export const getHrAnswerFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ id: id.optional(), topic: id.optional() }).strict().parse(raw),
  )
  .handler(async ({ data }) => {
    const env = await getEnv();
    let journey = null;
    if (data.id) {
      const viewer = await requireViewer();
      journey = await getHrJourney(env, viewer.userId!, data.id);
    }
    const topics = (await listFaqTopics(env)).filter((t) => t.reviewed_at && t.transcript);
    const suggestions = journey
      ? rankFaqs(journey.question, topics, journey.category ?? undefined)
      : [];
    const chosen = journey?.faq_topic_id ?? data.topic;
    const selected = chosen
      ? (topics.find((t) => t.id === chosen) ?? null)
      : (suggestions[0]?.topic ?? null);
    return {
      journey,
      topic: selected,
      related: suggestions.filter((s) => s.topic.id !== selected?.id),
      confidence: suggestions[0]?.score >= 25 ? "high" : "low",
    };
  });
export const saveHrResolutionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id,
        revision: z.number().int().nonnegative(),
        topicId: id.nullable(),
        resolution: z.enum(["yes", "partly", "no"]).nullable(),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer();
    await saveHrResolution(
      await getEnv(),
      viewer.userId!,
      data.id,
      data.revision,
      data.topicId,
      data.resolution,
    );
    return { ok: true };
  });
export const answerHrQuestionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ id, revision: z.number().int().nonnegative(), context: z.string().max(8000) })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer(),
      env = await getEnv();
    await enforceRateLimit(env, "aiEscalation", viewer.userId!);
    try {
      return await answerHrJourney(env, viewer.userId!, data.id, data.revision, data.context);
    } catch {
      throw new Error(
        "Source-backed guidance unavailable. Recently reviewed sources and a configured AI service are required. Reload to check for changes, or consult an adviser.",
      );
    }
  });
export const publicVideoTopicsFn = createServerFn({ method: "GET" }).handler(async () => {
  const env = await getEnv();
  return (await listFaqTopics(env)).filter((t) => t.reviewed_at && t.transcript);
});
export const videoPlaybackFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id }).strict().parse(raw))
  .handler(async ({ data }) => {
    const env = await getEnv();
    const row = await env.DB.prepare(
      "SELECT video_key,captions_key FROM faq_topics WHERE id=? AND published=1 AND reviewed_at IS NOT NULL AND transcript IS NOT NULL",
    )
      .bind(data.id)
      .first<{ video_key: string | null; captions_key: string | null }>();
    if (!row?.video_key || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Video unavailable");
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    async function sign(key: string) {
      if (!/^videos\/[a-zA-Z0-9_./-]+$/.test(key) || key.includes(".."))
        throw new Error("Invalid video key");
      const r = await client.storage.from("uktl-videos").createSignedUrl(key, 900);
      if (r.error || !r.data) throw new Error("Video unavailable");
      return r.data.signedUrl;
    }
    return {
      video: await sign(row.video_key),
      captions: row.captions_key ? await sign(row.captions_key) : null,
    };
  });
export const recordVideoPlayFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id }).strict().parse(raw))
  .handler(async ({ data }) => {
    const viewer = await getViewer();
    if (!viewer.userId) return { recorded: false };
    const env = await getEnv();
    await enforceRateLimit(env, "videoPlay", viewer.userId);
    await recordVideoPlay(env, viewer.userId, data.id);
    return { recorded: true };
  });
export const listHrSourcesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return (
    (
      await (
        await getEnv()
      ).DB.prepare("SELECT * FROM hr_sources ORDER BY retrieved_at DESC LIMIT 50").all<{
        id: string;
        url: string;
        title: string;
        category: string;
        body: string;
        content_hash: string;
        retrieved_at: number;
        active: boolean;
      }>()
    ).results ?? []
  );
});
export const retrieveHrSourceFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        url: z.string().max(500),
        title: z.string().trim().min(1).max(200),
        category: z.string().min(1).max(100),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    await enforceRateLimit(env, "hrSource", "administrator");
    try {
      await retrieveHrSource(env, data.url, data.title, data.category);
      return { ok: true };
    } catch {
      throw new Error("ACAS source could not be retrieved. Use an exact HTTPS guidance page.");
    }
  });
export const reviewHrSourceFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ id: z.string().uuid(), hash: z.string().length(64), active: z.boolean() })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const viewer = await requireViewer();
    const row = await (
      await getEnv()
    ).DB.prepare(
      "UPDATE hr_sources SET active=?,reviewed_at=?,reviewed_by=? WHERE id=?::uuid AND content_hash=? RETURNING id",
    )
      .bind(data.active, Date.now(), viewer.userId!, data.id, data.hash)
      .first();
    if (!row) throw new Error("Source changed. Reload and review again.");
    return { ok: true };
  });
export const reviewVideoFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id,
        transcript: z.string().trim().min(20).max(50000),
        videoKey: z
          .string()
          .regex(/^videos\/[a-zA-Z0-9_./-]+\.(mp4|webm)$/)
          .max(300),
        captionsKey: z
          .string()
          .regex(/^videos\/[a-zA-Z0-9_./-]+\.vtt$/)
          .max(300),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.videoKey.includes("..") || data.captionsKey.includes(".."))
      throw new Error("Invalid key");
    const row = await (
      await getEnv()
    ).DB.prepare(
      `UPDATE faq_topics SET transcript=?,video_key=?,captions_key=?,reviewed_at=? WHERE id=?
       AND EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='uktl-videos' AND name=?)
       AND EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='uktl-videos' AND name=?) RETURNING id`,
    )
      .bind(
        data.transcript,
        data.videoKey,
        data.captionsKey,
        Date.now(),
        data.id,
        data.videoKey,
        data.captionsKey,
      )
      .first();
    if (!row)
      throw new Error(
        "Topic or uploaded video/captions unavailable. Upload both assets before approval.",
      );
    return { ok: true };
  });
