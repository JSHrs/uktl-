import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseFixture } from "./database-fixture.ts";
import { syncReedJobs, normaliseReedJob, reedDate, saveReedJob } from "../src/lib/server/reed.ts";
import { listJobs } from "../src/lib/server/db.ts";
import { saveCandidateDecision } from "../src/lib/server/discovery.ts";
import { handleReedSync } from "../supabase/functions/reed-sync/handler.ts";

test("Reed dates reject invalid calendars and distinguish UK day/month; sector filtering uses role evidence", () => {
  assert.equal(reedDate("02/03/2026"), "2026-03-02");
  assert.equal(reedDate("31/02/2026"), null);
  assert.equal(reedDate("tomorrow"), null);
  assert.equal(
    normaliseReedJob(
      { jobTitle: "Accountant", jobDescription: "A software construction company" },
      1,
      "technology",
    ),
    null,
  );
  assert.throws(() =>
    normaliseReedJob({ jobTitle: "Software engineer", expirationDate: "bad" }, 1, "technology"),
  );
  const j = normaliseReedJob(
    { jobTitle: "Software engineer", minimumSalary: null, jobUrl: "javascript:bad" },
    1,
    "technology",
  )!;
  assert.equal(j.salaryMin, null);
  assert.equal(j.sourceUrl, null);
  assert.equal(
    normaliseReedJob(
      { jobTitle: "Software engineer", jobUrl: "https://www.reed.co.uk/jobs/software-engineer/1" },
      1,
      "technology",
    )!.sourceUrl,
    "https://www.reed.co.uk/jobs/software-engineer/1",
  );
});
test("Reed upsert preserves IDs, staff closure and curated requirements; expired roles reject interest", async () => {
  const { db, env } = databaseFixture();
  try {
    const job = normaliseReedJob(
      {
        jobTitle: "Software engineer",
        minimumSalary: 50000,
        maximumSalary: 60000,
        expirationDate: "01/01/2020",
      },
      1,
      "technology",
    )!;
    await saveReedJob(env, job);
    const first = db.prepare("SELECT * FROM jobs WHERE source='reed'").get()!;
    db.prepare("UPDATE jobs SET must_have_skills='[\"python\"]',status='closed' WHERE id=?").run(
      first.id,
    );
    await saveReedJob(env, { ...job, title: "Senior software engineer", salaryMin: 55000 });
    const second = db.prepare("SELECT * FROM jobs WHERE source='reed'").get()!;
    assert.equal(second.id, first.id);
    assert.equal(second.status, "closed");
    assert.equal(second.must_have_skills, '["python"]');
    assert.equal(second.salary_min, 55000);
    db.prepare("UPDATE jobs SET status='open' WHERE id=?").run(first.id);
    assert.ok(!(await listJobs(env)).some((j) => j.id === first.id));
    db.prepare(
      "INSERT INTO candidates(id,created_at,updated_at,status,auth_user_id) VALUES('test',1,1,'parsed','owner')",
    ).run();
    await assert.rejects(
      saveCandidateDecision(env, "owner", "test", String(first.id), "interested"),
    );
  } finally {
    db.close();
  }
});
test("Reed pages use detail endpoint, deduplicate and report partial failures without deleting records", async () => {
  const { db, env } = databaseFixture();
  env.REED_API_KEY = "test-only";
  const original = globalThis.fetch;
  const calls: string[] = [];
  try {
    globalThis.fetch = async (input) => {
      const u = new URL(String(input));
      calls.push(u.toString());
      if (u.pathname.endsWith("/search"))
        return Response.json({
          results:
            u.searchParams.get("resultsToSkip") === "0"
              ? Array.from({ length: 100 }, (_, i) => ({ jobId: i + 1 }))
              : [{ jobId: 1 }, { jobId: 101 }],
          totalResults: 102,
        });
      if (u.pathname.endsWith("/101"))
        return new Response("private provider diagnostics", { status: 500 });
      return Response.json({
        jobTitle: "Software engineer",
        minimumSalary: 50000,
        maximumSalary: 60000,
        datePosted: "18/09/2026",
        expirationDate: "01/01/2030",
      });
    };
    const result = await syncReedJobs(env, {
      sector: "technology",
      keywords: "",
      resultsToTake: 200,
    });
    assert.deepEqual(result, { saved: 100, skipped: 1, failed: 1, total: 102, partial: true });
    assert.ok(calls.some((u) => u.includes("resultsToSkip=100")));
    assert.equal(db.prepare("SELECT count(*) n FROM jobs WHERE source='reed'").get()!.n, 100);
    globalThis.fetch = async () => Response.json({ notResults: [] });
    assert.equal(
      (await syncReedJobs(env, { sector: "technology", keywords: "", resultsToTake: 200 })).partial,
      true,
    );
    assert.equal(db.prepare("SELECT count(*) n FROM jobs WHERE source='reed'").get()!.n, 100);
  } finally {
    globalThis.fetch = original;
    db.close();
  }
});
test("daily dispatcher fails closed, refuses unsafe origins and attempts both sectors", async () => {
  const token = "x".repeat(40);
  let calls = 0;
  const request = () =>
    new Request("https://example.invalid", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  const send = async (_u: unknown, init?: RequestInit) => {
    calls++;
    assert.equal(init?.redirect, "error");
    return new Response("", { status: calls === 1 ? 503 : 200 });
  };
  assert.equal(
    (await handleReedSync(request(), { origin: "https://app.invalid" }, send as typeof fetch))
      .status,
    401,
  );
  assert.equal(
    (await handleReedSync(request(), { token, origin: "http://app.invalid" }, send as typeof fetch))
      .status,
    503,
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await handleReedSync(
        request(),
        { token, origin: "https://app.invalid" },
        send as typeof fetch,
      )
    ).status,
    503,
  );
  assert.equal(calls, 2);
});
