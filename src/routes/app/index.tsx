import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  Pill,
  ScoreBar,
  Section,
  StatCard,
  StatusPill,
} from "@/components/app/AppLayout";
import { listCandidatesFn, listJobsFn } from "@/lib/server/functions";

export const Route = createFileRoute("/app/")({
  loader: async () => {
    const [candidates, jobs] = await Promise.all([
      listCandidatesFn(),
      listJobsFn(),
    ]);
    return { candidates, jobs };
  },
  component: OverviewPage,
});

function OverviewPage() {
  const { candidates, jobs } = Route.useLoaderData();

  const parsed = candidates.filter((c) => c.status === "parsed");
  const pending = candidates.filter(
    (c) => c.status === "uploaded" || c.status === "parsing",
  );
  const failed = candidates.filter((c) => c.status === "failed");
  const avgQuality =
    parsed.length === 0
      ? null
      : Math.round(
          parsed.reduce((acc, c) => acc + (c.quality_score ?? 0), 0) / parsed.length,
        );
  const recent = candidates.slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={
          <>
            Today's <em className="not-italic italic font-normal text-ink-soft">pipeline</em>
          </>
        }
        lede="Every CV uploaded here is parsed, graded, and ranked against every open mandate automatically. No consultant triage required."
        actions={
          <Link
            to="/app/upload"
            className="text-[13px] px-[18px] py-2.5 border border-ink bg-ink text-paper rounded-full transition-all hover:opacity-90"
          >
            Upload CV
          </Link>
        }
      />

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Candidates" value={candidates.length} />
        <StatCard
          label="Open mandates"
          value={jobs.filter((j) => j.status === "open").length}
        />
        <StatCard
          label="Parsing now"
          value={pending.length}
          sub={failed.length ? `${failed.length} failed` : undefined}
        />
        <StatCard
          label="Avg. CV quality"
          value={avgQuality == null ? "—" : avgQuality}
          sub={parsed.length ? `over ${parsed.length} parsed CVs` : undefined}
        />
      </div>

      <Section title="Recent uploads">
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="border border-rule rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-deep text-ink-mute">
                  <Th>Candidate</Th>
                  <Th>Headline</Th>
                  <Th>Status</Th>
                  <Th>Quality</Th>
                  <Th>Uploaded</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} className="border-t border-rule hover:bg-paper-deep/40">
                    <Td>
                      <Link
                        to="/app/candidates/$id"
                        params={{ id: c.id }}
                        className="text-ink hover:underline"
                      >
                        {c.name ?? c.source_filename ?? c.id}
                      </Link>
                    </Td>
                    <Td>{c.headline ?? "—"}</Td>
                    <Td>
                      <StatusPill status={c.status} />
                    </Td>
                    <Td>
                      {c.quality_score != null ? (
                        <div className="w-32">
                          <ScoreBar value={c.quality_score} />
                        </div>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-ink-mute tabular-nums">
                      {formatRelative(c.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Open mandates">
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to="/app/jobs/$id"
              params={{ id: j.id }}
              className="group border border-rule rounded-md p-5 hover:border-ink transition-colors bg-paper"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg">{j.title}</div>
                  <div className="text-sm text-ink-soft mt-0.5">
                    {j.company ?? "Confidential"} · {j.location ?? "—"}
                  </div>
                </div>
                <Pill>{j.seniority ?? "open"}</Pill>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {j.must_have_skills.slice(0, 4).map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft">
      No CVs yet.{" "}
      <Link to="/app/upload" className="underline">
        Upload the first CV
      </Link>{" "}
      to see the pipeline in action.
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-mono text-[11px] tracking-[0.12em] uppercase px-4 py-3 text-ink-mute font-normal">
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

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
