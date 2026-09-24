import { createClient } from "@supabase/supabase-js";
import type { AppEnv } from "./env";

/**
 * FAQ media lives in the private `uktl-videos` bucket. Browsers upload straight
 * to Storage with a short-lived signed upload URL (the Worker never buffers
 * 100 MB), then the server verifies the stored object's size, declared type and
 * leading bytes before a topic may reference it.
 *
 * Accepted formats — chosen for native playback in every current browser:
 *  - video:     MP4 (H.264 video + AAC audio, preferred) or WebM (VP9/Opus), ≤ 100 MB
 *  - captions:  WebVTT (.vtt), ≤ 1 MB — required with any video (WCAG 2.2 AA, 1.2.2)
 *  - thumbnail: JPEG, PNG or WebP, 16:9 (1280×720 recommended), ≤ 5 MB
 */
export const MEDIA_BUCKET = "uktl-videos";

export const MEDIA_KINDS = {
  video: {
    column: "video_key",
    maxBytes: 100 * 1024 * 1024,
    types: { "video/mp4": "mp4", "video/webm": "webm" } as Record<string, string>,
  },
  captions: {
    column: "captions_key",
    maxBytes: 1024 * 1024,
    types: { "text/vtt": "vtt" } as Record<string, string>,
  },
  thumbnail: {
    column: "thumbnail_key",
    maxBytes: 5 * 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>,
  },
} as const;
export type MediaKind = keyof typeof MEDIA_KINDS;

const TOPIC = /^[a-zA-Z0-9_-]{1,100}$/;
const KEY = /^videos\/[a-zA-Z0-9_-]{1,100}\/(video|captions|thumbnail)-[a-f0-9]{32}\.(mp4|webm|vtt|jpg|png|webp)$/;

export function mediaKey(topicId: string, kind: MediaKind, contentType: string) {
  const spec = MEDIA_KINDS[kind];
  const ext = spec.types[contentType];
  if (!ext) throw new Error(`Unsupported ${kind} format. Accepted: ${Object.keys(spec.types).join(", ")}`);
  if (!TOPIC.test(topicId)) throw new Error("Invalid topic");
  return `videos/${topicId}/${kind}-${crypto.randomUUID().replace(/-/g, "")}.${ext}`;
}

export function isMediaKey(key: string, topicId: string, kind: MediaKind) {
  return TOPIC.test(topicId) && KEY.test(key) && key.startsWith(`videos/${topicId}/${kind}-`);
}

/** Checks the first bytes match the declared format, so a renamed file cannot be published. */
export function sniffMedia(bytes: Uint8Array, contentType: string): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  switch (contentType) {
    case "video/mp4":
      return ascii(4, 8) === "ftyp";
    case "video/webm":
      return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    case "text/vtt": {
      const offset = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
      return ascii(offset, offset + 6) === "WEBVTT" && [undefined, 0x0a, 0x0d, 0x20, 0x09].includes(bytes[offset + 6]);
    }
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return ascii(1, 4) === "PNG" && bytes[0] === 0x89;
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    default:
      return false;
  }
}

function storageClient(env: AppEnv) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Media storage is not configured");
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(MEDIA_BUCKET);
}

export async function createMediaUpload(env: AppEnv, topicId: string, kind: MediaKind, contentType: string, size: number) {
  const spec = MEDIA_KINDS[kind];
  if (size <= 0 || size > spec.maxBytes)
    throw new Error(`${kind} files must be under ${Math.round(spec.maxBytes / 1048576)} MB`);
  const exists = await env.DB.prepare("SELECT id FROM faq_topics WHERE id=?").bind(topicId).first();
  if (!exists) throw new Error("Topic not found");
  const key = mediaKey(topicId, kind, contentType);
  const { data, error } = await storageClient(env).createSignedUploadUrl(key);
  if (error || !data) throw new Error("Upload could not be started");
  return { key, signedUrl: data.signedUrl };
}

