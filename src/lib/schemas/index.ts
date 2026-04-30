import { z } from "zod";

export const SERVICE_OPTIONS = [
  "HR Consultancy",
  "Recruitment",
  "Employment Law",
  "Middle East Recruitment",
  "Other / Not Sure",
] as const;

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
] as const;

export const STAGES = [
  "Sourced",
  "Shortlisted",
  "Interview",
  "Offer",
  "Placed",
  "Rejected",
] as const;

export const CONTENT_TYPES = [
  "Blog Article",
  "LinkedIn Post",
  "Email Newsletter",
] as const;

export const TONES = [
  "Professional & Authoritative",
  "Approachable & Plain-English",
  "Thought Leadership",
  "Urgent & Practical",
] as const;

export type Priority = (typeof PRIORITIES)[number];
export type LeadStatus = (typeof STATUS_OPTIONS)[number];
export type Stage = (typeof STAGES)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type Tone = (typeof TONES)[number];

export const LeadInputSchema = z.object({
  name: z.string().min(1).max(120),
  company: z.string().max(160).optional().nullable(),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().nullable(),
  service: z.string().min(1).max(80),
  message: z.string().max(4000).optional().nullable(),
});
export type LeadInput = z.infer<typeof LeadInputSchema>;

export const LeadSchema = z.object({
  id: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
  name: z.string(),
  company: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  service: z.string(),
  message: z.string().nullable(),
  score: z.number().int(),
  priority: z.enum(PRIORITIES),
  status: z.enum(STATUS_OPTIONS),
  ai_draft: z.string().nullable(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const CandidateInputSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  client: z.string().max(160).optional().nullable(),
  email: z.string().email().max(160).optional().nullable(),
  stage: z.enum(STAGES).default("Sourced"),
  notes: z.string().max(4000).optional().nullable(),
});
export type CandidateInput = z.infer<typeof CandidateInputSchema>;

export const CandidateSchema = z.object({
  id: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
  name: z.string(),
  role: z.string(),
  client: z.string().nullable(),
  email: z.string().nullable(),
  stage: z.enum(STAGES),
  score: z.number().int(),
  notes: z.string().nullable(),
  ai_analysis: z.string().nullable(),
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const ContentItemSchema = z.object({
  id: z.string(),
  created_at: z.number(),
  title: z.string(),
  type: z.enum(CONTENT_TYPES),
  tone: z.string().nullable(),
  content: z.string(),
  word_count: z.number().int(),
  published: z.boolean(),
});
export type ContentItem = z.infer<typeof ContentItemSchema>;

export const ContentGenerateInputSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  topic: z.string().min(3).max(400),
  tone: z.enum(TONES),
});

export const ContentSaveInputSchema = z.object({
  title: z.string().min(1),
  type: z.enum(CONTENT_TYPES),
  tone: z.string().optional().nullable(),
  content: z.string().min(1),
});

export const AnalyticsEventInputSchema = z.object({
  type: z.enum(["page_view", "form_start", "form_submit"]),
  page: z.string().max(200).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});
