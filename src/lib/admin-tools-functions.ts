import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestEnv as getEnv } from "./server/request-env";
import { requireAdmin, requireStaff, requireViewer } from "./server/viewer";
import { getCandidateSession } from "./supabase";
import { enforceRateLimit } from "./server/ratelimit";
import { chartData, sendCandidateMessage, listCandidateMessages, outreachRecipient } from "./server/admin-tools";

export const adminChartsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return chartData(await getEnv());
});

const candidateId = z.string().min(1).max(100);

/** Outreach context for the staff candidate view: recipient, history and the candidate's mandates. */
export const candidateOutreachFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ candidateId }).strict().parse(raw))
  .handler(async ({ data }) => {
    await requireStaff();
    const env = await getEnv();
    const session = await getCandidateSession();
    const [recipient, messages, roles] = await Promise.all([
      outreachRecipient(env, data.candidateId),
      listCandidateMessages(env, data.candidateId),
      env.DB.prepare(
        `SELECT j.id,j.title,j.company,m.stage FROM matches m JOIN jobs j ON j.id=m.job_id
          WHERE m.candidate_id=? ORDER BY m.score DESC LIMIT 30`,
      )
        .bind(data.candidateId)
        .all<{ id: string; title: string; company: string | null; stage: string }>(),
    ]);
    return {
      recipient,
      messages,
      roles: roles.results ?? [],
      consultant: session.email ?? "",
      siteUrl: env.SITE_URL ?? "",
    };
  });

export const sendCandidateMessageFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        candidateId,
        jobId: z.string().max(100).optional(),
        template: z.enum(["role_intro", "interview_invite", "follow_up", "not_progressing", "custom"]),
        subject: z.string().trim().min(3).max(200).refine((s) => !/[\r\n]/.test(s), "Subject must be one line"),
        body: z.string().trim().min(20).max(8000),
      })
      .strict()
      .parse(raw),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const viewer = await requireViewer(),
      session = await getCandidateSession(),
      env = await getEnv();
    await enforceRateLimit(env, "candidateOutreach", viewer.userId!);
    return sendCandidateMessage(env, { ...data, sentBy: viewer.userId!, replyTo: session.email });
  });
