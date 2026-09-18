import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreMatch } from "../src/lib/server/match.ts";
const candidate = {skills:[],experience:[],education:[],total_years_experience:5,seniority:"senior",location:"London, UK"} as any;
const job = {id:"role",title:"Developer",created_at:1,status:"open",must_have_skills:["TypeScript"],nice_to_have_skills:[],min_years_experience:5,seniority:"senior",location:"London, England"} as any;
test("missing candidate/job evidence never creates a high match score",()=>{
  const result=scoreMatch({skills:[],experience:[],education:[]} as any,[],{...job,must_have_skills:[],min_years_experience:null,seniority:null,location:null});
  assert.equal(result.score,0);assert.equal(result.skills_overlap,0);assert.match(result.reasoning,/Not established/);
});
test("essential-only roles can receive full evidence credit without optional skills",()=>{
  const result=scoreMatch(candidate,["typescript"],job);
  assert.equal(result.skills_overlap,100);assert.equal(result.score,100);
  assert.equal(scoreMatch(candidate,["typescript"],{...job,must_have_skills:["TypeScript","ts","TypeScript"]}).skills_overlap,100);
});
test("excess years add no bonus and missing experience gives no default credit",()=>{
  assert.equal(scoreMatch(candidate,["typescript"],job).experience_fit,100);
  assert.equal(scoreMatch({...candidate,total_years_experience:25},["typescript"],job).experience_fit,100);
  assert.equal(scoreMatch({...candidate,total_years_experience:null},["typescript"],job).experience_fit,0);
});
test("substring cities and broad country proximity do not imply a location match",()=>{
  assert.equal(scoreMatch({...candidate,location:"New York"},[],{...job,location:"York"}).location_fit,0);
  assert.equal(scoreMatch({...candidate,location:"Manchester, UK"},[],job).location_fit,0);
  assert.equal(scoreMatch({...candidate,location:null},[],{...job,location:"Remote"}).location_fit,100);
});
