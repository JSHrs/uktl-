import type { ParsedProfile } from "../schemas/profile";

// Produce a client-safe view of a candidate profile. Used for shortlists sent
// to end clients — strips name, direct contact, nationality-implying details,
// and education institution (which can encode protected characteristics).
export function anonymiseProfile(p: ParsedProfile): ParsedProfile {
  return {
    ...p,
    name: p.name ? initials(p.name) : null,
    email: null,
    phone: null,
    location: bucketLocation(p.location ?? null),
    summary: p.summary ? redactPii(p.summary) : null,
    links: {},
    education: (p.education ?? []).map((e) => ({
      ...e,
      institution: e.institution ? "[redacted]" : null,
    })),
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function bucketLocation(loc: string | null): string | null {
  if (!loc) return null;
  const lower = loc.toLowerCase();
  if (lower.includes("london") || lower.includes("uk") || lower.includes("england"))
    return "United Kingdom";
  if (lower.includes("dubai") || lower.includes("uae")) return "UAE";
  if (lower.includes("riyadh") || lower.includes("saudi") || lower.includes("ksa"))
    return "KSA";
  if (lower.includes("doha") || lower.includes("qatar")) return "Qatar";
  if (lower.includes("bahrain")) return "Bahrain";
  return loc.split(",").pop()?.trim() ?? loc;
}

// Redact obvious PII from free text before sending it to an LLM.
// Not a full DLP solution; intended as defence-in-depth.
export function redactPii(text: string): string {
  return text
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[email]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[phone]")
    .replace(/\bhttps?:\/\/\S+\b/g, "[url]");
}
