import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateMatchReview,matchingEvidenceText} from '../src/lib/server/match-evidence.ts';
import {ParsedProfileSchema} from '../src/lib/schemas/profile.ts';
import {claudeJson} from '../src/lib/server/claude-json.ts';
import {z} from 'zod';
test('technology and construction evidence review requires exact support and complete criteria',()=>{
 for(const [requirement,quote] of [['Python','Built Python services'],['Site management','Managed a construction site']]){
  const result=validateMatchReview({requirements:[{index:0,status:'evidence_found',quote}]},[requirement],quote);
  assert.equal(result[0].quote,quote);
  assert.throws(()=>validateMatchReview({requirements:[{index:0,status:'evidence_found',quote:'invented'}]},[requirement],quote));
 }
 assert.throws(()=>validateMatchReview({requirements:[]},['Python'],'Python'));
 assert.throws(()=>validateMatchReview({requirements:[{index:0,status:'not_established',quote:''},{index:0,status:'not_established',quote:''}]},['a','b'],''));
 assert.throws(()=>validateMatchReview({requirements:[{index:0,status:'not_established',quote:'invented'}]},['a'],''));
 assert.equal(validateMatchReview({requirements:[{index:0,status:'not_established',quote:''}]},['a'],'')[0].status,'not_established');
});
test('matching input deliberately excludes direct identity and work-authorization fields',()=>{
 const text=matchingEvidenceText(ParsedProfileSchema.parse({name:'Secret Name',email:'private@example.invalid',phone:'123456',work_authorization:'Nationality',skills:[{skill:'Python'}],experience:[{title:'Engineer'}]}));
 assert.equal(text,'Python\nEngineer');
});
test('AI JSON boundary rejects missing keys, truncation, malformed results and provider bodies',async()=>{
 const original=globalThis.fetch;try{
  const args={apiKey:'fixture',system:'fixture',input:{},schema:z.object({ok:z.boolean()}).strict()};
  for(const response of [Response.json({secret:'provider body'},{status:500}),Response.json({stop_reason:'max_tokens',content:[{type:'text',text:'{"ok":true}'}]}),Response.json({stop_reason:'end_turn',content:[{type:'text',text:'{"unexpected":true}'}]})]){
   globalThis.fetch=async()=>response;
   await assert.rejects(claudeJson(args),/AI assessment unavailable or invalid/);
  }
  globalThis.fetch=async()=>Response.json({stop_reason:'end_turn',content:[{type:'text',text:'{"ok":true}'}]});
  assert.deepEqual(await claudeJson(args),{ok:true});
  await assert.rejects(claudeJson({...args,apiKey:undefined}),/not configured/);
 }finally{globalThis.fetch=original;}
});
