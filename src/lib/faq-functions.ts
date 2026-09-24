import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestEnv as getEnv } from "./server/request-env";
import { requireAdmin, requireViewer } from "./server/viewer";
import { createMediaUpload, attachMedia, detachMedia, signMedia, MEDIA_KINDS } from "./server/media";

const topicId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const kind = z.enum(["video", "captions", "thumbnail"]);

/** Starts a direct browser → Storage upload. The file is not usable until attached. */
export const createFaqUploadFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ topicId, kind, contentType: z.string().max(100), size: z.number().int().positive() })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    return createMediaUpload(await getEnv(), data.topicId, data.kind, data.contentType.toLowerCase(), data.size);
  });

export const attachFaqMediaFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ topicId, kind, key: z.string().max(300), durationS: z.number().positive().max(86400).optional() })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    return attachMedia(await getEnv(), data.topicId, data.kind, data.key, data.durationS);
  });

export const removeFaqMediaFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ topicId, kind }).strict().parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    return detachMedia(await getEnv(), data.topicId, data.kind);
  });

/** Admin preview of a topic's current media, published or not. */
export const faqMediaPreviewFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ topicId }).strict().parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    const row = await env.DB.prepare(
      "SELECT video_key,captions_key,thumbnail_key,transcript,answer,reviewed_at FROM faq_topics WHERE id=?",
    )
      .bind(data.topicId)
      .first<{
        video_key: string | null;
        captions_key: string | null;
        thumbnail_key: string | null;
        transcript: string | null;
        answer: string | null;
        reviewed_at: number | null;
      }>();
    if (!row) throw new Error("Topic not found");
    let urls: Record<string, string> = {};
    try {
      urls = await signMedia(env, [row.video_key, row.captions_key, row.thumbnail_key], 900);
    } catch {
      /* Storage not configured: keys still shown. */
    }
    const url = (k: string | null) => (k ? (urls[k] ?? null) : null);
    return {
      ...row,
      reviewed_at: row.reviewed_at == null ? null : Number(row.reviewed_at),
      video_url: url(row.video_key),
      captions_url: url(row.captions_key),
      thumbnail_url: url(row.thumbnail_key),
      limits: Object.fromEntries(
        Object.entries(MEDIA_KINDS).map(([k, v]) => [k, { maxBytes: v.maxBytes, types: Object.keys(v.types) }]),
      ) as Record<"video" | "captions" | "thumbnail", { maxBytes: number; types: string[] }>,
    };
  });

/**
 * Approves exactly what is stored now. Any later edit to the title, answer,
 * transcript or media withdraws approval (database trigger).
 */
export const approveFaqFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({ topicId, transcript: z.string().trim().max(50000).optional(), approve: z.boolean() })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    await requireViewer();
    const env = await getEnv();
    if (!data.approve) {
      await env.DB.prepare("UPDATE faq_topics SET reviewed_at=NULL WHERE id=?").bind(data.topicId).run();
      return { ok: true };
    }
    const row = await env.DB.prepare(
      `UPDATE faq_topics SET transcript=?,reviewed_at=?,updated_at=?
        WHERE id=?
          AND (video_key IS NULL OR (captions_key IS NOT NULL AND length(?)>=20))
          AND (length(coalesce(answer,''))>=20 OR (video_key IS NOT NULL AND length(?)>=20))
        RETURNING id`,
    )
      .bind(data.transcript || null, Date.now(), Date.now(), data.topicId, data.transcript ?? "", data.transcript ?? "")
      .first();
    if (!row)
      throw new Error(
        "Approval needs a written answer (20+ characters) or a video. Any video also needs WebVTT captions and a reviewed transcript.",
      );
    return { ok: true };
  });
