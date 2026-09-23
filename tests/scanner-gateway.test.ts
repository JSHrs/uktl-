import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { createHash } from "node:crypto";
import { scannerServer, scanWithClamd } from "../services/cv-scanner/server.mjs";
async function start(server: any) {
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return server.address().port;
}
async function stop(server: any) {
  server.closeAllConnections?.();
  await new Promise<void>((r) => server.close(() => r()));
}
test("ClamAV streaming gateway accepts only a complete clean response", async () => {
  for (const [response, expected] of [
    ["stream: OK\0", "clean"],
    ["stream: synthetic-test FOUND\0", "infected"],
    ["stream: size limit exceeded ERROR\0", null],
  ] as const) {
    let received = Buffer.alloc(0);
    const server = createServer((socket) =>
      socket.on("data", (chunk) => {
        received = Buffer.concat([received, chunk]);
        if (received.length >= 22) socket.end(response);
      }),
    );
    const port = await start(server);
    try {
      if (expected)
        assert.equal(
          await scanWithClamd(Buffer.from("fixture"), { port, timeout: 1000 }),
          expected,
        );
      else await assert.rejects(scanWithClamd(Buffer.from("fixture"), { port, timeout: 1000 }));
      assert.equal(received.subarray(0, 10).toString(), "zINSTREAM\0");
      assert.equal(received.readUInt32BE(10), 7);
    } finally {
      await stop(server);
    }
  }
});
test("private gateway authenticates, validates exact digest and hides engine failures", async () => {
  const token = "synthetic-token-32-characters-long",
    body = "fixture";
  let scans = 0;
  const server = scannerServer({
      token,
      scan: async () => {
        scans++;
        return "clean";
      },
    }),
    port = await start(server),
    url = `http://127.0.0.1:${port}/scan`;
  const headers = {
    authorization: `Bearer ${token}`,
    "x-content-sha256": createHash("sha256").update(body).digest("hex"),
  };
  try {
    assert.equal((await fetch(url, { method: "POST", body })).status, 401);
    assert.equal(scans, 0);
    assert.equal(
      (
        await fetch(url, {
          method: "POST",
          body,
          headers: { ...headers, "x-content-sha256": "0".repeat(64) },
        })
      ).status,
      400,
    );
    assert.equal(scans, 0);
    const r = await fetch(url, { method: "POST", body, headers });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).verdict, "clean");
    assert.equal(scans, 1);
  } finally {
    await stop(server);
  }
  const unavailable = scannerServer({
      token,
      scan: async () => {
        throw new Error("secret provider diagnostics");
      },
    }),
    p = await start(unavailable);
  try {
    const r = await fetch(`http://127.0.0.1:${p}/scan`, { method: "POST", body, headers });
    assert.equal(r.status, 503);
    assert.ok(!(await r.text()).includes("secret"));
  } finally {
    await stop(unavailable);
  }
});
