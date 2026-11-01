import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { RoleStatusPill } from "@/components/app/EmployerForms";
import {
  staffEmployerRoleFn,
  staffPublishEmployerRoleFn,
  staffSetEmployerRoleNoteFn,
  staffSetEmployerRoleStatusFn,
  staffShareCandidateFn,
  staffUnshareCandidateFn,
} from "@/lib/employer-functions";
import { rankCandidatesFn } from "@/lib/job-functions";
import { AdminBtn, AdminHeader } from "../../admin";

export const Route = createFileRoute("/admin/employer-roles/$id")({
  loader: async ({ params }) => {
    if (!/^er_[a-f0-9]{16}$/.test(params.id)) throw notFound();
    const found = await staffEmployerRoleFn({ data: { id: params.id } });
    if (!found) throw notFound();
    const ranking = found.role.status === "live" && found.role.job_id
      ? await rankCandidatesFn({ data: { jobId: found.role.job_id, limit: 25 } }).catch(() => null)
      : null;
    return { ...found, ranking };
  },
  component: StaffEmployerRole,
});

const DECISION = { pending: "Awaiting employer", interested: "Employer wants to meet", declined: "Employer declined" } as const;

function StaffEmployerRole() {
  const { role, company, shortlist, ranking } = Route.useLoaderData();
  const { staffRole } = Route.useRouteContext();
  const isAdmin = staffRole === "admin";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [note, setNote] = useState(role.staff_note ?? "");
  const [sharing, setSharing] = useState<{ id: string; name: string } | null>(null);
  const [summary, setSummary] = useState("");
  const sharedIds = new Set(shortlist.map((s) => s.candidate_id));

  async function act(fn: () => Promise<unknown>, done: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="mb-4 text-[13px]">
        <Link to="/admin/employer-roles" className="text-ink-mute hover:text-ink">← Employer roles</Link>
      </p>
      <AdminHeader
        title={role.title}
        sub={[company?.company_name ?? "No company details", role.owner_email, role.location].filter(Boolean).join(" · ")}
        actions={<RoleStatusPill status={role.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="border border-rule rounded-md p-5 text-sm space-y-3">
          <h2 className="font-display text-xl">Brief</h2>
          <p><b>Must-haves:</b> {role.must_have_skills.join(", ") || "None"}</p>
          <p><b>Nice-to-haves:</b> {role.nice_to_have_skills.join(", ") || "None"}</p>
          <p><b>Seniority:</b> {role.seniority ?? "Not given"} · <b>Min. years:</b> {role.min_years_experience ?? "Not given"} · <b>Sector:</b> {role.sector ?? "Not given"}</p>
          <p><b>Salary or package:</b> {role.salary ?? "Not given"}</p>
          {role.description && <p className="whitespace-pre-line text-ink-soft">{role.description}</p>}
          {company && (
            <div className="pt-3 border-t border-rule text-ink-soft">
              <b className="text-ink">{company.company_name}</b>
              {company.contact_title && ` · contact: ${company.contact_title}`}
              {company.website && (
                <>
                  {" · "}
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="underline">{company.website}</a>
                </>
              )}
              <br />
              {[company.headquarters, company.company_size && `${company.company_size} staff`, company.sectors.join(", "), company.services.join(", "), company.hiring_markets.length ? `hiring in ${company.hiring_markets.join(", ")}` : null, company.hiring_volume && `${company.hiring_volume} roles a year`]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </section>

        <section className="border border-rule rounded-md p-5 text-sm space-y-4">
          <h2 className="font-display text-xl">Review</h2>
          {role.status === "submitted" && (
            isAdmin ? (
              <div className="space-y-2">
                <label className="block">
                  <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">Closing date (optional)</span>
                  <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1 w-full border border-rule rounded px-3 py-2 bg-paper" />
                </label>
                <AdminBtn variant="primary" disabled={busy} onClick={() => act(() => staffPublishEmployerRoleFn({ data: { id: role.id, expiryDate: expiry || null } }), "Published as a mandate")}>
                  Publish as mandate
                </AdminBtn>
              </div>
            ) : (
              <p className="text-ink-soft">An administrator publishes submitted roles.</p>
            )
          )}
          {role.job_id && (
            <p>
              Mandate:{" "}
              <Link to="/admin/jobs/$id" params={{ id: role.job_id }} className="underline">
                open the pipeline
              </Link>
            </p>
          )}
          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">Note shown to the employer</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} className="mt-1 w-full border border-rule rounded px-3 py-2 bg-paper" />
          </label>
          <div className="flex flex-wrap gap-2">
            <AdminBtn disabled={busy} onClick={() => act(() => staffSetEmployerRoleNoteFn({ data: { id: role.id, note: note.trim() || null } }), "Note saved")}>
              Save note
            </AdminBtn>
            {isAdmin && (role.status === "submitted" || role.status === "live") && (
              <AdminBtn
                variant="danger"
                disabled={busy}
                onClick={() => {
                  if (confirm("Close this role? Its mandate closes too and the employer sees it as closed.")) act(() => staffSetEmployerRoleStatusFn({ data: { id: role.id, status: "closed", note: note.trim() || null } }), "Role closed");
                }}
              >
                Close role
              </AdminBtn>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl mb-1">Shared with the employer</h2>
        <p className="text-sm text-ink-soft mb-4">The employer sees the alias, your summary, the score and the matched/missing skills. Never the name, contact details or CV.</p>
        {shortlist.length === 0 ? (
          <p className="text-sm text-ink-mute">Nobody shared yet.</p>
        ) : (
          <ul className="space-y-3">
            {shortlist.map((s) => (
              <li key={s.candidate_id} className="border border-rule rounded-md p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <b>{s.alias}</b> ={" "}
                    <Link to="/app/candidates/$id" params={{ id: s.candidate_id }} className="underline">
                      {s.candidate_name ?? s.candidate_id}
                    </Link>
                    {s.score != null && <span className="text-ink-mute"> · score {s.score}</span>}
                  </div>
                  <span className={s.decision === "interested" ? "text-accent font-medium" : "text-ink-mute"}>{DECISION[s.decision]}</span>
                </div>
                <p className="mt-2 text-ink-soft whitespace-pre-line">{s.summary}</p>
                {s.note && <p className="mt-2"><b>Employer note:</b> {s.note}</p>}
                <div className="mt-3">
                  <AdminBtn variant="danger" disabled={busy} onClick={() => act(() => staffUnshareCandidateFn({ data: { id: role.id, candidateId: s.candidate_id } }), "Removed from the employer's view")}>
                    Stop sharing
                  </AdminBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {role.status === "live" && (
        <section className="mt-10">
          <h2 className="font-display text-2xl mb-1">Ranked candidates</h2>
          <p className="text-sm text-ink-soft mb-4">
            From the rules-based ranking of every parsed CV against this mandate. Speak to a candidate before sharing them.
          </p>
          {!ranking ? (
            <p className="text-sm text-ink-mute">Ranking is unavailable right now.</p>
          ) : ranking.candidates.length === 0 ? (
            <p className="text-sm text-ink-mute">No parsed CVs match yet.</p>
          ) : (
            <ul className="divide-y divide-rule border border-rule rounded-md">
              {ranking.candidates.map((c) => (
                <li key={c.id} className="p-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="w-10 text-right font-display text-lg tabular-nums text-accent">{c.score}</span>
                  <div className="flex-1 min-w-[200px]">
                    <Link to="/app/candidates/$id" params={{ id: c.id }} className="font-medium underline">{c.name ?? c.id}</Link>
                    <div className="text-[12px] text-ink-mute">
                      {[c.headline, c.location, c.qualified ? "Qualified" : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {sharedIds.has(c.id) ? (
                    <span className="text-[12px] text-ink-mute">Shared</span>
                  ) : (
                    <AdminBtn disabled={busy} onClick={() => { setSharing({ id: c.id, name: c.name ?? c.id }); setSummary(""); }}>
                      Share…
                    </AdminBtn>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {sharing && (
        <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="fixed inset-0 z-[200] bg-ink/40 grid place-items-center p-4">
          <form
            className="w-full max-w-lg bg-paper border border-rule rounded-lg p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const target = sharing;
              act(() => staffShareCandidateFn({ data: { id: role.id, candidateId: target.id, summary: summary.trim() } }), "Shared with the employer").then(() => setSharing(null));
            }}
          >
            <h2 id="share-title" className="font-display text-xl">Share {sharing.name}</h2>
            <p className="text-sm text-ink-soft">
              Write the summary the employer will see. Don't include the name, employer names that identify them, contact details or anything sensitive.
            </p>
            <textarea
              required
              autoFocus
              rows={5}
              maxLength={2000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border border-rule rounded px-3 py-2 bg-paper text-sm"
              placeholder="e.g. Eight years in Gulf treasury and FP&A; led a group reporting rebuild; three-month notice."
            />
            <div className="flex justify-end gap-2">
              <AdminBtn onClick={() => setSharing(null)}>Cancel</AdminBtn>
              <AdminBtn type="submit" variant="primary" disabled={busy || !summary.trim()}>Share with employer</AdminBtn>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
