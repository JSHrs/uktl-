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
  createBookingIntent,
  bookingIntentStatus,
  processCalendlyWebhook,
  deliverBookingEvent,
} from "../src/lib/server/calendly.ts";
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
      CALENDLY_URL: "https://calendly.com/fixture/consultation",
      CALENDLY_API_TOKEN: "fake-token",
      CALENDLY_WEBHOOK_SECRET: "fake-signing",
      CALENDLY_EVENT_TYPE_URI: `https://api.calendly.com/event_types/${crypto.randomUUID()}`,
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
    await assert.rejects(createBookingIntent(env, other, other + "@example.invalid", journey.id));
    const intent = await createBookingIntent(env, user, email, journey.id);
    const eventUri = `https://api.calendly.com/scheduled_events/${crypto.randomUUID()}`,
      inviteeUri = `${eventUri}/invitees/${crypto.randomUUID()}`;
    let time = Date.now(),
      status = "active",
      createdAt = new Date(time).toISOString();
    const fixture = () => ({
      uri: inviteeUri,
      email,
      name: "Synthetic Fixture",
      status,
      event: eventUri,
      created_at: createdAt,
      updated_at: new Date(time).toISOString(),
      tracking: { utm_content: intent.id },
      cancel_url: `https://calendly.com/cancellations/${crypto.randomUUID()}`,
      reschedule_url: `https://calendly.com/reschedulings/${crypto.randomUUID()}`,
    });
    globalThis.fetch = async (input) =>
      String(input) === inviteeUri
        ? Response.json({ resource: fixture() })
        : Response.json({
            resource: {
              uri: eventUri,
              event_type: env.CALENDLY_EVENT_TYPE_URI,
              start_time: new Date(time + 86400000).toISOString(),
              end_time: new Date(time + 90000000).toISOString(),
            },
          });
    const raw = JSON.stringify({ event: "invitee.created", payload: { uri: inviteeUri } });
    const received = await processCalendlyWebhook(env, raw);
    assert.ok(received.eventId);
    await processCalendlyWebhook(env, raw);
    assert.equal(
      Number((await tx`SELECT count(*) AS n FROM booking_events`)[0].n),
      1,
      "duplicate webhook creates no duplicate notification",
    );
    const booking = (await bookingIntentStatus(env, user, intent.id))[0];
    assert.equal(booking.status, "confirmed");
    await assert.rejects(bookingIntentStatus(env, other, intent.id));
    assert.equal(
      (await deliverBookingEvent(env, received.eventId!)).status,
      "skipped",
      "missing Resend does not imply delivery",
    );
    env.RESEND_API_KEY = "test-only-resend";
    let sends = 0;
    const calendlyFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      sends++;
      return Response.json({ id: "synthetic-email" });
    };
    assert.equal((await deliverBookingEvent(env, received.eventId!)).status, "sent");
    await deliverBookingEvent(env, received.eventId!);
    assert.equal(sends, 1);
    globalThis.fetch = calendlyFetch;
    time += 1000;
    status = "canceled";
    await processCalendlyWebhook(env, raw);
    assert.equal((await bookingIntentStatus(env, user, intent.id))[0].status, "cancelled");
    status = "active";
    time -= 1000;
    await processCalendlyWebhook(env, raw);
    assert.equal(
      (await bookingIntentStatus(env, user, intent.id))[0].status,
      "cancelled",
      "old active event cannot resurrect cancellation",
    );
    assert.equal(Number((await tx`SELECT count(*) AS n FROM booking_events`)[0].n), 2);
    const metrics = await getAdminAnalytics(env);
    assert.equal(metrics.ai_queries, 1);
    assert.equal(metrics.resolved_queries, 1);
    assert.equal(metrics.converted_queries, 0);
    // A real reschedule is a new invitee, not a browser-side edit of the old row.
    const replacementUri = `${eventUri}/invitees/${crypto.randomUUID()}`;
    globalThis.fetch = async (input) =>
      String(input) === replacementUri
        ? Response.json({
            resource: {
              ...fixture(),
              uri: replacementUri,
              old_invitee: inviteeUri,
              updated_at: new Date(time + 2000).toISOString(),
            },
          })
        : Response.json({
            resource: {
              uri: eventUri,
              event_type: env.CALENDLY_EVENT_TYPE_URI,
              start_time: new Date(time + 172800000).toISOString(),
              end_time: new Date(time + 176400000).toISOString(),
            },
          });
    await processCalendlyWebhook(
      env,
      JSON.stringify({ event: "invitee.created", payload: { uri: replacementUri } }),
    );
    assert.equal((await bookingIntentStatus(env, user, intent.id)).length, 2);
    assert.equal(
      (
        await tx`SELECT old_invitee_uri FROM bookings WHERE provider_invitee_uri=${replacementUri}`
      )[0].old_invitee_uri,
      inviteeUri,
    );
    assert.equal(
      (await getAdminAnalytics(env)).converted_queries,
      1,
      "one question counted once across appointments",
    );
    // Matching a guessed email without the correct provider-tracked intent is insufficient.
    const unlinkedUri = `${eventUri}/invitees/${crypto.randomUUID()}`;
    globalThis.fetch = async (input) =>
      String(input) === unlinkedUri
        ? Response.json({
            resource: { ...fixture(), uri: unlinkedUri, email: "different@example.invalid" },
          })
        : Response.json({
            resource: {
              uri: eventUri,
              event_type: env.CALENDLY_EVENT_TYPE_URI,
              start_time: new Date(time + 86400000).toISOString(),
              end_time: new Date(time + 90000000).toISOString(),
            },
          });
    await processCalendlyWebhook(
      env,
      JSON.stringify({ event: "invitee.created", payload: { uri: unlinkedUri } }),
    );
    assert.equal(
      (await tx`SELECT auth_user_id FROM bookings WHERE provider_invitee_uri=${unlinkedUri}`)[0]
        .auth_user_id,
      null,
    );
    assert.equal((await bookingIntentStatus(env, user, intent.id)).length, 2);
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
  "PASS: HR ownership/revisions, reviewed source bounds, deduplicated plays, verified booking replay/order, notification idempotency and analytics; synthetic fixtures rolled back",
);
