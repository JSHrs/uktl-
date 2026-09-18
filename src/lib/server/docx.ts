import { strFromU8, unzipSync } from "fflate";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

// <w:t>text</w:t> | <w:tab/> <w:br/> <w:cr/> | </w:p>
const TOKEN = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:(tab|br|cr)(?:\s[^>]*)?\/>|<\/w:p>/g;

function decodeEntities(s: string): string {
  return s
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

export function extractDocxText(bytes: ArrayBuffer): string {
  let files: Record<string, Uint8Array>;
  try {
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error();
    let entries = 0;
    files = unzipSync(new Uint8Array(bytes), {
      filter(entry) {
        if (++entries > 2048) throw new Error();
        if (entry.name !== "word/document.xml") return false;
        if (entry.originalSize > 4 * 1024 * 1024) throw new Error();
        return true;
      },
    });
  } catch {
    throw new Error("File is not a valid DOCX document");
  }
  const document = files["word/document.xml"];
  if (!document) throw new Error("File is not a valid DOCX document");
  if (document.byteLength > 4 * 1024 * 1024) throw new Error("DOCX text is too large");

  // Visible text lives only in <w:t>; everything between tags is markup whitespace.
  let text = "";
  for (const m of strFromU8(document).matchAll(TOKEN)) {
    if (m[1] !== undefined) text += decodeEntities(m[1]);
    else if (m[2] === "tab") text += "\t";
    else text += "\n";
  }
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) throw new Error("DOCX document contains no readable text");
  return text;
}
