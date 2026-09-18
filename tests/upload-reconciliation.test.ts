import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectUploadReconciliation,UPLOAD_RECONCILIATION_GRACE_MS,ORPHAN_OBJECTS_SQL,MISSING_OBJECTS_SQL} from '../src/lib/server/upload-reconciliation.ts';

test('reconciliation is bounded, metadata-only and strips unexpected fields',async()=>{
  const queries:{sql:string;cutoff:number}[]=[];
  const env={DATA_BACKEND:'supabase',DB:{prepare(sql:string){return {bind(cutoff:number){queries.push({sql,cutoff});return this;},async all(){return {success:true,results:Array.from({length:101},(_,i)=>({id:`id-${i}`,name:'private filename',raw_profile:'private CV'}))};}};}}} as any;
  const report=await inspectUploadReconciliation(env);
  assert.equal(report.orphanObjects.length,100);assert.equal(report.missingFiles.length,100);
  assert.equal(report.moreOrphanObjects,true);assert.equal(report.moreMissingFiles,true);
  assert.equal(report.checkedAt-report.cutoff,UPLOAD_RECONCILIATION_GRACE_MS);
  assert.ok(queries.every(q=>q.cutoff===report.cutoff));
  assert.equal(queries.length,2);assert.ok(queries.every(q=>q.sql.startsWith('SELECT')));
  assert.ok(!JSON.stringify(report).includes('private'));
  assert.match(ORPHAN_OBJECTS_SQL,/cv_versions/);assert.match(MISSING_OBJECTS_SQL,/'pending','running'/);
});
test('reconciliation refuses the legacy backend and sanitizes database failures',async()=>{
  await assert.rejects(inspectUploadReconciliation({DATA_BACKEND:'d1'} as any),/requires Supabase/);
  const env={DATA_BACKEND:'supabase',DB:{prepare(){throw new Error('secret password / CV filename');}}} as any;
  await assert.rejects(inspectUploadReconciliation(env),error=>{
    assert.equal((error as Error).message,'Upload reconciliation unavailable. No files or candidate records were changed.');return true;
  });
});
test('reconciliation does not represent query failure as an empty healthy report',async()=>{
  for(const response of [{success:false,results:[]},{success:true},{success:true,results:[{id:null}]}]){
    const env={DATA_BACKEND:'supabase',DB:{prepare(){return {bind(){return this;},async all(){return response;}};}}} as any;
    await assert.rejects(inspectUploadReconciliation(env),/unavailable/);
  }
});
