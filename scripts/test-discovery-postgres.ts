import postgres from "postgres";
import assert from "node:assert/strict";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import {saveCandidateDecision,undoCandidateDecision,listCandidateDecisions,listJobInterests} from "../src/lib/server/discovery.ts";
// This runner is restricted to the disposable local CI database.
const url=process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!["127.0.0.1","localhost"].includes(new URL(url).hostname)) throw new Error("Only the isolated local database may be used");
const sql=postgres(url,{max:1,prepare:false});
class Rollback extends Error {}
try {
  await sql.begin(async tx=>{
    await tx`SET LOCAL search_path=recruitment,public`;
    const user=crypto.randomUUID(),other=crypto.randomUUID(),candidate=crypto.randomUUID(),job=crypto.randomUUID();
    await tx`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES (${user},${user+'@example.invalid'},now()),(${other},${other+'@example.invalid'},now())`;
    await tx`INSERT INTO candidates(id,created_at,updated_at,status,auth_user_id) VALUES (${candidate},1,1,'parsed',${user})`;
    await tx`INSERT INTO jobs(id,created_at,title,status) VALUES (${job},1,'Decision regression fixture','open')`;
    const env={DB:{prepare(query:string) {
      let values:unknown[]=[];
      const rows=()=>{const q=postgresQuery(query,values);return tx.unsafe(q.sql,q.values as any[]);};
      return {bind(...args:unknown[]){values=args;return this;},async first(){return (await rows())[0]??null;},async all(){return {results:await rows(),success:true};}};
    }}} as any;
    await assert.rejects(saveCandidateDecision(env,other,candidate,job,"interested"));
    const first=await saveCandidateDecision(env,user,candidate,job,"interested");
    const second=await saveCandidateDecision(env,user,candidate,job,"dismissed");
    assert.ok(second.swipedAt>first.swipedAt);
    await assert.rejects(undoCandidateDecision(env,user,candidate,job,first.swipedAt));
    assert.equal((await listCandidateDecisions(env,other)).items.length,0);
    assert.equal((await listCandidateDecisions(env,user)).items[0].action,"dismissed");
    assert.equal((await listJobInterests(env,job)).length,0);
    const third=await saveCandidateDecision(env,user,candidate,job,"interested");
    assert.equal((await listJobInterests(env,job)).length,1);
    await tx`UPDATE jobs SET status='closed' WHERE id=${job}`;
    await assert.rejects(saveCandidateDecision(env,user,candidate,job,"dismissed"));
    await assert.rejects(undoCandidateDecision(env,other,candidate,job,third.swipedAt));
    await undoCandidateDecision(env,user,candidate,job,third.swipedAt);
    assert.equal((await listJobInterests(env,job)).length,0);
    throw new Rollback();
  });
  throw new Error("Regression transaction did not roll back");
} catch(e) {if (!(e instanceof Rollback)) throw e;}
finally {await sql.end();}
console.log("PASS: PostgreSQL bound decision writes, ownership, status, history and conditional undo; fixtures rolled back");
