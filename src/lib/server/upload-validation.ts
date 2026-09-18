export const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function validateCvUpload(filename: string, bytes: ArrayBuffer): { kind: "pdf" | "docx" | "text"; contentType: string } {
  const data = new Uint8Array(bytes);
  if (!data.length || data.length > 10 * 1024 * 1024) throw new Error("CV must be between 1 byte and 10 MiB");
  const extension = filename.toLowerCase().split(".").pop();
  if (extension === "pdf" && new TextDecoder().decode(data.slice(0, 5)) === "%PDF-") {
    return { kind: "pdf", contentType: "application/pdf" };
  }
  if (extension === "docx" && data[0] === 0x50 && data[1] === 0x4b && data[2] === 3 && data[3] === 4) {
    return { kind: "docx", contentType: DOCX_CONTENT_TYPE };
  }
  if (extension === "txt") {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
      const binaryControl = Array.from(text).some((char) => {
        const code = char.charCodeAt(0);
        return code <= 8 || (code >= 14 && code <= 31);
      });
      if (!text.trim() || binaryControl) throw new Error();
      return { kind: "text", contentType: "text/plain" };
    } catch { throw new Error("TXT files must contain readable UTF-8 text"); }
  }
  throw new Error("File contents must match a PDF, DOCX or TXT extension");
}
