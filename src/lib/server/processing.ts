import type { AppEnv } from './env';
import { parsedProfileStatements, matchStatements, listJobs } from './db.ts';
import { parseCv, gradeProfile } from './parse.ts';
import { ParsedProfileSchema, type ParsedProfile } from '../schemas/profile.ts';
import { validateCvUpload } from './upload-validation.ts';
import { extractDocxText } from './docx.ts';
import { normaliseSkillList } from './skills.ts';
import { scoreMatch } from './match.ts';

type Lease = {id:string;candidate_id:string;kind:'parse'|'match';lease_token:string;attempts:number};
export type ProcessingStatus = {status:string;attempts:number;available_at:number;last_error:string|null};

export async function registerQueuedCv(env:AppEnv,args:{id:string;filename:string;r2Key:string;sizeBytes:number;authUserId:string|null}) {
  const now=Date.now();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO candidates (id,created_at,updated_at,status,source_filename,source_r2_key,source_bytes,auth_user_id) VALUES (?,?,?,'uploaded',?,?,?,?)`)
      .bind(args.id,now,now,args.filename,args.r2Key,args.sizeBytes,args.authUserId),
    // Register before storage. If activation is interrupted, the worker retries
    // after this grace period using the retained object key.
    env.DB.prepare(`INSERT INTO processing_jobs (id,candidate_id,kind,status,idempotency_key,available_at,created_at,updated_at) VALUES (?,?,'parse','pending',?,?,?,?)`)
      .bind(crypto.randomUUID(),args.id,`${args.id}:revision:0`,now+900000,now,now),
  ]);
}
export async function activateQueuedCv(env:AppEnv,id:string) {
  await env.DB.prepare(`UPDATE processing_jobs SET available_at=?,updated_at=? WHERE candidate_id=? AND status='pending' AND attempts=0`).bind(Date.now(),Date.now(),id).run();
}
export async function failQueuedUpload(env:AppEnv,id:string) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE candidates SET status='failed',parse_error='Private upload did not complete. Please upload again.',updated_at=? WHERE id=?`).bind(Date.now(),id),
    env.DB.prepare(`UPDATE processing_jobs SET status='failed',last_error='Private upload did not complete.',updated_at=? WHERE candidate_id=? AND status='pending'`).bind(Date.now(),id),
  ]);
}
export async function processingStatus(env:AppEnv,id:string):Promise<ProcessingStatus|null> {
  if (env.DATA_BACKEND!=='supabase') return null;
  return env.DB.prepare(`SELECT j.status,j.attempts,j.available_at,j.last_error FROM processing_jobs j JOIN candidates c ON c.id=j.candidate_id AND c.profile_revision=j.profile_revision WHERE c.id=? ORDER BY j.created_at DESC LIMIT 1`).bind(id).first<ProcessingStatus>();
}

// Bounded: one job per authenticated request, three attempts, 15-minute lease.
// Duplicate execution may consume provider work after a crash, but stale workers
// cannot commit results. No claim of exactly-once external API calls is made.
export async function processNextCv(env:AppEnv) {
  if (env.DATA_BACKEND!=='supabase' || !env.ANTHROPIC_API_KEY) throw new Error('CV worker is not configured');
  const lease=await env.DB.prepare('SELECT * FROM recruitment.claim_cv_job()').first<Lease>();
  if (!lease) return {status:'idle' as const};
  try {
    const candidate=await env.DB.prepare('SELECT source_r2_key,source_filename,raw_profile FROM candidates WHERE id=?').bind(lease.candidate_id)
      .first<{source_r2_key:string;source_filename:string;raw_profile:string|null}>();
    if (!candidate) throw new Error('Candidate unavailable');
    const opts={apiKey:env.ANTHROPIC_API_KEY,model:env.PARSE_MODEL};
    let result;
    if (lease.kind==='match') {
      const profile=ParsedProfileSchema.parse(JSON.parse(candidate.raw_profile ?? '{}'));
      result={profile,quality:await gradeProfile(profile,opts)};
    } else {
      const object=await env.CV_BUCKET.get(candidate.source_r2_key);
      if (!object || object.size>10*1024*1024) throw new Error('Private upload unavailable');
      const bytes=await object.arrayBuffer();
      const validated=validateCvUpload(candidate.source_filename,bytes);
      result=await parseCv(validated.kind==='pdf' ? {kind:'pdf',bytes,filename:candidate.source_filename} :
        {kind:'text',text:validated.kind==='docx'?extractDocxText(bytes):new TextDecoder().decode(bytes),filename:candidate.source_filename},opts);
    }
    const skills=normaliseSkillList(result.profile.skills.map(s=>s.skill));
    const matches=(await listJobs(env)).map(job=>scoreMatch(result.profile,skills,job));
    await env.DB.batch([
      env.DB.prepare('SELECT recruitment.assert_cv_lease(?,?::uuid)').bind(lease.id,lease.lease_token),
      ...parsedProfileStatements(env,lease.candidate_id,result.profile,skills,result.quality),
      ...matchStatements(env,lease.candidate_id,matches),
      env.DB.prepare(`UPDATE processing_jobs SET status='succeeded',lease_token=NULL,locked_at=NULL,last_error=NULL,updated_at=? WHERE id=?`).bind(Date.now(),lease.id),
    ]);
    return {status:'succeeded' as const};
  } catch {
    // Never store upstream response text, CV contents or credential-bearing URLs.
    // An expired/superseded lease cannot alter the newer revision's state.
    try {await env.DB.prepare('SELECT recruitment.fail_cv_job(?,?::uuid)').bind(lease.id,lease.lease_token).run();} catch { /* recovered by next claim, or superseded */ }
    return {status:'deferred_or_failed' as const};
  }
}

export async function validMaintenanceSecret(header:string|null,secret:string|undefined):Promise<boolean> {
  if (!secret || secret.length<32 || !header || header.length>1024) return false;
  const digest=async (value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  const [a,b]=await Promise.all([digest(header),digest(`Bearer ${secret}`)]);
  let difference=0; for(let i=0;i<a.length;i++) difference|=a[i]^b[i];
  return difference===0;
}

export async function saveProfileRevision(env:AppEnv,id:string,userId:string,revision:number,profile:ParsedProfile) {
  // All extracted tables change together. The temporary quality placeholder is
  // cleared before the transaction commits and can never be shown to a reader.
  const skills=normaliseSkillList(profile.skills.map(s=>s.skill));
  await env.DB.batch([
    env.DB.prepare('SELECT recruitment.revise_cv_profile(?,?::uuid,?,?)').bind(id,userId,revision,JSON.stringify(profile)),
    ...parsedProfileStatements(env,id,profile,skills,{score:0,notes:[]}),
    env.DB.prepare("UPDATE candidates SET status='uploaded',quality_score=NULL,quality_notes=NULL,score_breakdown=NULL,improvement_report=NULL WHERE id=?").bind(id),
  ]);
}
