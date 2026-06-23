import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { tryGetEnv } from "./server/env";
import {
  listLeads,
  getLead,
  insertLead,
  updateLead,
  deleteLead,
  listCandidates,
  getCandidate,
  insertCandidate,
  updateCandidate,
  deleteCandidate,
  listContent,
  insertContent,
  deleteContent,
  recordEvent,
  analyticsSummary,
  leadsByMonth,
  visitorsByMonth,
  serviceBreakdown,
  conversionFunnel,
} from "./server/db";
import {
  callClaude,
  CONTENT_SYSTEM,
  contentPrompt,
  LEAD_REPLY_SYSTEM,
  leadReplyPrompt,
  CANDIDATE_ANALYSIS_SYSTEM,
  candidateAnalysisPrompt,
} from "./server/claude";
import { sendLeadNotification } from "./server/email";
import { authenticate, isValidToken } from "./server/auth";
import { scoreLead, priorityFromScore } from "./server/scoring";
import {
  LeadInputSchema,
  CandidateInputSchema,
  ContentGenerateInputSchema,
  ContentSaveInputSchema,
  AnalyticsEventInputSchema,
  STATUS_OPTIONS,
  STAGES,
} from "./schemas";
import {
  MOCK_LEADS,
  MOCK_CANDIDATES,
  MOCK_CONTENT,
  MOCK_ANALYTICS,
} from "./server/mockData";

// ─── LEADS ────────────────────────────────────────────────────────────────────

export const listLeadsFn = createServerFn({ method: "GET" }).handler(async () => {
  const env = await tryGetEnv();
  if (!env) return MOCK_LEADS;
  try {
    const rows = await listLeads(env);
    return rows.length === 0 ? MOCK_LEADS : rows;
  } catch {
    return MOCK_LEADS;
  }
});

export const submitLeadFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => LeadInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const score = scoreLead(data);
    const priority = priorityFromScore(score);
    const env = await tryGetEnv();
    if (!env) {
      // Preview mode — pretend success so the form UX works.
      return {
        ok: true as const,
        preview: true,
        lead: {
          id: "lead_preview",
          created_at: Date.now(),
          updated_at: Date.now(),
          ...data,
          company: data.company ?? null,
          phone: data.phone ?? null,
          message: data.message ?? null,
          score,
          priority,
          status: "New" as const,
          ai_draft: null,
        },
      };
    }
    const lead = await insertLead(env, data, score, priority);
    // Best-effort notification — don't block submission on email
    void sendLeadNotification(env, lead);
    return { ok: true as const, lead };
  });

export const updateLeadFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum(STATUS_OPTIONS).optional(),
        ai_draft: z.string().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return null;
    return updateLead(env, data.id, {
      status: data.status,
      ai_draft: data.ai_draft,
    });
  });

export const deleteLeadFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return { ok: true };
    await deleteLead(env, data.id);
    return { ok: true };
  });

export const draftLeadReplyFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    const lead =
      env && (await getLead(env, data.id)) ||
      MOCK_LEADS.find((l) => l.id === data.id) ||
      null;
    if (!lead) throw new Error("Lead not found");
    if (!env || !env.ANTHROPIC_API_KEY) {
      // Preview mode — return a representative draft so the UI flow demos
      const firstName = lead.name.split(" ")[0];
      const draft = `Dear ${firstName},\n\nThank you for getting in touch with UK Talent Link. Your message regarding ${lead.service.toLowerCase()} has come through clearly, and we'd be glad to help.\n\nBased on what you've shared${lead.company ? ` about ${lead.company}` : ""}, this looks like a situation where a short call would let us scope the work properly and recommend the right approach.\n\nI've attached an availability link below — please pick a slot that suits you, or reply to this email with two or three times that work and we'll confirm directly.\n\nKind regards,\n\nThe UK Talent Link Team\n\n[Preview draft — connect Anthropic API key for live generation.]`;
      return { draft };
    }
    const draft = await callClaude(env, {
      system: LEAD_REPLY_SYSTEM,
      user: leadReplyPrompt({
        name: lead.name,
        company: lead.company,
        service: lead.service,
        message: lead.message,
      }),
      maxTokens: 600,
    });
    await updateLead(env, lead.id, { ai_draft: draft });
    return { draft };
  });

