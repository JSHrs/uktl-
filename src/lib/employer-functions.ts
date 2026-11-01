import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestEnv } from "./server/request-env";
import { requireAdmin, requireStaff, requireViewer } from "./server/viewer";
import {
  closeEmployerRole,
  updateEmployerRole,
  createEmployerRole,
  decideShortlistEntry,
  getEmployerProfile,
  getEmployerRole,
  listEmployerRoles,
  saveEmployerProfile,
  staffGetEmployerRole,
  staffListEmployerRoles,
  staffPublishRole,
  staffSetRoleStatus,
  staffSetStaffNote,
  staffShareCandidate,
  staffUnshareCandidate,
} from "./server/employer-portal";

/*
 * Employer portal server functions. Employer handlers act only on the caller's own
 * rows (user id from the verified session). Staff handlers require verified staff
 * with MFA; publishing and closing (which create or close mandates) require admin.
 */

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));
const tags = (maxItems: number, maxLen = 80) =>
  z
    .array(z.string().trim().min(1).max(maxLen))
    .max(maxItems)
    .transform((a) => [...new Set(a)]);
const roleId = z.string().regex(/^er_[a-f0-9]{16}$/);

export const EmployerProfileSchema = z.object({
  company_name: text(200).min(1),
  job_title: optText(200),
  website: optText(300).refine((v) => !v || /^https?:\/\//i.test(v), "Start the website with https://"),
  headquarters: optText(100),
  company_size: z.enum(["1-50", "51-250", "251-1000", "1000+"]).nullable().optional(),
  sectors: tags(10),
  services: tags(5),
  hiring_markets: tags(10),
  hiring_volume: z.enum(["1-2", "3-5", "6-15", "15+"]).nullable().optional(),
});

export const EmployerRoleSchema = z.object({
  title: text(200).min(1),
  location: optText(200),
  sector: optText(100),
  seniority: z.enum(["junior", "mid", "senior", "lead", "executive"]).nullable().optional(),
  min_years_experience: z.number().min(0).max(50).nullable().optional(),
  salary: optText(100),
  description: optText(8000),
  must_have_skills: tags(30),
  nice_to_have_skills: tags(30),
});

async function requireEmployer() {
  const viewer = await requireViewer();
  if (!viewer.isEmployer || viewer.isStaff) throw new Error("An employer account is required");
  return viewer.userId!;
}

/* ───────────── Employer ───────────── */

export const myEmployerProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireEmployer();
  return getEmployerProfile(await getRequestEnv(), userId);
});

export const saveEmployerProfileFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => EmployerProfileSchema.parse(raw))
  .handler(async ({ data }) => {
    const userId = await requireEmployer();
    await saveEmployerProfile(await getRequestEnv(), userId, data);
    return { ok: true };
  });

export const myEmployerRolesFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireEmployer();
  return listEmployerRoles(await getRequestEnv(), userId);
});

export const myEmployerRoleFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: roleId }).parse(raw))
  .handler(async ({ data }) => {
    const userId = await requireEmployer();
    return getEmployerRole(await getRequestEnv(), userId, data.id);
  });

export const submitEmployerRoleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => EmployerRoleSchema.parse(raw))
  .handler(async ({ data }) => {
    const userId = await requireEmployer();
    return createEmployerRole(await getRequestEnv(), userId, data);
  });

export const updateEmployerRoleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => EmployerRoleSchema.extend({ id: roleId }).parse(raw))
  .handler(async ({ data }) => {
    const userId = await requireEmployer();
    const { id, ...input } = data;
    return updateEmployerRole(await getRequestEnv(), userId, id, input);
  });

export const closeEmployerRoleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: roleId }).parse(raw))
  .handler(async ({ data }) => {
    const userId = await requireEmployer();
    return closeEmployerRole(await getRequestEnv(), userId, data.id);
  });

export const decideShortlistFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: roleId,
        alias: z.string().regex(/^Candidate [A-Z]{1,2}$/),
        decision: z.enum(["interested", "declined", "pending"]),
        note: optText(1000),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const userId = await requireEmployer();
    return decideShortlistEntry(await getRequestEnv(), userId, data.id, data.alias, data.decision, data.note ?? null);
  });

/* ───────────── Staff ───────────── */

export const staffEmployerRolesFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ status: z.enum(["submitted", "live", "closed", "withdrawn"]).optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    return staffListEmployerRoles(await getRequestEnv(), data.status);
  });

export const staffEmployerRoleFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: roleId }).parse(raw))
  .handler(async ({ data }) => {
    await requireStaff();
    return staffGetEmployerRole(await getRequestEnv(), data.id);
  });

export const staffPublishEmployerRoleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ id: roleId, expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const viewer = await requireViewer();
    return staffPublishRole(await getRequestEnv(), data.id, viewer.userId!, data.expiryDate);
  });

export const staffSetEmployerRoleStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ id: roleId, status: z.enum(["closed", "withdrawn"]), note: optText(2000) }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const viewer = await requireViewer();
    return staffSetRoleStatus(await getRequestEnv(), data.id, data.status, data.note ?? null, viewer.userId!);
  });

export const staffSetEmployerRoleNoteFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: roleId, note: optText(2000) }).parse(raw))
  .handler(async ({ data }) => {
    await requireStaff();
    await staffSetStaffNote(await getRequestEnv(), data.id, data.note ?? null);
    return { ok: true };
  });

export const staffShareCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ id: roleId, candidateId: z.string().min(1).max(100), summary: text(2000).min(1) }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const viewer = await requireViewer();
    return staffShareCandidate(await getRequestEnv(), data.id, data.candidateId, data.summary, viewer.userId!);
  });

export const staffUnshareCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: roleId, candidateId: z.string().min(1).max(100) }).parse(raw))
  .handler(async ({ data }) => {
    await requireStaff();
    return staffUnshareCandidate(await getRequestEnv(), data.id, data.candidateId);
  });
