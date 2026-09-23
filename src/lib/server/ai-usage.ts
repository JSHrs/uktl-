import type { AppEnv } from "./env";
import { boundedText } from "./bounded-response.ts";
export function readTokenUsage(body: unknown) {
  const usage = (body as { usage?: Record<string, unknown> } | null)?.usage;
  const token = (key: string) => {
    const n = usage?.[key];
    return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
  };
  return {
    input: token("input_tokens"),
    output: token("output_tokens"),
    cacheRead: token("cache_read_input_tokens"),
    cacheWrite: token("cache_creation_input_tokens"),
  };
}
export async function trackedAnthropicFetch(
  env: AppEnv | undefined,
  purpose: string,
  model: string,
  init: RequestInit,
): Promise<Response> {
  let callId: string | undefined;
  if (env?.DATA_BACKEND === "supabase") {
    const limit = Number(env.AI_HOURLY_CALL_LIMIT || 100);
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000)
      throw new Error("AI budget is not configured safely");
    const row = await env.DB.prepare("SELECT recruitment.begin_ai_usage(?,?,?) AS id")
      .bind(purpose, model, limit)
      .first<{ id: string }>();
    if (!row?.id) throw new Error("AI usage could not be recorded");
    callId = row.id;
  }
  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", { ...init, redirect: "error" });
  } catch {
    if (callId)
      await env!.DB.prepare("UPDATE ai_usage SET status='failed',completed_at=? WHERE id=?::uuid")
        .bind(Date.now(), callId)
        .run();
    throw new Error("AI provider unavailable");
  }
  if (callId) {
    let body: unknown = null;
    // Unknown usage remains NULL, never reported as zero cost. No provider text is saved.
    if (response.ok)
      try {
        body = JSON.parse(await boundedText(response.clone(), 1024 * 1024));
      } catch {
        /* incomplete usage */
      }
    const t = readTokenUsage(body);
    await env!.DB.prepare(
      "UPDATE ai_usage SET status=?,input_tokens=?,output_tokens=?,cache_read_tokens=?,cache_write_tokens=?,completed_at=? WHERE id=?::uuid",
    )
      .bind(
        response.ok ? "succeeded" : "failed",
        t.input,
        t.output,
        t.cacheRead,
        t.cacheWrite,
        Date.now(),
        callId,
      )
      .run();
  }
  return response;
}
