// This function orchestrates the shared application importer, so admin and
// daily imports use identical validation and database authorization rules.
export async function handleReedSync(
  request: Request,
  env: { token?: string; origin?: string },
  send: typeof fetch = fetch,
) {
  const noStore = { "Cache-Control": "no-store" };
  if (request.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...noStore, Allow: "POST" },
    });
  if (
    !env.token ||
    env.token.length < 32 ||
    request.headers.get("authorization") !== `Bearer ${env.token}`
  )
    return new Response("Unauthorized", { status: 401, headers: noStore });
  try {
    const origin = new URL(env.origin ?? "");
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      throw new Error("Invalid origin");
    // No caller-selected target or redirects: never forward the secret elsewhere.
    const results = await Promise.all(
      ["construction", "technology"].map(async (sector) => {
        try {
          const response = await send(new URL("/api/reed-sync", origin), {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(110000),
            headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ sector }),
          });
          return { sector, ok: response.ok };
        } catch {
          return { sector, ok: false };
        }
      }),
    );
    return Response.json(
      { results },
      { status: results.every((r) => r.ok) ? 200 : 503, headers: noStore },
    );
  } catch {
    return Response.json(
      { error: "Sync configuration unavailable" },
      { status: 503, headers: noStore },
    );
  }
}
