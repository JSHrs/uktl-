import postgres from "postgres";
import assert from "node:assert/strict";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import { buildExport, chartData, sendCandidateMessage, outreachRecipient, listCandidateMessages, weekStart } from "../src/lib/server/admin-tools.ts";

const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("Only isolated local database fixtures are permitted");
const sql = postgres(url, { max: 1, prepare: false }),
  originalFetch = globalThis.fetch;
class Rollback extends Error {}
try {
  await sql.begin(async (tx) => {
    await tx`SET LOCAL search_path=recruitment,public`;
    const env = {
      DATA_BACKEND: "supabase",
      DB: {
        prepare(query: string) {
          let values: unknown[] = [];
          return {
            bind(...args: unknown[]) {
              values = args;
              return this;
            },
            async execute(connection?: typeof tx) {
              const q = postgresQuery(query, values);
              const run = (c: typeof tx) => c.unsafe(q.sql, q.values as any[]);
              return connection ? run(connection) : tx.savepoint(run);
            },
            async first() {
              return (await this.execute())[0] ?? null;
            },
            async all() {
              return { success: true, results: await this.execute() };
            },
            async run() {
              return { success: true, results: await this.execute() };
            },
          };
        },
        async batch(statements: any[]) {
          return tx.savepoint(async (sub) => {
            const results = [];
            for (const statement of statements) results.push({ success: true, results: await statement.execute(sub) });
            return results;
          });
        },
      },
    } as any;
    // Isolate from any rows other suites left behind.
    await tx`DELETE FROM candidates`;
    await tx`DELETE FROM hr_queries`;
    await tx`DELETE FROM bookings`;
    await tx`DELETE FROM jobs`;
    const staff = crypto.randomUUID(),
      verified = crypto.randomUUID(),
      unverified = crypto.randomUUID();
    await tx`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
      (${staff},'staff@example.invalid',now()),(${verified},'account@example.invalid',now()),(${unverified},'pending@example.invalid',NULL)`;
    const now = Date.now();
    await tx`INSERT INTO candidates(id,created_at,updated_at,status,name,email,quality_score,auth_user_id) VALUES
      ('tool-a',${now},${now},'parsed','=HYPERLINK("http://evil")','cv-a@example.invalid',85,${verified}),
      ('tool-b',${now - 7 * 86400000},${now},'parsed','Bea "Quoted", Example','cv-b@example.invalid',55,${unverified}),
      ('tool-c',${now},${now},'failed','No Email',NULL,NULL,NULL)`;
    await tx`INSERT INTO jobs(id,created_at,title,company,status) VALUES('tool-job',${now},'Site Manager','Fixture Ltd','open'),('tool-job-2',${now},'Other','Other Ltd','open')`;
    await tx`INSERT INTO matches(candidate_id,job_id,score,computed_at,stage) VALUES('tool-a','tool-job',81,${now},'shortlisted'),('tool-b','tool-job',60,${now},'matched'),('tool-b','tool-job-2',40,${now},'rejected')`;

    // CSV: injection-safe, quoted, audited in the same transaction.
    const out = await buildExport(env, "candidates", staff, "", now);
    assert.equal(out.rows, 3);
    assert.ok(out.csv.startsWith("﻿\"Candidate ID\""));
    assert.ok(out.csv.includes(`"'=HYPERLINK(""http://evil"")"`), "formula neutralised and quotes doubled");
    assert.ok(out.csv.includes(`"Bea ""Quoted"", Example"`));
    const pipeline = await buildExport(env, "pipeline", staff, "tool-job", now);
    assert.equal(pipeline.rows, 2, "pipeline filtered to one mandate");
    assert.match(pipeline.filename, /^uktl-pipeline-tool-job-\d{4}-\d{2}-\d{2}\.csv$/);
    const audits = await tx`SELECT entity_id,metadata FROM audit_events WHERE action='export' AND actor_user_id=${staff} ORDER BY id`;
    assert.deepEqual(audits.map((a) => a.entity_id), ["candidates", "pipeline"]);
    assert.equal(audits[1].metadata.job_id, "tool-job");

    // Charts: Monday-aligned weekly buckets, distributions, stages.
    assert.equal(new Date(weekStart(Date.UTC(2025, 9, 9, 15))).toISOString(), "2025-10-06T00:00:00.000Z");
    const charts = await chartData(env, now);
    assert.equal(charts.series.length, 12);
    assert.equal(charts.series.at(-1)!.week, weekStart(now));
    assert.equal(charts.series.reduce((n, s) => n + s.candidates, 0), 3);
    assert.equal(charts.quality["80–100"], 1);
    assert.equal(charts.quality["40–59"], 1);
    assert.equal(charts.status.parsed, 2);
    assert.deepEqual(charts.stages, { shortlisted: 1, matched: 1, rejected: 1 });

    // Outreach: verified account email wins; unverified account falls back to the CV email.
    assert.deepEqual(await outreachRecipient(env, "tool-a"), { name: '=HYPERLINK("http://evil")', email: "account@example.invalid", source: "account" });
    assert.equal((await outreachRecipient(env, "tool-b")).email, "cv-b@example.invalid");
    assert.equal((await outreachRecipient(env, "tool-c")).email, null);
    await assert.rejects(
      sendCandidateMessage(env, { candidateId: "tool-c", template: "follow_up", subject: "Hello", body: "A body long enough to send.", sentBy: staff }),
      /no valid email/,
    );
    const message = { candidateId: "tool-a", jobId: "tool-job", template: "role_intro" as const, subject: "A role that fits", body: "Hello, a role that fits your profile.", sentBy: staff, replyTo: "staff@example.invalid" };
    const skipped = await sendCandidateMessage(env, message);
    assert.equal(skipped.status, "skipped", "no Resend key never reports delivery");
    await assert.rejects(sendCandidateMessage(env, message), /already sent/, "double submit refused");
    env.RESEND_API_KEY = "test-only-resend";
    const sent: { body: any; key: string | null }[] = [];
    globalThis.fetch = async (_u, init) => {
      sent.push({ body: JSON.parse(String(init?.body)), key: new Headers(init?.headers).get("Idempotency-Key") });
      return Response.json({ id: "synthetic" });
    };
    const ok = await sendCandidateMessage(env, { ...message, subject: "Interview invitation", template: "interview_invite" });
    assert.equal(ok.status, "sent");
    assert.deepEqual(sent[0].body.to, ["account@example.invalid"]);
    assert.equal(sent[0].body.reply_to, "staff@example.invalid");
    assert.match(sent[0].body.text, /You are receiving this because/);
    assert.equal(sent[0].key, `uktl-msg-${ok.id}`);
    const log = await listCandidateMessages(env, "tool-a");
    assert.deepEqual(log.map((m) => m.status).sort(), ["sent", "skipped"]);
    assert.equal(log[0].job_title, "Site Manager");
    assert.equal((await tx`SELECT count(*)::int AS n FROM audit_events WHERE entity_type='candidate_messages' AND actor_user_id IS NULL`)[0].n >= 2, true);
    await tx`DELETE FROM candidates WHERE id='tool-a'`;
    assert.equal((await tx`SELECT count(*)::int AS n FROM candidate_messages WHERE candidate_id='tool-a'`)[0].n, 0, "erasure removes message log");
    throw new Rollback();
  });
  throw new Error("Fixture transaction did not roll back");
} catch (e) {
  if (!(e instanceof Rollback)) throw e;
} finally {
  globalThis.fetch = originalFetch;
  await sql.end();
}
console.log("PASS: audited injection-safe CSV exports, Monday-aligned chart buckets, verified-recipient outreach with dedupe, idempotency and erasure; fixtures rolled back");
