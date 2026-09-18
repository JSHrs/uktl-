import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rankFaqs,
  approvedSourceUrl,
  sourceText,
  validateHrExcerpts,
  boundedText,
} from "../src/lib/server/hr.ts";
import {
  verifyCalendlySignature,
  calendlyEmbedUrl,
  processCalendlyWebhook,
} from "../src/lib/server/calendly.ts";
test("FAQ ranking uses distinct full tokens and category alone cannot invent a match", () => {
  const topic = {
    id: "one",
    title: "Pay at work",
    keywords: ["pay", "wages"],
    category: "pay",
  } as any;
  assert.equal(rankFaqs("repayment", [topic], "pay").length, 0);
  assert.equal(rankFaqs("pay pay pay", [topic], "pay")[0].score, 15);
  assert.equal(rankFaqs("pay wages", [topic], "pay")[0].score, 25);
  assert.equal(rankFaqs("unknown", [topic], "pay").length, 0);
});
test("HR sources forbid redirects/alternate hosts and require supplied verbatim evidence", () => {
  for (const url of [
    "http://www.acas.org.uk/pay",
    "https://www.acas.org.uk.evil.test/pay",
    "https://www.acas.org.uk@evil.test/pay",
    "https://www.acas.org.uk/pay?q=x",
    "https://127.0.0.1/pay",
  ])
    assert.throws(() => approvedSourceUrl(url));
  assert.equal(
    sourceText(
      "<nav>Ignore</nav><main><script>secret</script><h1>Pay</h1><p>Source &amp; text</p></main>",
    ),
    "Pay Source & text",
  );
  assert.throws(() => sourceText("<body>No main</body>"));
  const id = crypto.randomUUID(),
    source = {
      id,
      url: "https://www.acas.org.uk/pay",
      title: "Fixture",
      body: "Approved source words.",
      reviewed_at: 1,
      retrieved_at: 1,
      content_hash: "fixture",
    };
  assert.equal(
    validateHrExcerpts({ excerpts: [{ sourceId: id, quote: "source words" }] }, [source])[0].quote,
    "source words",
  );
  assert.throws(() =>
    validateHrExcerpts({ excerpts: [{ sourceId: id, quote: "invented advice" }] }, [source]),
  );
  assert.throws(() =>
    validateHrExcerpts({ excerpts: [{ sourceId: crypto.randomUUID(), quote: "source words" }] }, [
      source,
    ]),
  );
  assert.deepEqual(validateHrExcerpts({ excerpts: [] }, [source]), []);
});
test("provider response reads are bounded", async () => {
  assert.equal(await boundedText(new Response("safe"), 4), "safe");
  await assert.rejects(boundedText(new Response("oversized"), 3));
});
test("Calendly signature uses exact raw body, tolerates rotating signatures and rejects stale replay", async () => {
  const raw = '{"event":"fixture"}',
    secret = "test-only-signing-secret",
    now = Date.now(),
    t = String(Math.floor(now / 1000));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = Array.from(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`))),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  const header = `t=${t},v1=${"0".repeat(64)},v1=${mac}`;
  assert.equal(await verifyCalendlySignature(raw, header, secret, now), true);
  assert.equal(await verifyCalendlySignature(raw + " ", header, secret, now), false);
  assert.equal(await verifyCalendlySignature(raw, header, secret, now + 181000), false);
  assert.equal(await verifyCalendlySignature(raw, header, undefined, now), false);
  assert.equal(await verifyCalendlySignature(raw, header + `,t=${t}`, secret, now), false);
});
test("Calendly embeds contain opaque intent only and provider URLs fail closed", async () => {
  const id = crypto.randomUUID(),
    url = new URL(calendlyEmbedUrl("https://calendly.com/uktl/consultation", id));
  assert.equal(url.searchParams.get("utm_content"), id);
  assert.equal([...url.searchParams].length, 2);
  for (const bad of [
    "https://evil.test/a/b",
    "https://calendly.com/a/b?email=secret",
    "http://calendly.com/a/b",
  ])
    assert.throws(() => calendlyEmbedUrl(bad, id));
  await assert.rejects(
    processCalendlyWebhook(
      {} as any,
      JSON.stringify({ event: "invitee.created", payload: { uri: "http://127.0.0.1/private" } }),
    ),
  );
});
