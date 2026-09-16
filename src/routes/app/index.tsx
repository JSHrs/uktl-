import { createFileRoute, Link } from "@tanstack/react-router";
import {
  EmptyState,
  PageHeader,
  Pill,
  ScoreBar,
  Section,
  StatCard,
  StatusPill,
} from "@/components/app/AppLayout";
import { listCandidatesFn, listJobsFn } from "@/lib/functions";

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
    (c) => c.status === "uploaded" || c.status === "parsing" || c.status === "uploading",
  );
  const failed = candidates.filter((c) => c.status === "failed");
  const openJobs = jobs.filter((j) => j.status === "open");
  const avgQuality =
    parsed.length === 0
      ? null
      : Math.round(parsed.reduce((acc, c) => acc + (c.quality_score ?? 0), 0) / parsed.length);
  const recent = [...candidates].sort((a, b) => b.created_at - a.created_at).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={
          <>
            Today's{" "}
            <em className="not-italic italic font-normal text-ink-soft">pipeline</em>
          </>
        }
        lede="Every uploaded CV is parsed, graded, and ranked against open mandates automatically."
        actions={
          <Link
            to="/app/upload"
            className="text-[13px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
          >
            Upload CV
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total candidates"
          value={candidates.length}
          sub={parsed.length ? `${parsed.length} parsed` : "none parsed yet"}
        />
        <StatCard
          label="Open mandates"
          value={openJobs.length}
          sub={`${jobs.length} total`}
        />
        <StatCard
          label="Processing"
          value={pending.length}
          sub={failed.length ? `${failed.length} failed` : "queue clear"}
          accent={pending.length > 0}
        />
        <StatCard
          label="Avg. CV quality"
          value={avgQuality == null ? "—" : avgQuality}
          sub={parsed.length ? `over ${parsed.length} CVs` : "no data yet"}
        />
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { label: "Upload a CV", to: "/app/upload" },
          { label: "Browse candidates", to: "/app/candidates" },
          { label: "Discover mandates", to: "/app/discover" },
          { label: "HR & Law", to: "/app/hr" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="text-[12px] px-3.5 py-1.5 border border-rule text-ink-soft rounded-full hover:border-ink hover:text-ink transition-colors"
          >
            {a.label} →
          </Link>
        ))}
      </div>

      {/* Recent uploads */}
      <Section title="Recent uploads">
        {recent.length === 0 ? (
          <EmptyState
            title="No CVs uploaded yet"
            body="Upload a CV to see the pipeline in action — parsing, scoring, and matching happen automatically."
            action={
              <Link
                to="/app/upload"
                className="text-[13px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
              >
                Upload first CV
              </Link>
            }
          />
        ) : (
          <div className="border border-rule rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-deep border-b border-rule">
                  <Th>Candidate</Th>
                  <Th>Headline</Th>
                  <Th>Status</Th>
                  <Th>Quality</Th>
                  <Th>Uploaded</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {recent.map((c) => (
                  <tr key={c.id} className="hover:bg-paper-deep/40 transition-colors">
                    <Td>
                      <Link
                        to="/app/candidates/$id"
                        params={{ id: c.id }}
                        className="font-medium text-ink hover:underline"
                      >
                        {c.name ?? c.source_filename ?? "—"}
                      </Link>
                    </Td>
                    <Td className="text-ink-soft max-w-[28ch] truncate">{c.headline ?? "—"}</Td>
                    <Td>
                      <StatusPill status={c.status} />
                    </Td>
                    <Td>
                      {c.quality_score != null ? (
                        <div className="w-28">
                          <ScoreBar value={c.quality_score} />
                        </div>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </Td>
                    <Td className="text-ink-mute tabular-nums text-[12px]">
                      {formatRelative(c.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {candidates.length > 6 && (
              <div className="px-4 py-3 border-t border-rule bg-paper-deep">
                <Link
                  to="/app/candidates"
                  className="text-[12px] text-ink-mute hover:text-ink transition-colors"
                >
                  View all {candidates.length} candidates →
                </Link>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Open mandates */}
      <Section
        title="Open mandates"
        actions={
          openJobs.length > 4 ? (
            <Link to="/app/jobs" className="text-[12px] text-ink-mute hover:text-ink transition-colors">
              View all →
            </Link>
          ) : undefined
        }
      >
        {openJobs.length === 0 ? (
          <EmptyState
            title="No open mandates"
            body="Mandates are added by your admin team or synced from Reed.co.uk."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {openJobs.slice(0, 4).map((j) => (
              <Link
                key={j.id}
                to="/app/jobs/$id"
                params={{ id: j.id }}
                className="group border border-rule rounded-lg p-5 hover:border-ink/30 hover:bg-paper-deep/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[14px] text-ink truncate">{j.title}</div>
                    <div className="text-[13px] text-ink-mute mt-0.5 truncate">
                      {j.company ?? "Confidential"}{j.location ? ` · ${j.location}` : ""}
                    </div>
                  </div>
                  {j.seniority && <Pill>{j.seniority}</Pill>}
                </div>
                {j.must_have_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {j.must_have_skills.slice(0, 3).map((s) => (
                      <Pill key={s}>{s}</Pill>
                    ))}
                    {j.must_have_skills.length > 3 && (
                      <Pill>+{j.must_have_skills.length - 3}</Pill>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-mono text-[10px] tracking-[0.14em] uppercase px-4 py-3 text-ink-mute font-normal">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-[13px] ${className}`}>{children}</td>;
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
