import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import { validateCvUpload } from "../src/lib/server/upload-validation.ts";
import { extractDocxText } from "../src/lib/server/docx.ts";

test("SQL values remain bound and literal/comment question marks are preserved", () => {
  const value = "'; DROP TABLE candidates; --";
  const result = postgresQuery("SELECT '?' AS literal, ? AS value -- ?\n/* ? */", [value]);
  assert.equal(result.sql, "SELECT '?' AS literal, $1 AS value -- ?\n/* ? */");
  assert.deepEqual(result.values, [value]);
});

test("numbered SQL placeholders preserve reuse and reject missing or mixed bindings", () => {
  assert.equal(postgresQuery("SELECT ?1 + ?2 + ?1", [1, 2]).sql, "SELECT $1 + $2 + $1");
  assert.throws(() => postgresQuery("SELECT ?2", [1]));
  assert.throws(() => postgresQuery("SELECT ?", [1, 2]));
  assert.throws(() => postgresQuery("SELECT ?1, ?", [1]));
  assert.throws(() => postgresQuery("SELECT ?", [undefined]));
});

test("CV upload rejects spoofed extensions, empty files and binary text", () => {
  const buffer = (s: string) => new TextEncoder().encode(s).buffer;
  assert.equal(validateCvUpload("cv.pdf", buffer("%PDF-1.7")).kind, "pdf");
  assert.equal(validateCvUpload("cv.txt", buffer("Candidate experience")).kind, "text");
  assert.throws(() => validateCvUpload("cv.pdf", buffer("not a PDF")));
  assert.throws(() => validateCvUpload("cv.txt", buffer("\0binary")));
  assert.throws(() => validateCvUpload("cv.txt", buffer("")));
  assert.throws(() => validateCvUpload("cv.exe", buffer("%PDF-1.7")));
});

test("DOCX extraction skips unrelated archive entries and bounds document expansion", () => {
  const document = strToU8('<w:p><w:t>Relevant &amp; readable</w:t></w:p>');
  const archive = zipSync({ "word/document.xml": document, "word/media/image": new Uint8Array(6 * 1024 * 1024) });
  assert.equal(extractDocxText(archive.buffer as ArrayBuffer), "Relevant & readable");
  const bomb = zipSync({ "word/document.xml": new Uint8Array(5 * 1024 * 1024) });
  assert.throws(() => extractDocxText(bomb.buffer as ArrayBuffer));
});
