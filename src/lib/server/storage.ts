import { createClient } from "@supabase/supabase-js";
import type {} from "./env";

export function createPrivateCvStorage(url: string, key: string): R2Bucket {
  if (new URL(url).protocol !== "https:") throw new Error("Storage requires HTTPS");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) }) },
  });
  const bucket = client.storage.from("uktl-cvs");
  return {
    async put(path, value, options) {
      if (!(value instanceof ArrayBuffer) && typeof value !== "string") {
        throw new Error("CV uploads require a bounded buffer");
      }
      const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
      if (bytes.byteLength === 0 || bytes.byteLength > 10 * 1024 * 1024) {
        throw new Error("CV must be between 1 byte and 10 MiB");
      }
      const { error } = await bucket.upload(path, bytes, {
        contentType: options?.httpMetadata?.contentType,
        upsert: false,
      });
      if (error) throw new Error("Private CV upload failed");
    },
    async get(path) {
      const { data, error } = await bucket.download(path);
      if (error) {
        if ("statusCode" in error && String(error.statusCode) === "404") return null;
        throw new Error("Private CV download failed");
      }
      return {
        body: data.stream(), size: data.size,
        httpMetadata: { contentType: data.type },
        arrayBuffer: () => data.arrayBuffer(), text: () => data.text(),
      };
    },
    async delete(path) {
      const { error } = await bucket.remove([path]);
      if (error) throw new Error("Private CV deletion failed");
    },
  };
}
