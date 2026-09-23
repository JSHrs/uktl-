import { createServer } from "node:http";
import { createConnection } from "node:net";
import { createHash, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
const MAX = 10 * 1024 * 1024;
export function scanWithClamd(bytes, { host = "127.0.0.1", port = 3310, timeout = 25000 } = {}) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX)
    return Promise.reject(new Error("Invalid scan input"));
  return new Promise((resolve, reject) => {
    let reply = Buffer.alloc(0),
      settled = false;
    const socket = createConnection({ host, port });
    const finish = (error, verdict) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      socket.destroy();
      error ? reject(new Error("Scanner unavailable")) : resolve(verdict);
    };
    const deadline = setTimeout(() => finish(true), timeout);
    socket.on("error", () => finish(true));
    socket.on("end", () => {
      if (settled) return;
      const result = reply.toString("utf8");
      if (result === "stream: OK\0") finish(false, "clean");
      else if (/^stream: [^\0]+ FOUND\0$/.test(result)) finish(false, "infected");
      else finish(true);
    });
    socket.on("connect", () => {
      socket.write(Buffer.from("zINSTREAM\0"));
      for (let offset = 0; offset < bytes.length; offset += 65536) {
        const chunk = bytes.subarray(offset, offset + 65536),
          size = Buffer.alloc(4);
        size.writeUInt32BE(chunk.length);
        socket.write(size);
        socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
    socket.on("data", (chunk) => {
      reply = Buffer.concat([reply, chunk]);
      if (reply.length > 4096) finish(true);
    });
  });
}
export function scannerServer({ token, scan = scanWithClamd, maxConcurrent = 2 }) {
  if (typeof token !== "string" || token.length < 32)
    throw new Error("A scanner token of at least 32 characters is required");
  const digest = (v) => createHash("sha256").update(v).digest(),
    expected = digest(`Bearer ${token}`);
  let active = 0;
  const server = createServer(async (req, res) => {
    const respond = (status, body) => {
      if (!res.destroyed) {
        res.writeHead(status, {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        res.end(JSON.stringify(body));
      }
    };
    if (req.method !== "POST" || req.url !== "/scan") return respond(404, { error: "Not found" });
    const auth = req.headers.authorization;
    if (typeof auth !== "string" || auth.length > 1024 || !timingSafeEqual(digest(auth), expected))
      return respond(401, { error: "Unauthorized" });
    if (active >= maxConcurrent) return respond(429, { error: "Scanner busy" });
    const declared = Number(req.headers["content-length"]);
    if (
      req.headers["content-length"] &&
      (!Number.isInteger(declared) || declared < 1 || declared > MAX)
    )
      return respond(413, { error: "File size rejected" });
    if (!/^[a-f0-9]{64}$/.test(req.headers["x-content-sha256"] ?? ""))
      return respond(400, { error: "File digest required" });
    active++;
    const timer = setTimeout(() => req.destroy(), 30000);
    try {
      let length = 0;
      const chunks = [];
      for await (const chunk of req) {
        length += chunk.length;
        if (length > MAX) {
          respond(413, { error: "File too large" });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      }
      if (!length) return respond(400, { error: "Empty file" });
      const bytes = Buffer.concat(chunks),
        sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== req.headers["x-content-sha256"])
        return respond(400, { error: "Digest mismatch" });
      const verdict = await scan(bytes);
      if (!["clean", "infected"].includes(verdict)) throw new Error();
      respond(200, { verdict, sha256 });
    } catch {
      respond(503, { error: "Scanner unavailable" });
    } finally {
      clearTimeout(timer);
      active--;
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.maxRequestsPerSocket = 20;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = scannerServer({
    token: process.env.CV_SCAN_TOKEN,
    scan: (bytes) =>
      scanWithClamd(bytes, {
        host: process.env.CLAMD_HOST ?? "127.0.0.1",
        port: Number(process.env.CLAMD_PORT ?? 3310),
      }),
  });
  server.listen(Number(process.env.PORT ?? 8080), process.env.LISTEN_HOST ?? "127.0.0.1", () =>
    console.log("Private scanner gateway listening."),
  );
}
