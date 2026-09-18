import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
export const StaffAccessSchema = z.object({ role: z.enum(["admin", "consultant"]).nullable(), mfa_verified: z.boolean() });
export type StaffAccess = z.infer<typeof StaffAccessSchema>;
export const NO_STAFF_ACCESS: StaffAccess = { role: null, mfa_verified: false };
export async function readStaffAccess(client: Pick<SupabaseClient, "rpc">): Promise<StaffAccess> {
  const { data, error } = await client.rpc("get_my_staff_access");
  const result = StaffAccessSchema.safeParse(data);
  if (error || !result.success) throw new Error("Staff access verification unavailable");
  return result.data;
}
export function hasStaffAccess(access: StaffAccess, adminOnly = false): boolean {
  return access.mfa_verified && (adminOnly ? access.role === "admin" : access.role !== null);
}
