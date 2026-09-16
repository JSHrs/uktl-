import { createFileRoute, Link } from "@tanstack/react-router";
import { listCandidatesFn, adminListFaqFn, adminListJobsFn } from "@/lib/functions";
import type { CandidateRow, FaqTopic } from "@/lib/server/db";
import type { Job } from "@/lib/schemas/job";
import { AdminHeader } from "../admin";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const [candidates, faq, jobs] = await Promise.all([
      listCandidatesFn(),
      adminListFaqFn(),
      adminListJobsFn(),
    ]);
    return { candidates, faq, jobs };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { candidates, faq, jobs } = Route.useLoaderData();
  const parsed = candidates.filter((c: CandidateRow) => c.status === "parsed");
  const openJobs = jobs.filter((j: Job) => j.status === "open");
  const publishedFaq = faq.filter((f: FaqTopic) => f.published);

  return (
    <>
      <AdminHeader title="Overview" sub="UK Talent Link administration" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Candidates" value={candidates.length} sub={`${parsed.length} parsed`} to="/admin/candidates" />
        <StatCard label="Open mandates" value={openJobs.length} sub={`${jobs.length} total`} to="/admin/jobs" />
        <StatCard label="FAQ topics" value={publishedFaq.length} sub={`${faq.length} total`} to="/admin/faq" />
        <StatCard label="Avg. quality" value={avgQuality(parsed)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <QuickCard
          title="FAQ Topics"
          sub="Manage HR & employment law video content"
          to="/admin/faq"
          cta="Manage FAQ →"
        />
        <QuickCard
          title="Mandates"
          sub="Add, edit, or close job mandates"
          to="/admin/jobs"
          cta="Manage mandates →"
        />
      </div>
    </>
  );
}

function avgQuality(parsed: Array<{ quality_score: number | null }>): string {
  if (!parsed.length) return "—";
  const avg = parsed.reduce((a, c) => a + (c.quality_score ?? 0), 0) / parsed.length;
  return Math.round(avg).toString();
}

function StatCard({
  label,
  value,
  sub,
  to,
}: {
  label: string;
  value: number | string;
  sub?: string;
  to?: string;
}) {
  const inner = (
    <div className="border border-rule rounded-md p-5 bg-paper hover:border-ink transition-colors">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">{label}</div>
      <div className="font-display font-light text-4xl mt-3 tracking-[-0.02em]">{value}</div>
      {sub && <div className="text-xs text-ink-soft mt-1.5">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickCard({
  title,
  sub,
  to,
  cta,
}: {
  title: string;
  sub: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="border border-rule rounded-md p-6 bg-paper">
      <h2 className="font-display font-light text-xl tracking-[-0.015em]">{title}</h2>
      <p className="text-sm text-ink-soft mt-1">{sub}</p>
      <Link to={to} className="mt-4 inline-block text-[13px] text-ink hover:underline font-mono tracking-[0.04em]">
        {cta}
      </Link>
    </div>
  );
}
