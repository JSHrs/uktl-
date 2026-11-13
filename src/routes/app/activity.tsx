import { useEffect, useState } from "react";
import { ReedApply } from "@/components/app/ReedApply";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app/AppLayout";
import { getCandidateSessionFn, getSwipeHistoryFn, undoSwipeFn } from "@/lib/functions";
export const Route = createFileRoute("/app/activity")({
  beforeLoad: async () => { if (!(await getCandidateSessionFn()).userId) throw redirect({to:"/auth/login"}); },
  loader: () => getSwipeHistoryFn({data:{}}), component: ActivityPage,
});
function ActivityPage() {
  const initial = Route.useLoaderData();
  const [items,setItems] = useState(initial.items);
  const [cursor,setCursor] = useState(initial.nextCursor);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [savedOnly,setSavedOnly] = useState(true);
  useEffect(()=>{setItems(initial.items);setCursor(initial.nextCursor);},[initial]);
  async function more() {
    if (!cursor || busy) return;
    setBusy(true);setError("");
    try {const page=await getSwipeHistoryFn({data:{cursor}});setItems(old=>[...old,...page.items.filter(i=>!old.some(o=>o.candidate_id===i.candidate_id && o.job_id===i.job_id))]);setCursor(page.nextCursor);}
    catch {setError("Unable to load more decisions. Please try again.");} finally {setBusy(false);}
  }
  async function undo(item:typeof items[number]) {
    setBusy(true);setError("");
    try {await undoSwipeFn({data:{candidateId:item.candidate_id,jobId:item.job_id,swipedAt:item.swiped_at}});setItems(old=>old.filter(i=>!(i.candidate_id===item.candidate_id&&i.job_id===item.job_id)));}
    catch (e) {setError(e instanceof Error ? e.message : "Unable to undo. Please retry.");} finally {setBusy(false);}
  }
  const shown = items.filter(item=>!savedOnly || item.action==='interested');
  return <div className="max-w-3xl">
    <PageHeader eyebrow="My account" title="Your interests" lede="Roles you've said you're interested in, newest first. Expressing interest lets a UK Talent Link consultant review your profile for that role; it doesn't send an application to an employer." actions={<Link to="/app/discover" className="min-h-10 inline-flex items-center rounded-full border border-rule px-4 text-[13px] hover:border-ink">Find more roles</Link>} />
    {error && <p role="alert" className="text-bad my-4">{error}</p>}
    <label className="inline-flex gap-2.5 items-center min-h-11 text-sm text-ink-soft"><input type="checkbox" className="h-4 w-4 accent-[var(--ink)]" checked={savedOnly} onChange={e=>setSavedOnly(e.target.checked)} />Show saved jobs only</label>
    {!shown.length && <div className="mt-4"><EmptyState title={items.length ? "No saved roles in this view" : "No roles saved yet"} body={items.length ? "Untick the box above to see roles you dismissed as well." : "When you say you're interested in a role, it appears here and a consultant can review your profile for it."} action={<Link to="/app/discover" className="min-h-10 inline-flex items-center rounded-full bg-ink text-paper px-5 text-[13px]">See your job matches</Link>} /></div>}
    <ul className="my-6 space-y-4">{shown.map(item=><li key={`${item.candidate_id}:${item.job_id}`} className="border border-rule rounded p-5">
      <div className="text-sm text-ink-mute">{item.action === "interested" ? "Interested" : "Dismissed"} · {new Date(item.swiped_at).toISOString().slice(0,10)}{item.status !== "open" && " · Role closed"}</div>
      <Link to="/app/jobs/$id" params={{id:item.job_id}} className="font-display text-2xl underline">{item.title}</Link>
      <p className="text-ink-soft my-2">{item.company ?? "Confidential"}{item.location ? ` · ${item.location}` : ""}</p>
      <ReedApply job={item} />
      <button disabled={busy} onClick={()=>undo(item)} className="underline text-sm disabled:opacity-50">{item.action === "interested" ? "Withdraw interest" : "Undo dismissal"}</button>
    </li>)}</ul>
    {cursor && <button disabled={busy} onClick={more} className="border border-rule rounded px-5 py-2">{busy ? "Loading…" : "Load more"}</button>}
  </div>;
}
