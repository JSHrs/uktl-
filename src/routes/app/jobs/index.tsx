import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { PageHeader, Pill } from "@/components/app/AppLayout";
import { listJobsFn } from "@/lib/functions";

export const Route = createFileRoute("/app/jobs/")({
  loader: async () => await listJobsFn(),
  component: JobsListPage,
});

function JobsListPage() {
  const jobs = Route.useLoaderData();
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
