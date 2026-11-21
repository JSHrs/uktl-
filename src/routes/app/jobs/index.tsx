import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { EmptyState, PageHeader, Pill } from "@/components/app/AppLayout";
import { z } from "zod";
import { filterJobs } from "@/lib/job-search";
import { listJobsFn } from "@/lib/functions";

export const Route = createFileRoute("/app/jobs/")({
  validateSearch: (s) => z.object({ q: z.string().optional(), location: z.string().optional() }).parse(s),
  loader: async () => await listJobsFn(),
  component: JobsListPage,
});

function JobsListPage() {
  const allJobs = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const jobs = filterJobs(allJobs, search.q ?? "", search.location ?? "");
  const { session } = useRouteContext({ from: "__root__" });
  const isStaff = session.isStaff;

  return (
    <>
      <PageHeader
        eyebrow={isStaff ? "Mandates" : "Jobs"}
        title={
          <>
            {isStaff ? "Live" : "Open"}{" "}
            <em className="not-italic italic font-normal text-ink-soft">
              {isStaff ? "searches" : "roles"}
            </em>
          </>
        }
        lede={
          isStaff
            ? "Each mandate lists its must-haves, nice-to-haves, and seniority target. Open one to see the ranked shortlist and move candidates through the pipeline."
            : "Every role UK Talent Link is currently recruiting for. Your CV is matched against each one automatically."
        }
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">Role, company or skill
          <input type="search" placeholder="e.g. Quantity Surveyor" value={search.q ?? ""} onChange={e => void navigate({ search: { ...search, q: e.target.value || undefined }, replace: true })} className="block w-full border border-rule rounded-md px-4 py-3 mt-1.5 bg-paper text-sm text-ink font-sans normal-case tracking-normal placeholder:text-ink-mute focus:outline-none focus:border-ink" />
        </label>
        <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">Location
          <input type="search" placeholder="e.g. Dubai" value={search.location ?? ""} onChange={e => void navigate({ search: { ...search, location: e.target.value || undefined }, replace: true })} className="block w-full border border-rule rounded-md px-4 py-3 mt-1.5 bg-paper text-sm text-ink font-sans normal-case tracking-normal placeholder:text-ink-mute focus:outline-none focus:border-ink" />
        </label>
      </div>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <p role="status" className="text-sm text-ink-soft">{jobs.length} {jobs.length === 1 ? "role" : "roles"} found</p>
        {!isStaff && jobs.length > 0 && <Link to="/app/discover" search={search} className="text-sm underline">Swipe these roles →</Link>}
      </div>
      {jobs.length === 0 && (
        <EmptyState
          title={search.q || search.location ? "No roles match those filters" : "No open roles right now"}
          body={search.q || search.location ? "Try another skill or location, or clear the filters." : isStaff ? "Add a mandate in the admin area and it appears here." : "New roles are added as we take them on. Upload your CV and you're matched automatically when they arrive."}
          action={!isStaff && !(search.q || search.location) ? <Link to="/app/upload" className="min-h-10 inline-flex items-center rounded-full bg-ink text-paper px-5 text-[13px]">Upload your CV</Link> : undefined}
        />
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {jobs.map((j) => (
          <Link
            key={j.id}
            to="/app/jobs/$id"
            params={{ id: j.id }}
            className="border border-rule rounded-md p-6 hover:border-ink transition-colors bg-paper"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl">{j.title}</div>
                <div className="text-sm text-ink-soft mt-0.5">
                  {j.company ?? "Confidential"} · {j.location ?? "—"}
                </div>
              </div>
              <Pill>{j.seniority ?? "open"}</Pill>
            </div>
            {j.description && (
              <p className="text-sm text-ink-soft mt-4 leading-[1.55] line-clamp-3">
                {j.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {j.must_have_skills.slice(0, 5).map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-mono tracking-[0.1em] uppercase text-ink-mute">
              <span>{j.sector ?? ""}</span>
              <span>
                {j.min_years_experience != null
                  ? `${j.min_years_experience}+ yrs`
                  : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
