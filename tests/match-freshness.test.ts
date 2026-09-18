import {test} from 'node:test';
import assert from 'node:assert/strict';
import {databaseFixture} from './database-fixture.ts';
import {getMatchesForCandidate,getMatchesForJob} from '../src/lib/server/db.ts';

function fixture() {
  const f=databaseFixture();
  f.db.exec('DELETE FROM jobs');
  const profile=JSON.stringify({skills:[{skill:'Python'}],experience:[],education:[]});
  f.db.prepare("INSERT INTO candidates(id,created_at,updated_at,status,raw_profile) VALUES ('a',1,1,'parsed',?)").run(profile);
  f.db.exec("INSERT INTO jobs(id,created_at,title,status,must_have_skills) VALUES ('new',1,'New vacancy','open','[\"Python\"]')");
  return f;
}
test('new vacancies receive current scores without cached rows or writes',async()=>{
  const {db,env}=fixture();try {
    const [match]=await getMatchesForCandidate(env,'a');
    assert.equal(match.job_id,'new');assert.equal(match.score,50);
    assert.equal(match.stage,'matched');
    assert.equal(db.prepare('SELECT count(*) AS n FROM matches').get()!.n,0);
    assert.deepEqual(await getMatchesForCandidate(env,'missing'),[]);
  }finally{db.close();}
});
test('vacancy edits and profile corrections change scores; saved pipeline stage survives',async()=>{
  const {db,env}=fixture();try {
    db.exec("INSERT INTO matches(candidate_id,job_id,score,computed_at,stage) VALUES ('a','new',99,1,'shortlisted')");
    db.exec("UPDATE jobs SET must_have_skills='[\"Rust\"]',salary_min=40000,salary_currency='GBP' WHERE id='new'");
    let [match]=await getMatchesForCandidate(env,'a');
    assert.equal(match.score,0);assert.equal(match.stage,'shortlisted');
    assert.equal(match.job.salary_min,40000);assert.equal(match.job.salary_currency,'GBP');
    db.prepare('UPDATE candidates SET raw_profile=? WHERE id=?').run(JSON.stringify({skills:[{skill:'Rust'}]}),'a');
    [match]=await getMatchesForCandidate(env,'a');assert.equal(match.score,50);
    const stored=db.prepare('SELECT score,stage FROM matches').get()!;
    assert.equal(stored.score,99);assert.equal(stored.stage,'shortlisted');
  }finally{db.close();}
});
test('closed/expired vacancies and unfinished profiles never expose stale matches',async()=>{
  const {db,env}=fixture();try {
    db.exec("UPDATE jobs SET expiry_date='2000-01-01'");assert.deepEqual(await getMatchesForCandidate(env,'a'),[]);
    db.exec("UPDATE jobs SET expiry_date=NULL,status='closed'");assert.deepEqual(await getMatchesForCandidate(env,'a'),[]);
    db.exec("UPDATE jobs SET status='open'; UPDATE candidates SET status='uploaded'");assert.deepEqual(await getMatchesForCandidate(env,'a'),[]);
    db.exec("UPDATE candidates SET status='parsed',raw_profile=NULL");assert.deepEqual(await getMatchesForCandidate(env,'a'),[]);
    db.exec("UPDATE candidates SET raw_profile='invalid json'");await assert.rejects(getMatchesForCandidate(env,'a'));
  }finally{db.close();}
});

test('staff ranking refreshes before top-50 selection and preserves stages without writes',async()=>{
  const {db,env}=fixture();try {
    for(let i=0;i<51;i++) {
      const id=`staff-${String(i).padStart(2,'0')}`;
      db.prepare("INSERT INTO candidates(id,created_at,updated_at,status,raw_profile) VALUES (?,1,1,'parsed',?)")
        .run(id,JSON.stringify({skills:[{skill:i===50?'Python':'Rust'}]}));
      db.prepare("INSERT INTO matches(candidate_id,job_id,score,computed_at,stage) VALUES (?,'new',?,1,'shortlisted')").run(id,i===50?0:100);
    }
    const results=await getMatchesForJob(env,'new');
    assert.equal(results.length,50);assert.equal(results[0].candidate_id,'staff-50');
    assert.equal(results[0].score,50);assert.equal(results[0].stage,'shortlisted');
    assert.equal(results[1].candidate_id,'staff-00');
    assert.ok(!JSON.stringify(results).includes('current_profile'));
    assert.equal(db.prepare("SELECT score FROM matches WHERE candidate_id='staff-50'").get()!.score,0);
    db.exec("UPDATE jobs SET status='closed'");
    assert.equal((await getMatchesForJob(env,'new')).length,50,'closed-role pipeline remains reviewable');
    db.exec("UPDATE candidates SET status='uploaded'");
    assert.deepEqual(await getMatchesForJob(env,'new'),[]);
  }finally{db.close();}
});

test('staff results exclude missing profiles and reject invalid evidence rather than use old scores',async()=>{
  const {db,env}=fixture();try {
    db.exec("INSERT INTO matches(candidate_id,job_id,score,computed_at) VALUES ('a','new',99,1)");
    db.exec("UPDATE candidates SET raw_profile=NULL");
    assert.deepEqual(await getMatchesForJob(env,'new'),[]);
    db.exec("UPDATE candidates SET raw_profile='{}invalid'");
    await assert.rejects(getMatchesForJob(env,'new'));
    assert.deepEqual(await getMatchesForJob(env,'missing'),[]);
  }finally{db.close();}
});
