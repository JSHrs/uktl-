import {
  ParsedProfileSchema,
  QualityAssessmentSchema,
  type ParsedProfile,
  type QualityAssessment,
} from "../schemas/profile";

const EXTRACTION_PROMPT = `You are a structured-data extractor for an executive search firm.
Extract the attached CV into a strict JSON object matching this schema:

{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "headline": string | null,                  // current role one-liner
  "summary": string | null,                   // 2-3 sentence professional summary
  "total_years_experience": number | null,    // calendar YoE across all roles
  "seniority": "junior"|"mid"|"senior"|"lead"|"director"|"executive"|null,
  "work_authorization": string | null,        // e.g. "UK citizen", "UAE resident"
  "skills": [ { "skill": string, "years_experience": number | null } ],
  "experience": [
    {
      "company": string|null,
      "title": string|null,
      "start_date": string|null,              // ISO-ish e.g. "2019-06"
      "end_date": string|null,                // null or "present" if current
      "is_current": boolean,
      "location": string|null,
      "description": string|null              // 1-3 sentence bullets merged
    }
  ],
  "education": [
    { "institution": string|null, "degree": string|null, "field": string|null,
      "start_year": string|null, "end_year": string|null }
  ],
  "languages": [string],
  "certifications": [string],
  "links": { "linkedin": string|null, "github": string|null, "portfolio": string|null }
}

Rules:
- Output ONLY the JSON object. No prose, no markdown fence.
- Use null for unknown fields. Do not invent values.
- Skills: prefer canonical names (e.g. "typescript" not "TS"). Include business
  skills ("mergers and acquisitions", "employment law") not just tech.
- Seniority: infer from titles and YoE when not explicit.`;

const QUALITY_PROMPT = `You are a CV quality assessor for an executive recruitment firm specialising in Construction and Technology.

Given the parsed CV JSON below, return a JSON object with this exact shape and no other text:
{
  "score": <overall 0-100>,
  "breakdown": {
    "contact_information": <0-100, based on completeness: name, email, phone, location, LinkedIn>,
    "experience": <0-100, based on detail, quantification, recency, relevance>,
    "skills": <0-100, based on depth, specificity, industry relevance>,
    "education": <0-100, based on completeness and level>
  },
  "notes": [<up to 5 short actionable bullet points>],
  "improvement_report": {
    "contact_information": "<1-2 sentences of specific advice>",
    "experience": "<1-2 sentences of specific advice>",
    "skills": "<1-2 sentences of specific advice>",
    "education": "<1-2 sentences of specific advice>",
    "overall": "<2-3 sentence overall assessment and top priority action>"
  }
}

Rules: output ONLY the JSON. No prose, no markdown. Scores reflect Construction/Technology sector standards.`;

export type ParseResult = {
  profile: ParsedProfile;
  quality: QualityAssessment;
};

type ParseInput =
  | { kind: "pdf"; bytes: ArrayBuffer; filename: string }
  | { kind: "text"; text: string; filename: string };

export async function parseCv(
  input: ParseInput,
  opts: { apiKey?: string; model?: string },
): Promise<ParseResult> {
  if (opts.apiKey) {
    return parseWithAnthropic(input, opts.apiKey, opts.model ?? "claude-sonnet-4-6");
  }
  return parseWithHeuristics(input);
}

async function parseWithAnthropic(
  input: ParseInput,
  apiKey: string,
  model: string,
): Promise<ParseResult> {
  const content: unknown[] = [];
  if (input.kind === "pdf") {
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: arrayBufferToBase64(input.bytes),
      },
    });
  } else {
    content.push({ type: "text", text: `CV TEXT:\n${input.text}` });
  }
  content.push({ type: "text", text: EXTRACTION_PROMPT });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 400)}`);
  }
  const payload = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    payload.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
  const profile = ParsedProfileSchema.parse(extractJsonObject(text));

  // Quality pass — cheap, text-only.
  const qRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `${QUALITY_PROMPT}\n\nCV JSON:\n${JSON.stringify(profile)}`,
        },
      ],
    }),
  });
  let quality: QualityAssessment = { score: 50, notes: [] };
  if (qRes.ok) {
    const qPayload = (await qRes.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const qText =
      qPayload.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    try {
      quality = QualityAssessmentSchema.parse(extractJsonObject(qText));
    } catch {
      // Fall through with default quality — try parsing a subset.
      try {
        const raw = extractJsonObject(qText) as Record<string, unknown>;
        quality = { score: Number(raw.score) || 50, notes: (raw.notes as string[]) ?? [] };
      } catch { /* ignore */ }
    }
  }
  return { profile, quality };
}

// Fallback that works offline on plain text. Designed so the app is usable
// without an Anthropic key for local demos — extraction is noticeably worse.
async function parseWithHeuristics(input: ParseInput): Promise<ParseResult> {
  const text =
    input.kind === "text"
      ? input.text
      : "Binary PDF supplied. Configure ANTHROPIC_API_KEY for full extraction.";

  const emailMatch = text.match(/[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  const phoneMatch = text.match(/\+?\d[\d\s().-]{7,}\d/);
  const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*$/m);
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[\w\-/]+/i);

  const profile: ParsedProfile = ParsedProfileSchema.parse({
    name: nameMatch?.[1] ?? null,
    email: emailMatch?.[0] ?? null,
    phone: phoneMatch?.[0] ?? null,
    location: null,
    headline: null,
    summary: null,
    total_years_experience: null,
    seniority: null,
    work_authorization: null,
    skills: [],
    experience: [],
    education: [],
    languages: [],
    certifications: [],
    links: { linkedin: linkedinMatch?.[0] ?? null },
  });
  return {
    profile,
    quality: {
      score: 20,
      notes: [
        "Heuristic parse only — configure ANTHROPIC_API_KEY for accurate extraction.",
      ],
    },
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  // eslint-disable-next-line no-undef
  return btoa(binary);
}

function extractJsonObject(text: string): unknown {
  // Strip fenced code blocks if the model added them despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const payload = fenced ? fenced[1] : text;
  const start = payload.indexOf("{");
  const end = payload.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object in model output: ${text.slice(0, 200)}`);
  }
  return JSON.parse(payload.slice(start, end + 1));
}
