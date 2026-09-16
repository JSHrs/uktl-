import type { MatchStage } from "./schemas/job";

export const STAGE_LABELS: Record<MatchStage, string> = {
  matched: "Matched",
  screening: "Screening",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  placed: "Placed",
  rejected: "Rejected",
};

export function stageTone(stage: MatchStage): "neutral" | "good" | "bad" {
  if (stage === "rejected") return "bad";
  if (stage === "matched" || stage === "screening") return "neutral";
  return "good";
}
