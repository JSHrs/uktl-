import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rankFaqs,
  approvedSourceUrl,
  sourceText,
  validateHrExcerpts,
  boundedText,
} from "../src/lib/server/hr.ts";
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
