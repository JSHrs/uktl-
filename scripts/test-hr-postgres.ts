import postgres from "postgres";
import assert from "node:assert/strict";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import {
  createHrJourney,
  getHrJourney,
  saveHrResolution,
  answerHrJourney,
  recordVideoPlay,
  retrieveHrSource,
} from "../src/lib/server/hr.ts";
import {
  availableSlots,
  reserveConsultation,
  cancelConsultation,
  listMyConsultations,
  deliverBookingEvent,
} from "../src/lib/server/calendar.ts";
import { getAdminAnalytics } from "../src/lib/server/db.ts";
const url =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("Only isolated local database fixtures are permitted");
const sql = postgres(url, { max: 1, prepare: false }),
  originalFetch = globalThis.fetch;
class Rollback extends Error {}
try {
  await sql.begin(async (tx) => {
    await tx`SET LOCAL search_path=recruitment,public`;
    const user = crypto.randomUUID(),
      other = crypto.randomUUID(),
      topic = crypto.randomUUID(),
      source = crypto.randomUUID(),
      email = `${user}@example.invalid`;
    await tx`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(${user},${email},now()),(${other},${other + "@example.invalid"},now())`;
    const env = {
      DATA_BACKEND: "supabase",
      ANTHROPIC_API_KEY: "fake-test-key",
      SITE_URL: "https://uktl.example",
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
            for (const statement of statements)
              results.push({ success: true, results: await statement.execute(sub) });
            return results;
          });
        },
      },
    } as any;
    const journey = await createHrJourney(env, user, "What does this reviewed fixture say?", "pay");
    assert.equal(
      (await getHrJourney(env, user, journey.id)).question,
      "What does this reviewed fixture say?",
    );
    await assert.rejects(getHrJourney(env, other, journey.id));
    await tx`INSERT INTO faq_topics(id,title,category,keywords,published,view_count,created_at,transcript,video_key,captions_key,reviewed_at) VALUES(${topic},'Pay fixture','pay','["pay"]',1,0,1,'Reviewed fixture transcript','videos/fixture.mp4','videos/fixture.vtt',${Date.now()})`;
    await assert.rejects(saveHrResolution(env, other, journey.id, 0, topic, "yes"));
    await saveHrResolution(env, user, journey.id, 0, topic, "partly");
    await assert.rejects(
      saveHrResolution(env, user, journey.id, 0, topic, "yes"),
      "stale tab cannot overwrite",
    );
    await saveHrResolution(env, user, journey.id, 1, topic, "no");
    await saveHrResolution(env, user, journey.id, 2, topic, "yes");
    assert.equal((await getHrJourney(env, user, journey.id)).resolution_type, "yes");
    await recordVideoPlay(env, user, topic);
    await recordVideoPlay(env, user, topic);
    await recordVideoPlay(env, other, topic);
    assert.equal(
      Number((await tx`SELECT view_count FROM faq_topics WHERE id=${topic}`)[0].view_count),
      2,
    );
    await tx`UPDATE faq_topics SET published=0 WHERE id=${topic}`;
    await assert.rejects(saveHrResolution(env, user, journey.id, 3, topic, "yes"));
    await recordVideoPlay(env, crypto.randomUUID(), topic); // unpublished is a no-op, not a forged play
    await tx`UPDATE faq_topics SET published=1 WHERE id=${topic}`;
    await assert.rejects(answerHrJourney(env, user, journey.id, 3, ""), "no approved source");
    const body =
      "This is synthetic guidance, not real legal advice. Only this exact excerpt is supported.";
    await tx`INSERT INTO hr_sources(id,url,title,category,body,content_hash,retrieved_at,reviewed_at,active) VALUES(${source},'https://www.acas.org.uk/pay','Fixture','pay',${body},'fixture-hash',${Date.now()},${Date.now()},true)`;
    globalThis.fetch = async () =>
      Response.json({
        stop_reason: "end_turn",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              excerpts: [{ sourceId: source, quote: "Only this exact excerpt is supported." }],
            }),
          },
        ],
      });
    const answer = await answerHrJourney(env, user, journey.id, 3, "No identifying details");
    assert.equal(answer.excerpts.length, 1);
    assert.equal(
      (await getHrJourney(env, user, journey.id)).additional_context,
      "No identifying details",
    );
    await assert.rejects(answerHrJourney(env, other, journey.id, 4, ""));
    globalThis.fetch = async () =>
      Response.json({
        stop_reason: "end_turn",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              excerpts: [{ sourceId: source, quote: "Invented legal rule" }],
            }),
          },
        ],
      });
    await assert.rejects(answerHrJourney(env, user, journey.id, 4, ""));
    globalThis.fetch = async () => {
      await tx`UPDATE hr_sources SET active=false WHERE id=${source}`;
      return Response.json({
        stop_reason: "end_turn",
        content: [{ type: "text", text: '{"excerpts":[]}' }],
      });
    };
    await assert.rejects(
      answerHrJourney(env, user, journey.id, 4, ""),
      "withdrawn source rejects in-flight result",
    );
    await tx`UPDATE hr_sources SET active=true,reviewed_at=1 WHERE id=${source}`;
    await assert.rejects(answerHrJourney(env, user, journey.id, 4, ""), "stale source not offered");
    globalThis.fetch = async () =>
      new Response(`<main>${body.repeat(2)}</main>`, { headers: { "content-type": "text/html" } });
    await retrieveHrSource(env, "https://www.acas.org.uk/pay", "Fixture updated", "pay");
    assert.equal(
      (await tx`SELECT active FROM hr_sources WHERE id=${source}`)[0].active,
      false,
      "reimport requires human approval",
    );
    // ── Native consultation calendar ──
    await tx`UPDATE booking_settings SET slot_minutes=30,buffer_minutes=10,min_notice_hours=0,max_days_ahead=14,daily_limit=48`;
    await tx`DELETE FROM availability_rules`;
    for (let d = 1; d <= 7; d++)
      await tx`INSERT INTO availability_rules(weekday,start_minute,end_minute,created_at) VALUES(${d},0,1440,1)`;
    const offer = await availableSlots(env);
    assert.ok(offer.slots.length > 100);
    const [first, second, , fourth] = offer.slots.filter((s) => s.start > Date.now() + 3600000);
    const person = { userId: user, email, name: "Synthetic Fixture" };
    await assert.rejects(
      reserveConsultation(env, { ...person, startsAt: first.start + 60000 }),
      "off-grid times are refused",
    );
    await assert.rejects(
      reserveConsultation(env, { userId: other, email: other + "@example.invalid", name: "Other", startsAt: first.start, queryId: journey.id }),
      "another user's HR question cannot be attached",
    );
    const booked = await reserveConsultation(env, { ...person, startsAt: first.start, queryId: journey.id, topic: "Pay" });
    await assert.rejects(
      reserveConsultation(env, { userId: other, email: other + "@example.invalid", name: "Other", startsAt: first.start }),
      /not available|just been taken/,
    );
    await assert.rejects(
      reserveConsultation(env, { userId: other, email: other + "@example.invalid", name: "Other", startsAt: second.start }),
      "10-minute buffer blocks the adjacent slot",
    );
    // Direct SQL bypassing the application still cannot double-book.
    const race = await tx`SELECT reserve_consultation('cons_race',${other}::uuid,'o@example.invalid','Other',NULL,NULL,NULL,NULL,${first.start}::bigint,${first.end}::bigint,0::bigint,${first.start - 3600000}::bigint,${first.start + 3600000}::bigint,48,'Video',NULL) AS outcome`;
    assert.equal(race[0].outcome, "slot_taken");
    await assert.rejects(
      tx.savepoint((sp) => sp`INSERT INTO bookings(id,created_at,contact_email,status,source,auth_user_id,starts_at,ends_at) VALUES('cons_forged',1,'x@example.invalid','confirmed','native',${other},${first.start + 60000},${first.end + 60000})`),
      "exclusion constraint refuses overlapping confirmed native bookings",
    );
    const secondBooking = await reserveConsultation(env, { ...person, startsAt: fourth.start });
    await assert.rejects(
      reserveConsultation(env, { ...person, startsAt: offer.slots[offer.slots.length - 1].start }),
      /up to 2 upcoming/,
    );
    // Reschedule is atomic: a failed new slot leaves the original appointment intact.
    await assert.rejects(reserveConsultation(env, { ...person, startsAt: first.start, replaces: secondBooking.id }));
    assert.equal((await listMyConsultations(env, user)).filter((b) => b.status === "confirmed").length, 2);
    const moved = await reserveConsultation(env, { ...person, startsAt: offer.slots[offer.slots.length - 1].start, replaces: secondBooking.id });
    const mine = await listMyConsultations(env, user);
    assert.equal(mine.find((b) => b.id === secondBooking.id)!.rescheduled_to, moved.id);
    assert.equal(mine.filter((b) => b.status === "confirmed").length, 2);
    await assert.rejects(cancelConsultation(env, booked.id, other), "another candidate cannot cancel");
    const cancelled = await cancelConsultation(env, booked.id, user);
    await assert.rejects(cancelConsultation(env, booked.id, user), "double cancel is refused");
    assert.deepEqual(
      (await tx`SELECT id FROM booking_events ORDER BY id`).map((r) => r.id).sort(),
      [`${booked.id}:cancelled`, `${booked.id}:confirmed`, `${moved.id}:confirmed`, `${secondBooking.id}:confirmed`].sort(),
    );
    assert.equal((await deliverBookingEvent(env, booked.eventId)).status, "skipped", "missing Resend does not imply delivery");
    env.RESEND_API_KEY = "test-only-resend";
    const sent: any[] = [];
    globalThis.fetch = async (_url, init) => {
      sent.push(JSON.parse(String(init?.body)));
      return Response.json({ id: "synthetic-email" });
    };
    assert.equal((await deliverBookingEvent(env, booked.eventId)).status, "sent");
    await deliverBookingEvent(env, booked.eventId);
    assert.equal(sent.length, 2, "one candidate and one team email, never resent");
    assert.deepEqual(sent[0].to, [email]);
    assert.equal(sent[0].attachments[0].filename, "consultation.ics");
    assert.deepEqual(sent[1].to, ["info@uktalentlink.co.uk"]);
    await deliverBookingEvent(env, cancelled.eventId);
    assert.match(sent[2].subject, /cancelled/);
    const metrics = await getAdminAnalytics(env);
    assert.equal(metrics.ai_queries, 1);
    assert.equal(metrics.resolved_queries, 1);
    assert.equal(metrics.total_bookings, 1, "only the rescheduled appointment remains confirmed");
    assert.equal(metrics.converted_queries, 0, "the cancelled appointment no longer converts the question");
    for (const table of ["booking_settings", "availability_rules", "availability_blocks", "candidate_messages"]) {
      const grants =
        await tx`SELECT has_table_privilege('anon',${"recruitment." + table},'SELECT') AS a,has_table_privilege('authenticated',${"recruitment." + table},'SELECT') AS u`;
      assert.equal(grants[0].a, false);
      assert.equal(grants[0].u, false);
    }
    assert.equal(
      (await tx`SELECT has_function_privilege('authenticated','recruitment.reserve_consultation(text,uuid,text,text,text,text,text,text,bigint,bigint,bigint,bigint,bigint,integer,text,text)','EXECUTE') AS x`)[0].x,
      false,
    );
    await tx`UPDATE faq_topics SET title='Changed after review' WHERE id=${topic}`;
    assert.equal(
      (await tx`SELECT reviewed_at FROM faq_topics WHERE id=${topic}`)[0].reviewed_at,
      null,
    );
    for (const table of ["hr_sources", "faq_plays", "booking_intents", "booking_events"]) {
      const grants =
        await tx`SELECT has_table_privilege('anon',${"recruitment." + table},'SELECT') AS a,has_table_privilege('authenticated',${"recruitment." + table},'SELECT') AS u`;
      assert.equal(grants[0].a, false);
      assert.equal(grants[0].u, false);
    }
    assert.equal(
      (await tx`SELECT public FROM storage.buckets WHERE id='uktl-videos'`)[0].public,
      false,
    );
    throw new Rollback();
  });
  throw new Error("Fixture transaction did not roll back");
} catch (e) {
  if (!(e instanceof Rollback)) throw e;
} finally {
  globalThis.fetch = originalFetch;
  await sql.end();
}
console.log(
  "PASS: HR ownership/revisions, reviewed source bounds, deduplicated plays, native calendar locking/buffers/limits/reschedule, notification idempotency and analytics; synthetic fixtures rolled back",
);
