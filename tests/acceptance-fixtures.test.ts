import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreMatch} from '../src/lib/server/match.ts';
import {ParsedProfileSchema} from '../src/lib/schemas/profile.ts';
import {JobSchema} from '../src/lib/schemas/job.ts';
const fixtures=JSON.parse(readFileSync('fixtures/acceptance/cv-review.json','utf8'));
for(const c of fixtures.cases){test(`review fixture: ${c.id} has conservative evidence scoring`,()=>{
 const p=ParsedProfileSchema.parse(c.profile),j=JobSchema.parse(c.job),skills=p.skills.map(s=>s.skill);
 assert.equal(scoreMatch(p,skills,j).score,c.expectedScore);
 assert.equal(scoreMatch({...p,name:'Different synthetic name',email:'different@example.invalid',phone:'000',work_authorization:'not stated'},skills,j).score,c.expectedScore,'identity fields do not alter the ranking');
});}
