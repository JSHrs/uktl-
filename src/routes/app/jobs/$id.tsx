import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, Pill, ScoreBar, Section } from "@/components/app/AppLayout";
import { getJobDetailFn } from "@/lib/server/functions";

export const Route = createFileRoute("/app/jobs/$id")({
  loader: async ({ params }) => {
    const detail = await getJobDetailFn({ data: { id: params.id } });
    if (!detail) throw notFound();
    return detail;
  },
  component: JobDetailPage,
});

function JobDetailPage() {
  const { job, matches } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow={`Mandate — ${job.sector ?? "—"}`}
        title={
          <>
            {job.title}
            {job.location && (
              <span className="ml-4 text-ink-soft italic font-normal text-3xl">
                {job.location}
              </span>
            )}
          </>
        }
        lede={
          job.company
            ? `${job.company} · ${job.seniority ?? ""}`
            : `Confidential · ${job.seniority ?? ""}`
        }
      />

      <div className="grid md:grid-cols-[2fr_1fr] gap-10">
        <div>
          {job.description && (
            <Section title="Brief">
              <p className="text-sm leading-[1.65] text-ink-soft max-w-[68ch]">
                {job.description}
              </p>
            </Section>
          )}

          <Section title="Must-haves">
            <div className="flex flex-wrap gap-1.5">
              {job.must_have_skills.map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
            </div>
          </Section>

          {job.nice_to_have_skills.length > 0 && (
            <Section title="Nice-to-haves">
              <div className="flex flex-wrap gap-1.5">
                {job.nice_to_have_skills.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>
            </Section>
          )}

          <Section title={`Shortlist (${matches.length})`}>
            {matches.length === 0 ? (
              <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft">
                No scored candidates yet. Upload a CV and this mandate will be
                ranked automatically.
              </div>
            ) : (
              <div className="border border-rule rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-paper-deep text-ink-mute">
                      <Th>Candidate</Th>
                      <Th className="w-48">Score</Th>
                      <Th>Matched</Th>
                      <Th>Gaps</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr
                        key={m.candidate_id}
                        className="border-t border-rule hover:bg-paper-deep/40"
                      >
                        <Td>
                          <Link
                            to="/app/candidates/$id"
                            params={{ id: m.candidate_id }}
                            className="text-ink hover:underline font-medium"
                          >
                            {m.candidate.name ?? "(unnamed)"}
                          </Link>
                          {m.candidate.headline && (
                            <div className="text-xs text-ink-mute mt-0.5">
                              {m.candidate.headline}
                            </div>
                          )}
                        </Td>
                        <Td>
                          <ScoreBar value={m.score} />
                        </Td>
                        <Td className="text-xs text-ink-soft">
                          {m.matched_skills.slice(0, 4).join(", ") || "—"}
                        </Td>
                        <Td className="text-xs text-ink-mute">
                          {m.missing_skills.slice(0, 3).join(", ") || "—"}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          <div className="border border-rule rounded-md p-6 bg-paper text-sm space-y-3">
            <Detail label="Seniority" value={job.seniority} />
            <Detail
              label="Min. experience"
              value={
                job.min_years_experience != null
                  ? `${job.min_years_experience} yrs`
                  : null
              }
            />
            <Detail label="Location" value={job.location} />
            <Detail label="Sector" value={job.sector} />
            <Detail label="Status" value={<Pill tone="good">{job.status}</Pill>} />
          </div>
        </aside>
      </div>
    </>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-left font-mono text-[11px] tracking-[0.12em] uppercase px-4 py-3 text-ink-mute font-normal ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-6">
      <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute">
        {label}
      </span>
      <span className="text-right">
        {value == null || value === "" ? (
          <span className="text-ink-mute">—</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
