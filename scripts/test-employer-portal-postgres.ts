import postgres from "postgres";
import assert from "node:assert/strict";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import {
  saveEmployerProfile,
  getEmployerProfile,
  createEmployerRole,
  updateEmployerRole,
  listEmployerRoles,
  getEmployerRole,
  closeEmployerRole,
  decideShortlistEntry,
  staffListEmployerRoles,
  staffGetEmployerRole,
  staffPublishRole,
  staffShareCandidate,
  staffUnshareCandidate,
} from "../src/lib/server/employer-portal.ts";

// Employer portal against real PostgreSQL: ownership scoping, publish-to-mandate,
// anonymised sharing, employer decisions, close/withdraw and candidate erasure.
const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("Only isolated local database fixtures are permitted");
const sql = postgres(url, { max: 1, prepare: false });
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
              const rows = await this.execute();
              return { success: true, results: rows, meta: { changes: rows.count } };
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

    const employer = crypto.randomUUID();
    const other = crypto.randomUUID();
    const staff = crypto.randomUUID();
    await tx`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
      (${employer},'portal-employer@example.invalid',now()),(${other},'portal-other@example.invalid',now()),(${staff},'portal-staff@example.invalid',now())`;
    const now = Date.now();
    const profile = JSON.stringify({
      skills: [{ skill: "IFRS" }, { skill: "Power BI" }],
      experience: [],
      education: [],
      total_years_experience: 6,
      seniority: "senior",
      location: "Dubai",
    });
    const candA = "cand_portal_a";
    const candB = "cand_portal_b";
    await tx`INSERT INTO candidates(id,created_at,updated_at,status,name,quality_score,raw_profile) VALUES
      (${candA},${now},${now},'parsed','Real Name A',80,${profile}),(${candB},${now},${now},'parsed','Real Name B',70,${profile})`;

    // Company profile is upserted and read back for its owner only.
    await saveEmployerProfile(env, employer, {
      company_name: "Fixture Holdings",
      website: "https://fixture.invalid",
      company_size: "51-250",
      sectors: ["Financial services"],
      services: ["Executive search"],
      hiring_markets: ["UAE"],
      hiring_volume: "3-5",
    });
    await saveEmployerProfile(env, employer, { company_name: "Fixture Holdings Ltd", sectors: [], services: [], hiring_markets: [] });
    assert.equal((await getEmployerProfile(env, employer))?.company_name, "Fixture Holdings Ltd");
    assert.equal(await getEmployerProfile(env, other), null);

    // Roles are owner-scoped; another employer can neither read nor edit them.
    const { id } = await createEmployerRole(env, employer, {
      title: "Senior Financial Analyst",
      location: "Dubai",
      seniority: "senior",
      min_years_experience: 4,
      must_have_skills: ["IFRS"],
      nice_to_have_skills: ["Power BI"],
    });
    assert.equal((await listEmployerRoles(env, employer)).length, 1);
    assert.equal((await listEmployerRoles(env, other)).length, 0);
    assert.equal(await getEmployerRole(env, other, id), null);
    await assert.rejects(() => updateEmployerRole(env, other, id, { title: "Hijack", must_have_skills: [], nice_to_have_skills: [] }));
    await updateEmployerRole(env, employer, id, { title: "Senior Financial Analyst (FP&A)", location: "Dubai", seniority: "senior", must_have_skills: ["IFRS"], nice_to_have_skills: [] });

    // Sharing needs a live role; publishing creates an open mandate.
    await assert.rejects(() => staffShareCandidate(env, id, candA, "Strong IFRS background.", staff), /Publish the role/);
    assert.equal((await staffListEmployerRoles(env, "submitted"))[0].owner_email, "portal-employer@example.invalid");
    const { jobId } = await staffPublishRole(env, id, staff, null);
    const [job] = await tx`SELECT status, source, company, title FROM jobs WHERE id=${jobId}`;
    assert.deepEqual({ ...job }, { status: "open", source: "employer", company: "Fixture Holdings Ltd", title: "Senior Financial Analyst (FP&A)" });
    await assert.rejects(() => staffPublishRole(env, id, staff, null), /Only submitted/);
    await assert.rejects(() => updateEmployerRole(env, employer, id, { title: "Late edit", must_have_skills: [], nice_to_have_skills: [] }), /no longer be edited/);

    // Shared candidates are aliased and scored; the employer view carries no identity.
    assert.deepEqual(await staffShareCandidate(env, id, candA, "Rebuilt a group budgeting model.", staff), { alias: "Candidate A" });
    assert.deepEqual(await staffShareCandidate(env, id, candB, "Eight years in treasury.", staff), { alias: "Candidate B" });
    assert.deepEqual(await staffShareCandidate(env, id, candA, "Updated summary.", staff), { alias: "Candidate A" }, "re-sharing keeps the alias");
    const view = await getEmployerRole(env, employer, id);
    assert.equal(view?.shortlist.length, 2);
    const serialised = JSON.stringify(view);
    assert.ok(!serialised.includes("Real Name") && !serialised.includes(candA), "no candidate identity reaches the employer");
    assert.ok(view!.shortlist.every((s) => typeof s.score === "number" && s.strengths.includes("IFRS")), "skills use the employer's wording");

    // Decisions are owner-scoped and visible to staff.
    await assert.rejects(() => decideShortlistEntry(env, other, id, "Candidate A", "interested", null));
    await decideShortlistEntry(env, employer, id, "Candidate A", "interested", "Would like to meet");
    const staffView = await staffGetEmployerRole(env, id);
    assert.equal(staffView?.shortlist.find((s) => s.candidate_id === candA)?.decision, "interested");
    assert.equal(staffView?.shortlist.find((s) => s.candidate_id === candA)?.candidate_name, "Real Name A");
    assert.equal((await listEmployerRoles(env, employer))[0].awaiting, 1);

    // Unsharing and erasure remove entries; a withdrawn alias is never reused.
    await staffUnshareCandidate(env, id, candB);
    assert.deepEqual(await staffShareCandidate(env, id, candB, "Shared again.", staff), { alias: "Candidate C" });
    await staffUnshareCandidate(env, id, candB);
    await tx`DELETE FROM candidates WHERE id=${candA}`;
    assert.equal((await getEmployerRole(env, employer, id))?.shortlist.length, 0);

    // Closing a live role closes its mandate; a second close is refused.
    assert.deepEqual(await closeEmployerRole(env, employer, id), { status: "closed" });
    assert.equal((await tx`SELECT status FROM jobs WHERE id=${jobId}`)[0].status, "closed");
    await assert.rejects(() => closeEmployerRole(env, employer, id), /already closed/);

    // A submitted role is withdrawn, not closed.
    const draft = await createEmployerRole(env, employer, { title: "Draft", must_have_skills: [], nice_to_have_skills: [] });
    assert.deepEqual(await closeEmployerRole(env, employer, draft.id), { status: "withdrawn" });

    // Deleting the employer's account removes their profile and roles.
    await tx`DELETE FROM auth.users WHERE id=${employer}`;
    assert.equal(Number((await tx`SELECT count(*) AS n FROM employer_roles WHERE owner_user_id=${employer}`)[0].n), 0);
    console.log("employer portal PostgreSQL integration: ok");
    throw new Rollback();
  });
} catch (e) {
  if (!(e instanceof Rollback)) throw e;
} finally {
  await sql.end();
}
