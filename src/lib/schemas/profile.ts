import { z } from "zod";

export const SeniorityEnum = z.enum([
  "junior",
  "mid",
  "senior",
  "lead",
  "director",
  "executive",
]);
export type Seniority = z.infer<typeof SeniorityEnum>;

export const CandidateStatusEnum = z.enum([
  "uploaded",
  "parsing",
  "parsed",
  "failed",
]);
export type CandidateStatus = z.infer<typeof CandidateStatusEnum>;

export const ExperienceSchema = z.object({
  company: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().optional(),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const EducationSchema = z.object({
  institution: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  start_year: z.string().nullable().optional(),
  end_year: z.string().nullable().optional(),
});
export type Education = z.infer<typeof EducationSchema>;

export const SkillSchema = z.object({
  skill: z.string(),
  years_experience: z.number().nullable().optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const LinksSchema = z.object({
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  portfolio: z.string().nullable().optional(),
});

// The canonical shape the LLM must return when extracting a CV.
export const ParsedProfileSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),

  total_years_experience: z.number().nullable().optional(),
  seniority: SeniorityEnum.nullable().optional(),
  work_authorization: z.string().nullable().optional(),

  skills: z.array(SkillSchema).default([]),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  languages: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),

  links: LinksSchema.optional().default({}),
});
export type ParsedProfile = z.infer<typeof ParsedProfileSchema>;

export const QualityAssessmentSchema = z.object({
  score: z.number().min(0).max(100),
  notes: z.array(z.string()),
});
export type QualityAssessment = z.infer<typeof QualityAssessmentSchema>;