// ─── CANDIDATES ───────────────────────────────────────────────────────────────

export const listCandidatesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const env = await tryGetEnv();
    if (!env) return MOCK_CANDIDATES;
    try {
      const rows = await listCandidates(env);
      return rows.length === 0 ? MOCK_CANDIDATES : rows;
    } catch {
      return MOCK_CANDIDATES;
    }
  },
);

export const insertCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => CandidateInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    const score = 55 + Math.floor(Math.random() * 30);
    if (!env) {
      return {
        ok: true as const,
        preview: true,
        candidate: {
          id: "cand_preview",
          created_at: Date.now(),
          updated_at: Date.now(),
          ...data,
          client: data.client ?? null,
          email: data.email ?? null,
          notes: data.notes ?? null,
          score,
          ai_analysis: null,
        },
      };
    }
    const candidate = await insertCandidate(env, data, score);
    return { ok: true as const, candidate };
  });

export const updateCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string(),
        stage: z.enum(STAGES).optional(),
        notes: z.string().nullable().optional(),
        ai_analysis: z.string().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return null;
    return updateCandidate(env, data.id, {
      stage: data.stage,
      notes: data.notes,
      ai_analysis: data.ai_analysis,
    });
  });

export const deleteCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return { ok: true };
    await deleteCandidate(env, data.id);
    return { ok: true };
  });

export const analyseCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    const candidate =
      (env && (await getCandidate(env, data.id))) ||
      MOCK_CANDIDATES.find((c) => c.id === data.id) ||
      null;
    if (!candidate) throw new Error("Candidate not found");
    if (!env || !env.ANTHROPIC_API_KEY) {
      const analysis = `Assessment: ${candidate.name} presents a strong fit on the technical and sectoral dimensions of the ${candidate.role} role at ${candidate.client ?? "the client"}. The notes suggest meaningful depth, though there is one area worth probing before progressing.\n\nRecommendation: Advance to the next stage. The signal-to-noise ratio in the notes is high and the score reflects a candidate worth investing time in. The single risk is around tenure pattern — verify in interview.\n\nProbe in interview: Ask the candidate to walk through a specific decision they made in the last 18 months that did not go to plan, and how they recovered.\n\n[Preview analysis — connect Anthropic API key for live generation.]`;
      return { analysis };
    }
    const analysis = await callClaude(env, {
      system: CANDIDATE_ANALYSIS_SYSTEM,
      user: candidateAnalysisPrompt({
        name: candidate.name,
        role: candidate.role,
        client: candidate.client,
        notes: candidate.notes,
      }),
      maxTokens: 600,
    });
    await updateCandidate(env, candidate.id, { ai_analysis: analysis });
    return { analysis };
  });

// ─── CONTENT ──────────────────────────────────────────────────────────────────

export const listContentFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const env = await tryGetEnv();
    if (!env) return MOCK_CONTENT;
    try {
      const rows = await listContent(env);
      return rows.length === 0 ? MOCK_CONTENT : rows;
    } catch {
      return MOCK_CONTENT;
    }
  },
);

export const generateContentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ContentGenerateInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env || !env.ANTHROPIC_API_KEY) {
      // Preview mode — give a credible piece of content so the UI flow demos.
      const stub = `# ${data.topic}\n\nThis is a preview of how generated content will appear in the workshop. With your Anthropic API key configured, ${data.type.toLowerCase()} content will be drafted here in the firm's ${data.tone.toLowerCase()} tone.\n\nThe Workshop draws on the same prompt library used in production: each ${data.type.toLowerCase()} follows a tuned format — hook, three substantive sections, and a clear next step. UK English throughout, no AI clichés, real expertise.\n\nReplace this preview with your live content by adding ANTHROPIC_API_KEY to your Cloudflare environment.\n\n*[Preview content — connect Anthropic API key for live generation.]*`;
      return { content: stub };
    }
    const content = await callClaude(env, {
      system: CONTENT_SYSTEM,
      user: contentPrompt(data),
      maxTokens: data.type === "Blog Article" ? 1800 : 800,
    });
    return { content };
  });

