import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { adminCreateJobFn, adminUpdateJobFn } from "@/lib/functions";
import { adminListJobsFn } from "@/lib/functions";
import type { Job } from "@/lib/schemas/job";
import {
  AdminHeader, AdminField, AdminBtn,
  inputCls, textareaCls, selectCls,
} from "../../admin";

export const Route = createFileRoute("/admin/jobs/$id")({
  loader: async ({ params }) => {
    const jobs = await adminListJobsFn();
    const job = jobs.find((j) => j.id === params.id);
    if (!job) throw notFound();
    return job;
  },
  component: EditJobPage,
});

function EditJobPage() {
  const job = Route.useLoaderData();
  return <JobForm mode="edit" initial={job} />;
}

export function JobForm({ mode, initial }: { mode: "create" | "edit"; initial?: Job }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [sector, setSector] = useState(initial?.sector ?? "");
  const [seniority, setSeniority] = useState<string>(initial?.seniority ?? "mid");
  const [minYears, setMinYears] = useState(initial?.min_years_experience?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [mustHave, setMustHave] = useState((initial?.must_have_skills ?? []).join(", "));
  const [niceToHave, setNiceToHave] = useState((initial?.nice_to_have_skills ?? []).join(", "));
  const [status, setStatus] = useState<"open" | "closed">(initial?.status ?? "open");

  function parseSkills(raw: string): string[] {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      title,
      company: company || null,
      location: location || null,
      sector: sector || null,
      seniority: seniority || null,
      min_years_experience: minYears ? parseInt(minYears, 10) : null,
      description: description || null,
      must_have_skills: parseSkills(mustHave),
      nice_to_have_skills: parseSkills(niceToHave),
      status,
    };
    try {
      if (mode === "create") {
        await adminCreateJobFn({ data: payload });
      } else {
        await adminUpdateJobFn({ data: { id: initial!.id, ...payload } });
      }
      await navigate({ to: "/admin/jobs" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <>
      <AdminHeader
        title={mode === "create" ? "Add mandate" : "Edit mandate"}
        sub={mode === "edit" ? initial?.title : undefined}
      />
      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Title">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Senior Solicitor" />
          </AdminField>
          <AdminField label="Company">
            <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Cranbrook Legal" />
          </AdminField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Location">
            <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="London, UK" />
          </AdminField>
          <AdminField label="Sector">
            <input className={inputCls} value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Legal, Finance, Tech…" />
          </AdminField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Seniority">
            <select className={selectCls} value={seniority} onChange={(e) => setSeniority(e.target.value)}>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="director">Director</option>
            </select>
          </AdminField>
          <AdminField label="Min. years experience">
            <input className={inputCls} type="number" min={0} value={minYears} onChange={(e) => setMinYears(e.target.value)} placeholder="3" />
          </AdminField>
        </div>

        <AdminField label="Description">
          <textarea className={textareaCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Role overview, responsibilities, requirements…" />
        </AdminField>

        <AdminField label="Must-have skills" hint="Comma-separated — used for CV matching and scoring.">
          <input className={inputCls} value={mustHave} onChange={(e) => setMustHave(e.target.value)} placeholder="Contract review, GDPR, Employment law…" />
        </AdminField>

        <AdminField label="Nice-to-have skills" hint="Comma-separated — optional bonus skills.">
          <input className={inputCls} value={niceToHave} onChange={(e) => setNiceToHave(e.target.value)} placeholder="Arbitration, International law…" />
        </AdminField>

        <AdminField label="Status">
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as "open" | "closed")}>
            <option value="open">Open — active in matching and discovery</option>
            <option value="closed">Closed — hidden from candidates</option>
          </select>
        </AdminField>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <AdminBtn variant="primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create mandate" : "Save changes"}
          </AdminBtn>
          <AdminBtn onClick={() => navigate({ to: "/admin/jobs" })}>Cancel</AdminBtn>
        </div>
      </form>
    </>
  );
}
