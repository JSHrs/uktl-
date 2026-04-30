// Anthropic Claude API wrapper. Pure fetch — no SDK, Workers-native.

import type { AppEnv } from "./env";

type Message = { role: "user" | "assistant"; content: string };

export async function callClaude(
  env: AppEnv,
  args: { system: string; user: string; maxTokens?: number },
): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  const model = env.CLAUDE_MODEL ?? "claude-sonnet-4-5";
  const messages: Message[] = [{ role: "user", content: args.user }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: args.maxTokens ?? 1200,
      system: args.system,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const block = data.content?.find((b) => b.type === "text");
  return block?.text ?? "";
}

// ─── Prompt library ───────────────────────────────────────────────────────────

export const LEAD_REPLY_SYSTEM = `You are a professional assistant for UK Talent Link, a prestigious London-based HR consultancy and recruitment firm. Write warm, authoritative email responses on behalf of the team. Always sign off as "The UK Talent Link Team". Keep replies 150–200 words, personalised to the specific situation. End with one clear next step (book a call or send availability). UK English spelling throughout. Never mention AI or that this is drafted.`;

export function leadReplyPrompt(args: {
  name: string;
  company: string | null;
  service: string;
  message: string | null;
}): string {
  const firstName = args.name.split(" ")[0] || args.name;
  return `Write a reply to this enquiry:
Name: ${args.name}
Company: ${args.company ?? "Not provided"}
Service: ${args.service}
Message: ${args.message ?? "(no message provided)"}

Start with "Dear ${firstName},"`;
}

export const CANDIDATE_ANALYSIS_SYSTEM = `You are a senior recruitment analyst at a specialist UK/Middle East recruitment firm. Be direct, specific, and commercially minded. No waffle.`;

export function candidateAnalysisPrompt(args: {
  name: string;
  role: string;
  client: string | null;
  notes: string | null;
}): string {
  return `Analyse this candidate's suitability:
Name: ${args.name}
Role applied for: ${args.role}
Client: ${args.client ?? "Unspecified"}
Notes: ${args.notes ?? "(no notes provided)"}

Provide exactly:
1. A 2-sentence suitability assessment
2. One specific recommendation (advance / hold / reject and why)
3. One question to probe in interview

Format as plain paragraphs, no bullet points.`;
}

const BLOG_PROMPT = (topic: string, tone: string) =>
  `Write a blog article for UK Talent Link's website on: "${topic}"
Include: compelling H1 headline, brief intro paragraph, 3–4 sections with H2 subheadings, practical takeaways, closing paragraph with CTA to book a consultation.
Tone: ${tone}. UK English. No fluff. Real expertise throughout.
Format in Markdown. Aim for 600–900 words.`;

const LINKEDIN_PROMPT = (topic: string, tone: string) =>
  `Write a LinkedIn post for UK Talent Link on: "${topic}"
Hook on first line (no "Excited to share" clichés). 3–4 insight bullets or short paragraphs.
End with a genuine question to drive comments. Tone: ${tone}. UK English. Max 3 relevant hashtags at end. 200–280 words.`;

const NEWSLETTER_PROMPT = (topic: string, tone: string) =>
  `Write an email newsletter section for UK Talent Link on: "${topic}"
Subject line suggestion at top. Warm opener, 3 practical takeaways, brief closing with soft CTA.
Tone: ${tone}. UK English. 250–350 words.`;

export const CONTENT_SYSTEM = `You are a senior HR and employment law content writer for UK Talent Link, a prestigious London-based HR consultancy. Your writing is authoritative, clear, and practical. Always write with genuine expertise. UK spelling throughout. Avoid generic filler.`;

export function contentPrompt(args: {
  type: "Blog Article" | "LinkedIn Post" | "Email Newsletter";
  topic: string;
  tone: string;
}): string {
  if (args.type === "Blog Article") return BLOG_PROMPT(args.topic, args.tone);
  if (args.type === "LinkedIn Post") return LINKEDIN_PROMPT(args.topic, args.tone);
  return NEWSLETTER_PROMPT(args.topic, args.tone);
}