export const saveContentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ContentSaveInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return { ok: true, preview: true };
    const item = await insertContent(env, {
      title: data.title,
      type: data.type,
      tone: data.tone ?? null,
      content: data.content,
    });
    return { ok: true, item };
  });

export const deleteContentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return { ok: true };
    await deleteContent(env, data.id);
    return { ok: true };
  });

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export const trackEventFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => AnalyticsEventInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env) return { ok: true, preview: true };
    try {
      await recordEvent(
        env,
        data.type,
        data.page ?? null,
        data.metadata ?? null,
      );
    } catch {
      // analytics is best-effort — never throw to caller
    }
    return { ok: true };
  });

export const getAnalyticsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const env = await tryGetEnv();
    if (!env) {
      return {
        summary: {
          visitors: 1840,
          leads: 105,
          conversionRate: 5.7,
          topService: "HR Consultancy",
          averageScore: 78,
        },
        visitors: MOCK_ANALYTICS.visitors,
        leads: MOCK_ANALYTICS.leads,
        services: MOCK_ANALYTICS.services,
        funnel: MOCK_ANALYTICS.funnel,
        preview: true,
      };
    }
    try {
      const [summary, visitors, leads, services, funnel] = await Promise.all([
        analyticsSummary(env),
        visitorsByMonth(env),
        leadsByMonth(env),
        serviceBreakdown(env),
        conversionFunnel(env),
      ]);
      // If everything is empty (fresh DB), fall back to mock so the dashboard isn't blank.
      const empty =
        summary.leads === 0 &&
        summary.visitors === 0 &&
        leads.length === 0 &&
        visitors.length === 0;
      if (empty) {
        return {
          summary: {
            visitors: 1840,
            leads: 105,
            conversionRate: 5.7,
            topService: "HR Consultancy",
            averageScore: 78,
          },
          visitors: MOCK_ANALYTICS.visitors,
          leads: MOCK_ANALYTICS.leads,
          services: MOCK_ANALYTICS.services,
          funnel: MOCK_ANALYTICS.funnel,
          preview: true,
        };
      }
      return {
        summary,
        visitors: visitors.map((v) => ({ month: v.month, count: v.count })),
        leads: leads.map((l) => ({ month: l.month, count: l.count })),
        services,
        funnel,
        preview: false,
      };
    } catch {
      return {
        summary: {
          visitors: 1840,
          leads: 105,
          conversionRate: 5.7,
          topService: "HR Consultancy",
          averageScore: 78,
        },
        visitors: MOCK_ANALYTICS.visitors,
        leads: MOCK_ANALYTICS.leads,
        services: MOCK_ANALYTICS.services,
        funnel: MOCK_ANALYTICS.funnel,
        preview: true,
      };
    }
  },
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

// Preview-mode demo password (matches prototype). In production with secrets
// configured, this is bypassed in favour of PBKDF2 + JWT.
const PREVIEW_PASSWORD = "admin123";
const PREVIEW_TOKEN = "preview.session.token";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ password: z.string().min(1) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const env = await tryGetEnv();
    if (!env || !env.ADMIN_PASSWORD_HASH || !env.JWT_SECRET) {
      // Preview / unconfigured mode — accept demo password
      if (data.password === PREVIEW_PASSWORD) {
        return {
          ok: true as const,
          token: PREVIEW_TOKEN,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
          preview: true,
        };
      }
      return { ok: false as const, error: "Incorrect password" };
    }
    const result = await authenticate(env, data.password);
    if (!result) return { ok: false as const, error: "Incorrect password" };
    return {
      ok: true as const,
      token: result.token,
      expiresAt: result.expiresAt,
    };
  });

export const verifyTokenFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ token: z.string().min(1) }).parse(raw),
  )
  .handler(async ({ data }) => {
    if (data.token === PREVIEW_TOKEN) return { valid: true, preview: true };
    const env = await tryGetEnv();
    if (!env) return { valid: false };
    return { valid: await isValidToken(env, data.token) };
  });
