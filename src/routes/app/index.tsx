import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  EmptyState,
  PageHeader,
  Pill,
  ScoreBar,
  Section,
  StatCard,
  StatusPill,
} from "@/components/app/AppLayout";
import { getCandidateDetailFn, listCandidatesFn } from "@/lib/functions";

export const Route = createFileRoute("/app/")({
  beforeLoad: ({ context }) => {
    // Staff without a candidate account work from the admin dashboard.
    if (context.session.isAdmin && !context.session.userId) throw redirect({ to: "/admin" });
  },
  loader: async () => {
    // For a candidate this returns only their own uploads, newest first.
    const mine = await listCandidatesFn();
    const latest = mine[0] ?? null;
    const detail = latest ? await getCandidateDetailFn({ data: { id: latest.id } }) : null;
    return { latest, matches: detail?.matches ?? [] };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { latest, matches } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const top = matches.slice(0, 5);
  const strong = matches.filter((m) => m.score >= 70).length;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={
          <>
            Welcome{" "}
            <em className="not-italic italic font-normal text-ink-soft">back.</em>
          </>
        }
        lede={session.email ? `Signed in as ${session.email}` : undefined}
        actions={
          <Link
            to="/app/upload"
            className="text-[13px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
          >
            {latest ? "Upload a new CV" : "Upload your CV"}
          </Link>
        }
      />

      {!latest ? (
        <EmptyState
          title="You haven't uploaded a CV yet"
          body="Upload your CV and we'll score it, suggest improvements, and match you to the roles we're recruiting for."
          action={
            <Link
              to="/app/upload"
              className="text-[13px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
            >
              Upload your CV
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="CV quality"
              value={latest.quality_score ?? "—"}
              sub={latest.quality_score != null ? "out of 100" : "not scored yet"}
            />
            <StatCard label="Roles matched" value={matches.length} sub={`${strong} strong matches`} accent={strong > 0} />
            <StatCard label="CV status" value={<StatusPill status={latest.status} />} sub={latest.source_filename ?? undefined} />
          </div>

          <Section
            title="Your CV"
            actions={
              <Link
                to="/app/candidates/$id"
                params={{ id: latest.id }}
                className="text-[12px] text-ink-mute hover:text-ink transition-colors"
              >
                Score breakdown and tips →
              </Link>
            }
          >
            <div className="border border-rule rounded-lg p-5 flex flex-wrap items-center justify-between gap-6">
              <div className="min-w-0">
                <div className="font-medium text-[15px] text-ink">{latest.name ?? "Your profile"}</div>
                <div className="text-[13px] text-ink-mute mt-0.5">
                  {[latest.headline, latest.location].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              {latest.quality_score != null && (
                <div className="w-48">
                  <ScoreBar value={latest.quality_score} />
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Best-matched roles"
            actions={
              <Link to="/app/discover" className="text-[12px] text-ink-mute hover:text-ink transition-colors">
                See all matches →
              </Link>
            }
          >
            {top.length === 0 ? (
              <EmptyState
                title="No matches yet"
                body="We match you against every open role as soon as your CV is processed, and again whenever new roles are posted."
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {top.map((m) => (
                  <Link
                    key={m.job_id}
                    to="/app/jobs/$id"
                    params={{ id: m.job_id }}
                    className="group border border-rule rounded-lg p-5 hover:border-ink/30 hover:bg-paper-deep/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[14px] text-ink truncate">{m.job.title}</div>
                        <div className="text-[13px] text-ink-mute mt-0.5 truncate">
                          {m.job.company ?? "Confidential"}
                          {m.job.location ? ` · ${m.job.location}` : ""}
                        </div>
                      </div>
                      {m.job.seniority && <Pill>{m.job.seniority}</Pill>}
                    </div>
                    <ScoreBar value={m.score} />
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      <Section title="Also for you">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Browse all jobs", to: "/app/jobs" },
            { label: "HR & employment-law guidance", to: "/app/hr" },
            { label: "Edit your profile", to: "/app/profile" },
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
      </Section>
    </>
  );
}
