import postgres from "postgres";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import { createMediaUpload, attachMedia, detachMedia, signMedia, MEDIA_BUCKET } from "../src/lib/server/media.ts";

// Real local Supabase Storage + PostgreSQL: signed direct upload, server-side
// verification of size/type/leading bytes, replacement and review invalidation.
const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const api = process.env.TEST_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
for (const u of [url, api])
  if (!["127.0.0.1", "localhost"].includes(new URL(u).hostname))
    throw new Error("Only isolated local fixtures are permitted");
if (!serviceKey) throw new Error("Set TEST_SUPABASE_SERVICE_ROLE_KEY from `supabase status`");
const sql = postgres(url, { max: 1, prepare: false });
const storage = createClient(api, serviceKey, { auth: { persistSession: false } }).storage.from(MEDIA_BUCKET);
const topic = "faq_media" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const env = {
  DATA_BACKEND: "supabase",
  SUPABASE_URL: api,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  DB: {
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...args: unknown[]) {
          values = args;
          return this;
        },
        async execute() {
          const q = postgresQuery(query, values);
          await sql`SET search_path=recruitment,public`;
          return sql.unsafe(q.sql, q.values as any[]);
        },
        async first() {
          return (await this.execute())[0] ?? null;
        },
        async all() {
          return { success: true, results: await this.execute() };
        },
        async run() {
          return { success: true, results: await this.execute() };
        },
      };
    },
  },
} as any;

async function put(signedUrl: string, body: Uint8Array | string, type: string) {
  const res = await fetch(signedUrl, { method: "PUT", headers: { "content-type": type, "x-upsert": "false" }, body });
  assert.ok(res.ok, `upload accepted (${res.status})`);
}
const mp4 = new Uint8Array([0, 0, 0, 0x18, ...new TextEncoder().encode("ftypmp42"), ...new Uint8Array(64)]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Uint8Array(32)]);

try {
  await sql`INSERT INTO recruitment.faq_topics(id,title,category,keywords,published,view_count,created_at,answer) VALUES(${topic},'Media fixture','pay','[]',1,0,1,'A reviewed written answer for the fixture topic.')`;
  await sql`UPDATE recruitment.faq_topics SET reviewed_at=1 WHERE id=${topic}`;

  await assert.rejects(createMediaUpload(env, topic, "thumbnail", "image/png", 6 * 1024 * 1024), /under 5 MB/);
  await assert.rejects(createMediaUpload(env, topic, "video", "video/quicktime", 1000), /Unsupported/);
  await assert.rejects(createMediaUpload(env, "faq_missing", "video", "video/mp4", 1000), /not found/);

  const first = await createMediaUpload(env, topic, "video", "video/mp4", mp4.length);
  assert.match(first.key, new RegExp(`^videos/${topic}/video-[a-f0-9]{32}\\.mp4$`));
  await put(first.signedUrl, mp4, "video/mp4");
  await attachMedia(env, topic, "video", first.key, 93.4);
  let row = (await sql`SELECT video_key,duration_s,reviewed_at FROM recruitment.faq_topics WHERE id=${topic}`)[0];
  assert.equal(row.video_key, first.key);
  assert.equal(Number(row.duration_s), 93);
  assert.equal(row.reviewed_at, null, "new media withdraws approval");

  // Renamed file: declared MP4 but the bytes are not.
  const fake = await createMediaUpload(env, topic, "video", "video/mp4", 100);
  await put(fake.signedUrl, "not really a video, just text pretending", "video/mp4");
  await assert.rejects(attachMedia(env, topic, "video", fake.key), /contents do not match/);
  assert.equal((await sql`SELECT count(*)::int AS n FROM storage.objects WHERE name=${fake.key}`)[0].n, 0, "rejected upload deleted");

  // Declared type differs from the key's format.
  const mismatch = await createMediaUpload(env, topic, "thumbnail", "image/jpeg", png.length);
  await put(mismatch.signedUrl, png, "image/png");
  await assert.rejects(attachMedia(env, topic, "thumbnail", mismatch.key), /type does not match/);

  const poster = await createMediaUpload(env, topic, "thumbnail", "image/png", png.length);
  await put(poster.signedUrl, png, "image/png");
  await attachMedia(env, topic, "thumbnail", poster.key);

  const captions = await createMediaUpload(env, topic, "captions", "text/vtt", 40);
  await put(captions.signedUrl, "WEBVTT\n\n00:00.000 --> 00:01.000\nHello\n", "text/vtt");
  await attachMedia(env, topic, "captions", captions.key);

  await assert.rejects(attachMedia(env, topic, "video", "videos/other/video-" + "a".repeat(32) + ".mp4"), /Invalid media key/);
  await assert.rejects(attachMedia(env, topic, "video", poster.key), /Invalid media key/);

  // Replacement removes the previous object.
  const second = await createMediaUpload(env, topic, "video", "video/mp4", mp4.length);
  await put(second.signedUrl, mp4, "video/mp4");
  await attachMedia(env, topic, "video", second.key);
  assert.equal((await sql`SELECT count(*)::int AS n FROM storage.objects WHERE name=${first.key}`)[0].n, 0);

  const signed = await signMedia(env, [second.key, poster.key, captions.key]);
  assert.equal(Object.keys(signed).length, 3);
  assert.equal((await fetch(signed[captions.key])).status, 200);

  // Approval survives only while content is unchanged.
  await sql`UPDATE recruitment.faq_topics SET reviewed_at=${Date.now()},transcript='Transcript of the fixture video.' WHERE id=${topic}`;
  row = (await sql`SELECT reviewed_at FROM recruitment.faq_topics WHERE id=${topic}`)[0];
  assert.notEqual(row.reviewed_at, null, "an approving update keeps its own approval");
  await sql`UPDATE recruitment.faq_topics SET answer='Edited answer text after approval.' WHERE id=${topic}`;
  row = (await sql`SELECT reviewed_at FROM recruitment.faq_topics WHERE id=${topic}`)[0];
  assert.equal(row.reviewed_at, null, "editing the answer withdraws approval");

  await detachMedia(env, topic, "thumbnail");
  assert.equal((await sql`SELECT thumbnail_key FROM recruitment.faq_topics WHERE id=${topic}`)[0].thumbnail_key, null);
  assert.deepEqual(
    (await sql`SELECT allowed_mime_types FROM storage.buckets WHERE id=${MEDIA_BUCKET}`)[0].allowed_mime_types.sort(),
    ["image/jpeg", "image/png", "image/webp", "text/vtt", "video/mp4", "video/webm"],
  );
} finally {
  const left = await sql`SELECT name FROM storage.objects WHERE bucket_id=${MEDIA_BUCKET} AND name LIKE ${"videos/" + topic + "/%"}`;
  if (left.length) await storage.remove(left.map((r) => r.name));
  await sql`DELETE FROM recruitment.faq_topics WHERE id=${topic}`;
  await sql.end();
}
console.log("PASS: signed media upload, byte/type/size verification, replacement cleanup, signing and approval invalidation");
