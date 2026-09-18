import {test} from "node:test";
import assert from "node:assert/strict";
import {databaseFixture} from "./database-fixture.ts";
import {saveCandidateDecision,undoCandidateDecision,listCandidateDecisions,listJobInterests} from "../src/lib/server/discovery.ts";
function fixture() {
  const f=databaseFixture();
  f.db.prepare("INSERT INTO candidates(id,created_at,updated_at,status,auth_user_id) VALUES (?,1,1,'parsed',?)").run("a","user-a");
  f.db.prepare("INSERT INTO candidates(id,created_at,updated_at,status,auth_user_id) VALUES (?,1,1,'parsed',?)").run("b","user-b");
  f.db.prepare("INSERT INTO jobs(id,created_at,title,status) VALUES ('open',1,'Open role','open'),('closed',1,'Closed role','closed')").run();
  return f;
}
test("decisions require the owner and an open existing role atomically",async()=>{
  const {db,env}=fixture();try {
    for (const [user,candidate,job] of [["user-b","a","open"],["user-a","a","closed"],["user-a","a","missing"],["user-a","missing","open"]]) {
      await assert.rejects(saveCandidateDecision(env,user,candidate,job,"interested"));
    }
    assert.equal(db.prepare("SELECT count(*) AS n FROM candidate_swipes").get()!.n,0);
    await saveCandidateDecision(env,"user-a","a","open","interested");
    db.prepare("UPDATE jobs SET status='closed' WHERE id='open'").run();
    await assert.rejects(saveCandidateDecision(env,"user-a","a","open","dismissed"));
    assert.equal(db.prepare("SELECT action FROM candidate_swipes").get()!.action,"interested");
  } finally {db.close();}
});
test("repeated saves upsert and stale/cross-account undo never deletes newer intent",async()=>{
  const {db,env}=fixture();try {
    const first=await saveCandidateDecision(env,"user-a","a","open","interested");
    const second=await saveCandidateDecision(env,"user-a","a","open","dismissed");
    assert.ok(second.swipedAt>first.swipedAt);
    assert.equal(db.prepare("SELECT count(*) AS n FROM candidate_swipes").get()!.n,1);
    await assert.rejects(undoCandidateDecision(env,"user-a","a","open",first.swipedAt));
    await assert.rejects(undoCandidateDecision(env,"user-b","a","open",second.swipedAt));
    await undoCandidateDecision(env,"user-a","a","open",second.swipedAt);
    assert.equal(db.prepare("SELECT count(*) AS n FROM candidate_swipes").get()!.n,0);
  } finally {db.close();}
});
test("history isolates users; withdrawal removes interest from staff pipeline",async()=>{
  const {db,env}=fixture();try {
    const own=await saveCandidateDecision(env,"user-a","a","open","interested");
    await saveCandidateDecision(env,"user-b","b","open","interested");
    const history=await listCandidateDecisions(env,"user-a");
    assert.deepEqual(history.items.map(i=>i.candidate_id),["a"]);
    assert.equal((await listCandidateDecisions(env,"unknown")).items.length,0);
    assert.equal((await listJobInterests(env,"open")).length,2);
    await undoCandidateDecision(env,"user-a","a","open",own.swipedAt);
    assert.deepEqual((await listJobInterests(env,"open")).map(i=>i.candidate_id),["b"]);
  } finally {db.close();}
});
test("history pagination retains timestamp ties without duplicates or lost rows",async()=>{
  const {db,env}=fixture();try {
    for(let i=0;i<75;i++) {
      const id=`job-${String(i).padStart(3,"0")}`;
      db.prepare("INSERT INTO jobs(id,created_at,title,status) VALUES (?,1,?,'open')").run(id,id);
      db.prepare("INSERT INTO candidate_swipes(candidate_id,job_id,action,swiped_at) VALUES ('a',?,'interested',100)").run(id);
    }
    const first=await listCandidateDecisions(env,"user-a");
    assert.equal(first.items.length,50);assert.ok(first.nextCursor);
    const second=await listCandidateDecisions(env,"user-a",first.nextCursor!);
    assert.equal(second.items.length,25);assert.equal(second.nextCursor,null);
    assert.equal(new Set([...first.items,...second.items].map(i=>i.job_id)).size,75);
  } finally {db.close();}
});
