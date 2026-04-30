import type { LeadInput } from "../schemas";
import type { Priority } from "../schemas";

export function scoreLead(lead: LeadInput): number {
  let score = 0;
  const company = (lead.company ?? "").trim().toLowerCase();
  if (company && company !== "self-employed" && company !== "not provided") {
    score += 25;
  }
  if (lead.phone && lead.phone.trim().length > 4) score += 15;
  const message = (lead.message ?? "").trim();
  if (message.length > 100) score += 30;
  if (message.length > 250) score += 10;
  if (lead.service === "HR Consultancy" || lead.service === "Recruitment") score += 15;
  if (lead.service === "Employment Law") score += 10;
  if (lead.service === "Middle East Recruitment") score += 12;
  // Small variance so seed leads don't tie at round numbers.
  score += Math.floor(Math.random() * 5);
  return Math.min(score, 98);
}

export function priorityFromScore(score: number): Priority {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}
