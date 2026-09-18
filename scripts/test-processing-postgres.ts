import postgres from 'postgres';
import assert from 'node:assert/strict';
import {postgresQuery} from '../src/lib/server/postgres.ts';
import {registerQueuedCv,activateQueuedCv,processNextCv,saveProfileRevision} from '../src/lib/server/processing.ts';
const url=process.env.TEST_DATABASE_URL??'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
if(!['127.0.0.1','localhost'].includes(new URL(url).hostname)) throw new Error('Only the isolated local database may be used');
const sql=postgres(url,{max:1,prepare:false});
const originalFetch=globalThis.fetch;
class Rollback extends Error{}
try{await sql.begin(async tx=>{
  await tx`SET LOCAL search_path=recruitment,public`;
  const user=crypto.randomUUID(),candidate=crypto.randomUUID(),job=crypto.randomUUID();
  await tx`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(${user},${user+'@example.invalid'},now())`;
  await tx`INSERT INTO jobs(id,created_at,title,status,must_have_skills) VALUES(${job},1,'Worker fixture','open','["python"]')`;
  const env={DATA_BACKEND:'supabase',ANTHROPIC_API_KEY:'fake-test-key',DB:{
    prepare(query:string){let values:unknown[]=[];return {
      bind(...args:unknown[]){values=args;return this;},
      async execute(connection?:typeof tx){const q=postgresQuery(query,values);const run=(c:typeof tx)=>c.unsafe(q.sql,q.values as any[]);return connection?run(connection):tx.savepoint(run);},
      async first(){return (await this.execute())[0]??null;},async all(){return {success:true,results:await this.execute()};},async run(){return {success:true,results:await this.execute()};},
    };},
    async batch(statements:any[]){return tx.savepoint(async sub=>{const results=[];for(const statement of statements)results.push({success:true,results:await statement.execute(sub)});return results;});},
  },CV_BUCKET:{async get(){const bytes=new TextEncoder().encode('Fixture candidate, Python engineer.').buffer;return {size:bytes.byteLength,async arrayBuffer(){return bytes;}};}}} as any;
  const args={id:candidate,filename:'fixture.txt',r2Key:`cvs/${candidate}/fixture.txt`,sizeBytes:40,authUserId:user};
  await registerQueuedCv(env,args);
  assert.equal((await processNextCv(env)).status,'idle','storage grace period respected');
  await assert.rejects(registerQueuedCv(env,args));
  await activateQueuedCv(env,candidate);
  const profile={name:'Extracted',skills:[{skill:'JS',years_experience:2},{skill:'JavaScript',years_experience:3},{skill:'Python',years_experience:7}],experience:[],education:[]};
  const quality={score:50,notes:[],breakdown:{contact_information:50,experience:50,skills:50,education:50},improvement_report:{contact_information:'Fixture',experience:'Fixture',skills:'Fixture',education:'Fixture',overall:'Fixture'}};
  let requests=0;
  globalThis.fetch=async()=>Response.json({content:[{type:'text',text:JSON.stringify(++requests===1?profile:quality)}]});
  assert.equal((await processNextCv(env)).status,'succeeded');
  assert.equal(requests,2);
  assert.equal((await tx`SELECT status FROM candidates WHERE id=${candidate}`)[0].status,'parsed');
  assert.equal(Number((await tx`SELECT years_experience FROM candidate_skills WHERE candidate_id=${candidate} AND skill='python'`)[0].years_experience),7);
  await tx`UPDATE matches SET stage='shortlisted' WHERE candidate_id=${candidate} AND job_id=${job}`;
  await saveProfileRevision(env,candidate,user,0,{...profile,name:'Corrected',languages:[],certifications:[],links:{}});
  assert.equal((await tx`SELECT quality_score FROM candidates WHERE id=${candidate}`)[0].quality_score,null);
  assert.equal((await processNextCv(env)).status,'succeeded');
  assert.equal((await tx`SELECT stage FROM matches WHERE candidate_id=${candidate} AND job_id=${job}`)[0].stage,'shortlisted');
  assert.equal((await tx`SELECT name FROM candidates WHERE id=${candidate}`)[0].name,'Corrected');
  assert.equal(requests,3,'correction only regrades, never re-extracts original CV');
  await tx`SELECT recruitment.revise_cv_profile(${candidate},${user}::uuid,1,${JSON.stringify({...profile,name:'Second correction'})})`;
  // Simulate another tab saving while an AI request is in flight.
  globalThis.fetch=async()=>{
    await tx`SELECT recruitment.revise_cv_profile(${candidate},${user}::uuid,2,${JSON.stringify({...profile,name:'Newest correction'})})`;
    return Response.json({content:[{type:'text',text:JSON.stringify(quality)}]});
  };
  assert.equal((await processNextCv(env)).status,'deferred_or_failed');
  const newest=(await tx`SELECT name,profile_revision,status,quality_score FROM candidates WHERE id=${candidate}`)[0];
  assert.equal(newest.name,'Newest correction');assert.equal(newest.profile_revision,3);assert.equal(newest.status,'uploaded');assert.equal(newest.quality_score,null);
  assert.equal((await tx`SELECT status FROM processing_jobs WHERE candidate_id=${candidate} AND profile_revision=3`)[0].status,'pending');
  globalThis.fetch=async()=>{throw new Error('secret private CV provider body');};
  assert.equal((await processNextCv(env)).status,'deferred_or_failed');
  const failed=(await tx`SELECT status,last_error,attempts FROM processing_jobs WHERE candidate_id=${candidate} AND profile_revision=3`)[0];
  assert.equal(failed.status,'pending');assert.equal(failed.attempts,1);assert.ok(!failed.last_error.includes('secret'));
  throw new Rollback();
});throw new Error('Fixtures were not rolled back');}catch(e){if(!(e instanceof Rollback))throw e;}finally{globalThis.fetch=originalFetch;await sql.end();}
console.log('PASS: actual worker registration, activation, parse/grade, skill mapping, preserved stages, edit refresh, stale-result rejection and private retry errors; all fixtures rolled back');
