import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuthenticatedSupabase } from "./supabase";
import { readStaffAccess } from "./server/staff-access";
import { getRequestEnv } from "./server/request-env";
import { requireViewer } from "./server/viewer";
export const chooseAccountRoleFn = createServerFn({method:"POST"})
  .inputValidator((raw:unknown)=>z.object({role:z.enum(["candidate","employer"])}).parse(raw))
  .handler(async({data})=>{
    const viewer=await requireViewer();
    const {client}=await getAuthenticatedSupabase();
    if ((await readStaffAccess(client)).role) throw new Error("Staff membership is managed by the administrator");
    const {error}=await client.from("account_roles").upsert({user_id:viewer.userId,role:data.role});
    if(error)throw new Error("Account type could not be saved");
    return {role:data.role};
  });
export const cvHistoryFn = createServerFn({method:"GET"}).handler(async()=>{
  const viewer=await requireViewer();
  if(viewer.isEmployer && !viewer.isStaff) throw new Error("Candidate account required");
  const env=await getRequestEnv();
  const result=await env.DB.prepare(`SELECT id,source_filename,created_at,status FROM candidates WHERE auth_user_id=? ORDER BY created_at DESC,id DESC LIMIT 100`).bind(viewer.userId)
    .all<{id:string;source_filename:string|null;created_at:number;status:string}>();
  return (result.results??[]).map(r=>({...r,created_at:Number(r.created_at)}));
});

/**
 * Completes an employer sign-up that went through Google or Apple. Only an account
 * that has never chosen a type and has no CV records becomes an employer, so signing
 * in from the employer page can never convert an existing candidate account.
 */
export const claimEmployerAccountFn = createServerFn({method:"POST"}).handler(async()=>{
  const viewer=await requireViewer();
  const {client}=await getAuthenticatedSupabase();
  if ((await readStaffAccess(client)).role) return {role:"candidate" as const, changed:false, reason:"staff" as const};
  const {data:existing,error:readError}=await client.from("account_roles").select("role").eq("user_id",viewer.userId).maybeSingle();
  if(readError)throw new Error("Account type could not be checked");
  if(existing) return {role:existing.role==="employer"?"employer" as const:"candidate" as const, changed:false, reason:"existing" as const};
  const env=await getRequestEnv();
  const cv=await env.DB.prepare(`SELECT COUNT(*) AS n FROM candidates WHERE auth_user_id=?`).bind(viewer.userId).first<{n:number}>();
  if(Number(cv?.n??0)>0) return {role:"candidate" as const, changed:false, reason:"has_cv" as const};
  const {error}=await client.from("account_roles").insert({user_id:viewer.userId,role:"employer"});
  if(error)throw new Error("Account type could not be saved");
  return {role:"employer" as const, changed:true, reason:null};
});
