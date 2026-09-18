import {z} from 'zod';
import {ParsedProfileSchema,ExperienceSchema,EducationSchema,SkillSchema,LinksSchema} from './profile.ts';
const short=z.string().trim().max(300).nullable().optional();
const year=z.string().trim().max(20).nullable().optional();
const url=z.string().trim().max(2000).refine(v=>!v || /^https?:\/\//i.test(v),'Use an https:// or http:// link').nullable().optional();
export const EditableProfileSchema=ParsedProfileSchema.extend({
  name:short,email:z.union([z.string().email().max(254),z.literal('')]).nullable().optional(),phone:short,location:short,headline:short,
  summary:z.string().trim().max(6000).nullable().optional(),work_authorization:short,total_years_experience:z.number().min(0).max(80).nullable().optional(),
  skills:z.array(SkillSchema.extend({skill:z.string().trim().min(1).max(100),years_experience:z.number().min(0).max(80).nullable().optional()})).max(100),
  experience:z.array(ExperienceSchema.extend({company:short,title:short,start_date:year,end_date:year,location:short,description:z.string().max(6000).nullable().optional()})).max(50),
  education:z.array(EducationSchema.extend({institution:short,degree:short,field:short,start_year:year,end_year:year})).max(30),
  languages:z.array(z.string().max(100)).max(30),certifications:z.array(z.string().max(300)).max(100),
  links:LinksSchema.extend({linkedin:url,github:url,portfolio:url}),
}).refine(p=>JSON.stringify(p).length<=24000,'Profile is too long; shorten descriptions before saving');
