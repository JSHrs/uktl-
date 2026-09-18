import { test, expect } from "./fixtures";
test("scheduled Reed imports reject unauthenticated callers", async ({ request }) => {
  const response = await request.post("/api/reed-sync", { data: { sector: "technology" } });
  expect(response.status()).toBe(401);
});
