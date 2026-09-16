import { z } from "zod";
import { SeniorityEnum } from "./profile";

export const JobStatusEnum = z.enum(["open", "closed"]);
export type JobStatus = z.infer<typeof JobStatusEnum>;

export const JobSchema = z.object({
  id: z.string(),
  created_at: z.number(),
  title: z.string(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  seniority: SeniorityEnum.nullable().optional(),
  min_years_experience: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  must_have_skills: z.array(z.string()).default([]),
  nice_to_have_skills: z.array(z.string()).default([]),
  status: JobStatusEnum,
});
export type Job = z.infer<typeof JobSchema>;

export const MatchSchema = z.object({
  candidate_id: z.string(),
  job_id: z.string(),
  score: z.number().min(0).max(100),
  skills_overlap: z.number().min(0).max(100),
  experience_fit: z.number().min(0).max(100),
  seniority_fit: z.number().min(0).max(100),
  location_fit: z.number().min(0).max(100),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  reasoning: z.string(),
  computed_at: z.number(),
});
export type Match = z.infer<typeof MatchSchema>;
