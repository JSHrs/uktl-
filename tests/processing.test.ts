import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validMaintenanceSecret} from '../src/lib/server/processing.ts';
import {EditableProfileSchema} from '../src/lib/schemas/editable-profile.ts';
import {parsedProfileStatements} from '../src/lib/server/db.ts';
import {ParsedProfileSchema} from '../src/lib/schemas/profile.ts';
test('maintenance authorization rejects missing, short, malformed and wrong secrets',async()=>{
  const secret='a'.repeat(40);
  assert.equal(await validMaintenanceSecret(null,secret),false);
  assert.equal(await validMaintenanceSecret('Bearer short','short'),false);
  assert.equal(await validMaintenanceSecret(`Bearer ${secret}`,secret),true);
  assert.equal(await validMaintenanceSecret(`Bearer ${secret}x`,secret),false);
  assert.equal(await validMaintenanceSecret(secret,secret),false);
});
test('editable extraction bounds provider input and cannot submit a quality score',()=>{
  const base=ParsedProfileSchema.parse({name:'Candidate',sector:'construction'});
  assert.equal(EditableProfileSchema.safeParse({...base,quality_score:100}).success,true);
  assert.equal('quality_score' in EditableProfileSchema.parse({...base,quality_score:100}),false);
  assert.equal(EditableProfileSchema.safeParse({...base,total_years_experience:-1}).success,false);
  assert.equal(EditableProfileSchema.safeParse({...base,skills:Array.from({length:101},()=>({skill:'SQL'}))}).success,false);
  assert.equal(EditableProfileSchema.safeParse({...base,links:{portfolio:'javascript:alert(1)'}}).success,false);
});
test('skill aliases never shift years and raw labels onto another normalised skill',()=>{
  const writes:Array<{query:string;values:unknown[]}>=[];
  const env={DB:{prepare(query:string){return {bind(...values:unknown[]){writes.push({query,values});return this;}};}}} as any;
  const profile=ParsedProfileSchema.parse({skills:[{skill:'JS',years_experience:2},{skill:'JavaScript',years_experience:3},{skill:'Python',years_experience:7}]});
  parsedProfileStatements(env,'candidate',profile,['javascript','python'],{score:50,notes:[]});
  const rows=writes.filter(w=>w.query.includes('INSERT INTO candidate_skills'));
  assert.equal(rows.length,2);
  assert.deepEqual(rows[1].values,['candidate','python','Python',7]);
});
