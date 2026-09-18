// Cheap, deterministic skill normalisation. A taxonomy of aliases → canonical
// label keeps matching from being polluted by casing & punctuation variance.
// When we outgrow this, swap the lookup for an embedding nearest-neighbour.

const ALIASES: Record<string, string> = {
  // Tech
  "react.js": "react",
  reactjs: "react",
  "node.js": "node",
  nodejs: "node",
  "next.js": "nextjs",
  ts: "typescript",
  js: "javascript",
  py: "python",
  "c#": "csharp",
  "c++": "cpp",
  golang: "go",
  postgres: "postgresql",
  pg: "postgresql",
  ml: "machine learning",
  ai: "artificial intelligence",

  // Business / HR / legal
  hr: "human resources",
  "p&l": "p&l management",
  pnl: "p&l management",
  "m&a": "mergers and acquisitions",
  ma: "mergers and acquisitions",
  "ir": "investor relations",
  tupe: "tupe",
  "employment law": "employment law",
  fca: "fca regulation",
  "oil and gas": "upstream oil and gas",
  "oil & gas": "upstream oil and gas",
  ksa: "ksa experience",
  gcc: "gcc experience",
  uae: "uae experience",
  "supply chain management": "supply chain",
};

export function normaliseSkill(raw: string): string {
  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const punct = trimmed.replace(/[.,/\\]+$/, "");
  return ALIASES[punct] ?? punct;
}

export function normaliseSkillList(skills: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of skills) {
    const n = normaliseSkill(s);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
