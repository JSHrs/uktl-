import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv, weekStart } from "../src/lib/server/admin-tools.ts";
import { sniffMedia, mediaKey, isMediaKey } from "../src/lib/server/media.ts";
import { OUTREACH_TEMPLATES, fillTemplate } from "../src/lib/outreach-templates.ts";

test("CSV cells are quoted and spreadsheet formulas are neutralised", () => {
  for (const f of ["=1+1", "+44 7000", "-2", "@SUM(A1)", "\tx", "\rx"]) assert.ok(csvCell(f).startsWith(`"'`), f);
  assert.equal(csvCell('say "hi", ok'), '"say ""hi"", ok"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(42), '"42"');
  assert.equal(toCsv([{ key: "a", label: "A" }], [{ a: "line\nbreak" }]), '﻿"A"\r\n"line\nbreak"\r\n');
});

test("weeks start on Monday 00:00 UTC", () => {
  for (const d of [6, 7, 8, 9, 10, 11, 12])
    assert.equal(new Date(weekStart(Date.UTC(2025, 9, d, 23, 59))).toISOString(), "2025-10-06T00:00:00.000Z");
  assert.equal(new Date(weekStart(Date.UTC(2025, 9, 13))).toISOString(), "2025-10-13T00:00:00.000Z");
});

test("uploads are recognised by their leading bytes, not their name", () => {
  const b = (...x: (number | string)[]) =>
    new Uint8Array(x.flatMap((v) => (typeof v === "string" ? [...new TextEncoder().encode(v)] : [v])));
  assert.ok(sniffMedia(b(0, 0, 0, 0x20, "ftypisom"), "video/mp4"));
  assert.ok(!sniffMedia(b("<html>ftyp"), "video/mp4"));
  assert.ok(sniffMedia(b(0x1a, 0x45, 0xdf, 0xa3, 0), "video/webm"));
  assert.ok(sniffMedia(b("WEBVTT\n\n"), "text/vtt"));
  assert.ok(sniffMedia(b(0xef, 0xbb, 0xbf, "WEBVTT - title\n"), "text/vtt"));
  assert.ok(!sniffMedia(b("WEBVTTX"), "text/vtt"));
  assert.ok(!sniffMedia(b("1\n00:00:00,000 --> 00:00:01,000"), "text/vtt"), "SRT is not WebVTT");
  assert.ok(sniffMedia(b(0xff, 0xd8, 0xff, 0xe0), "image/jpeg"));
  assert.ok(sniffMedia(b(0x89, "PNG\r\n"), "image/png"));
  assert.ok(sniffMedia(b("RIFF", 0, 0, 0, 0, "WEBPVP8 "), "image/webp"));
  assert.ok(!sniffMedia(b(0x89, "PNG"), "image/svg+xml"));
});

test("media keys are server-generated, per topic and per kind", () => {
  const key = mediaKey("faq_abc", "video", "video/mp4");
  assert.match(key, /^videos\/faq_abc\/video-[a-f0-9]{32}\.mp4$/);
  assert.ok(isMediaKey(key, "faq_abc", "video"));
  assert.ok(!isMediaKey(key, "faq_other", "video"));
  assert.ok(!isMediaKey(key, "faq_abc", "thumbnail"));
  assert.ok(!isMediaKey("videos/faq_abc/../x/video-" + "a".repeat(32) + ".mp4", "faq_abc", "video"));
  assert.throws(() => mediaKey("faq_abc", "video", "video/quicktime"));
  assert.throws(() => mediaKey("../etc", "video", "video/mp4"));
});

test("outreach templates fill every placeholder", () => {
  for (const t of Object.values(OUTREACH_TEMPLATES)) {
    const text = fillTemplate(t.subject + t.body, { name: "Ada Lovelace", role: "Site Manager", company: null, consultant: "Sam", siteUrl: "https://uktl.example/" });
    assert.ok(!/\{[a-z_]+\}/.test(text), text);
  }
  const intro = fillTemplate(OUTREACH_TEMPLATES.role_intro.body, { name: null, role: "Analyst", company: "Acme", consultant: "Sam", siteUrl: "https://uktl.example" });
  assert.match(intro, /^Hello there,/);
  assert.match(intro, /Analyst position with Acme/);
  assert.match(intro, /https:\/\/uktl\.example\/app\/consultations/);
});