/** Verifies an uploaded object and attaches it to the topic; replaces and removes the previous file. */
export async function attachMedia(env: AppEnv, topicId: string, kind: MediaKind, key: string, durationS?: number) {
  const spec = MEDIA_KINDS[kind];
  if (!isMediaKey(key, topicId, kind)) throw new Error("Invalid media key");
  const object = await env.DB.prepare(
    "SELECT metadata->>'mimetype' AS mimetype,(metadata->>'size')::bigint AS size FROM storage.objects WHERE bucket_id=? AND name=?",
  )
    .bind(MEDIA_BUCKET, key)
    .first<{ mimetype: string | null; size: number | string | null }>();
  const size = Number(object?.size ?? 0);
  const mimetype = (object?.mimetype ?? "").split(";")[0].trim().toLowerCase();
  const expected = Object.entries(spec.types).find(([, ext]) => key.endsWith(`.${ext}`))?.[0];
  const storage = storageClient(env);
  const reject = async (message: string) => {
    await storage.remove([key]).catch(() => undefined);
    throw new Error(message);
  };
  if (!object || !expected) return reject("Upload not found. Try again.");
  if (size <= 0 || size > spec.maxBytes) return reject("File is larger than allowed");
  if (mimetype !== expected) return reject("File type does not match its format");
  const signed = await storage.createSignedUrl(key, 60);
  if (signed.error || !signed.data) return reject("Upload could not be verified");
  const head = await fetch(signed.data.signedUrl, {
    headers: { Range: "bytes=0-31" },
    signal: AbortSignal.timeout(15000),
  });
  const bytes = new Uint8Array(await head.arrayBuffer()).slice(0, 32);
  if (!head.ok || !sniffMedia(bytes, expected)) return reject("File contents do not match an accepted format");

  const previous = await env.DB.prepare(`SELECT ${spec.column} AS key FROM faq_topics WHERE id=?`)
    .bind(topicId)
    .first<{ key: string | null }>();
  const duration = kind === "video" && durationS && durationS > 0 && durationS < 86400 ? Math.round(durationS) : null;
  const updated = await env.DB.prepare(
    `UPDATE faq_topics SET ${spec.column}=?,updated_at=?${kind === "video" ? ",duration_s=COALESCE(?,duration_s)" : ""} WHERE id=? RETURNING id`,
  )
    .bind(...(kind === "video" ? [key, Date.now(), duration, topicId] : [key, Date.now(), topicId]))
    .first();
  if (!updated) return reject("Topic not found");
  if (previous?.key && previous.key !== key) await storage.remove([previous.key]).catch(() => undefined);
  return { key };
}

export async function detachMedia(env: AppEnv, topicId: string, kind: MediaKind) {
  const spec = MEDIA_KINDS[kind];
  const previous = await env.DB.prepare(`SELECT ${spec.column} AS key FROM faq_topics WHERE id=?`)
    .bind(topicId)
    .first<{ key: string | null }>();
  await env.DB.prepare(`UPDATE faq_topics SET ${spec.column}=NULL,updated_at=? WHERE id=?`).bind(Date.now(), topicId).run();
  if (previous?.key) await storageClient(env).remove([previous.key]).catch(() => undefined);
  return { ok: true };
}

/** Short-lived playback/preview URLs for keys already validated as bucket paths. */
export async function signMedia(env: AppEnv, keys: (string | null | undefined)[], seconds = 900) {
  const valid = keys.filter((k): k is string => !!k && /^videos\/[a-zA-Z0-9_./-]+$/.test(k) && !k.includes(".."));
  if (!valid.length) return {} as Record<string, string>;
  const { data, error } = await storageClient(env).createSignedUrls(valid, seconds);
  if (error || !data) return {} as Record<string, string>;
  return Object.fromEntries(
    data.filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl as string]),
  ) as Record<string, string>;
}
