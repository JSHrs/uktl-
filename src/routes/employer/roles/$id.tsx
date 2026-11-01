import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Section } from "@/components/app/AppLayout";
import { ROLE_STATUS, RoleForm, RoleStatusPill, SENIORITY } from "@/components/app/EmployerForms";
import { closeEmployerRoleFn, decideShortlistFn, myEmployerRoleFn, updateEmployerRoleFn } from "@/lib/employer-functions";

export const Route = createFileRoute("/employer/roles/$id")({
  loader: async ({ params }) => {
    if (!/^er_[a-f0-9]{16}$/.test(params.id)) throw notFound();
    const found = await myEmployerRoleFn({ data: { id: params.id } });
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.role.title ?? "Role"} — UK Talent Link` }] }),
  notFoundComponent: () => (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Role not found</h1>
      <p className="mt-3 text-ink-soft">It may have been removed, or it belongs to another account.</p>
      <Link to="/employer" className="mt-5 inline-block underline">Back to your roles</Link>
    </div>
  ),
  component: RolePage,
});

const DECISION_LABEL = { pending: "Awaiting you", interested: "You'd like to meet", declined: "Not for us" } as const;

function RolePage() {
  const { role, shortlist } = Route.useLoaderData();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const seniority = SENIORITY.find((s) => s.value === role.seniority)?.label;
  const facts = [role.location, role.sector, seniority, role.min_years_experience != null ? `${role.min_years_experience}+ years` : null].filter(Boolean);

  async function close() {
    const verb = role.status === "submitted" ? "Withdraw" : "Close";
    if (!confirm(`${verb} "${role.title}"? Your consultant will stop the search.`)) return;
    setClosing(true);
    try {
      await closeEmployerRoleFn({ data: { id: role.id } });
      toast(role.status === "submitted" ? "Role withdrawn" : "Search closed");
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the role");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <p className="mb-4 text-[13px]">
        <Link to="/employer" className="text-ink-mute hover:text-ink">← Your roles</Link>
      </p>
      <PageHeader
        eyebrow={facts.join(" · ") || "Role"}
        title={role.title}
        lede={ROLE_STATUS[role.status]?.help}
        actions={
          <>
            <RoleStatusPill status={role.status} />
            {role.status === "submitted" && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="min-h-10 rounded-full border border-rule px-4 text-[13px] hover:border-ink">
                Edit
              </button>
            )}
            {(role.status === "submitted" || role.status === "live") && (
              <button type="button" disabled={closing} onClick={close} className="min-h-10 rounded-full border border-rule px-4 text-[13px] hover:border-ink">
                {role.status === "submitted" ? "Withdraw" : "Close search"}
              </button>
            )}
          </>
        }
      />

      {editing ? (
        <RoleForm
          initial={role}
          submitLabel="Save changes"
          secondary={
            <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-full border border-rule px-5 text-[14px]">
              Cancel
            </button>
          }
          onSubmit={async (v) => {
            await updateEmployerRoleFn({ data: { id: role.id, ...v } });
            toast.success("Role updated");
            setEditing(false);
            await router.invalidate();
          }}
        />
      ) : (
        <>
          {role.staff_note && (
            <div className="mb-6 rounded-lg border border-rule bg-paper-deep p-4 text-[14px]">
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">From your consultant</span>
              <p className="mt-1 text-ink">{role.staff_note}</p>
            </div>
          )}

          <Section title={`Shared candidates${shortlist.length ? ` (${shortlist.length})` : ""}`}>
            {shortlist.length === 0 ? (
              <div className="rounded-lg border border-dashed border-rule p-6 text-[14px] text-ink-soft">
                {role.status === "live"
                  ? "Your consultant is searching. Candidates will appear here, with the reasons for each, as they're assessed."
                  : role.status === "submitted"
                    ? "Once a consultant has reviewed the brief, the search starts and candidates will appear here."
                    : "No candidates were shared on this role."}
              </div>
            ) : (
              <ul className="space-y-4">
                {shortlist.map((c) => (
                  <ShortlistCard key={c.alias} roleId={role.id} entry={c} live={role.status === "live"} />
                ))}
              </ul>
            )}
            {shortlist.length > 0 && (
              <p className="mt-4 text-[12px] text-ink-mute max-w-[68ch]">
                Candidates are anonymous until you'd like to meet. Your consultant then introduces them, with their agreement.
                Scores are a guide from the rules-based matcher, not a hiring decision.
              </p>
            )}
          </Section>

          <Section title="The brief">
            <dl className="grid gap-4 sm:grid-cols-2 text-[14px]">
              <Fact label="Must-have skills" value={role.must_have_skills.join(", ") || "None listed"} />
              <Fact label="Nice-to-have skills" value={role.nice_to_have_skills.join(", ") || "None listed"} />
              <Fact label="Salary or package" value={role.salary ?? "Not given"} />
              <Fact label="Posted" value={new Date(role.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
            </dl>
            {role.description && <p className="mt-5 text-[14px] text-ink-soft whitespace-pre-line max-w-[70ch]">{role.description}</p>}
          </Section>
        </>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

type Entry = {
  alias: string;
  summary: string;
  score: number | null;
  strengths: string[];
  gaps: string[];
  decision: "pending" | "interested" | "declined";
  note: string | null;
};

function ShortlistCard({ roleId, entry, live }: { roleId: string; entry: Entry; live: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState(entry.note ?? "");
  const [busy, setBusy] = useState(false);

  async function decide(decision: Entry["decision"]) {
    setBusy(true);
    try {
      await decideShortlistFn({ data: { id: roleId, alias: entry.alias, decision, note: note.trim() || null } });
      toast.success(decision === "interested" ? "Your consultant will arrange an introduction" : decision === "declined" ? "Noted" : "Response cleared");
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your response");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-lg border border-rule p-5 bg-paper">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-accent-soft text-accent grid place-items-center font-display">{entry.alias.replace("Candidate ", "")}</span>
          <div>
            <h3 className="font-medium text-ink">{entry.alias}</h3>
            <span className="text-[12px] text-ink-mute">{DECISION_LABEL[entry.decision]}</span>
          </div>
        </div>
        {entry.score != null && (
          <div className="text-right">
            <div className="font-display text-3xl text-accent tabular-nums leading-none">{entry.score}</div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">Match score</div>
          </div>
        )}
      </div>
      <p className="mt-4 text-[14px] text-ink whitespace-pre-line">{entry.summary}</p>
      {(entry.strengths.length > 0 || entry.gaps.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-[13px]">
          {entry.strengths.length > 0 && (
            <div>
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">Matches your brief</span>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {entry.strengths.map((s) => (
                  <li key={s} className="rounded-full border border-accent/25 bg-accent-soft text-accent px-2.5 py-0.5">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {entry.gaps.length > 0 && (
            <div>
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">Gaps</span>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {entry.gaps.map((s) => (
                  <li key={s} className="rounded-full border border-warn-bd bg-warn-bg text-warn px-2.5 py-0.5">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {live && (
        <div className="mt-5 border-t border-rule pt-4 grid gap-3">
          <label htmlFor={`note-${entry.alias}`} className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">
            Note for your consultant (optional)
          </label>
          <input
            id={`note-${entry.alias}`}
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-rule rounded-md px-3 py-2 text-sm bg-paper"
            placeholder="e.g. Available for a call on Thursday"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => decide("interested")} className={`min-h-10 rounded-full px-4 text-[13px] ${entry.decision === "interested" ? "bg-accent text-paper" : "bg-ink text-paper"}`}>
              I'd like to meet
            </button>
            <button type="button" disabled={busy} onClick={() => decide("declined")} className={`min-h-10 rounded-full border px-4 text-[13px] ${entry.decision === "declined" ? "border-ink" : "border-rule"}`}>
              Not for us
            </button>
            {entry.decision !== "pending" && (
              <button type="button" disabled={busy} onClick={() => decide("pending")} className="min-h-10 px-2 text-[13px] underline text-ink-mute">
                Clear response
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
