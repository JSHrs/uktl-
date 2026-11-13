import { createFileRoute, Link } from "@tanstack/react-router";
import { listCandidatesFn, adminListFaqFn, adminListJobsFn, adminListEnquiriesFn } from "@/lib/functions";
import { staffEmployerRolesFn } from "@/lib/employer-functions";
import type { CandidateRow, FaqTopic } from "@/lib/server/db";
import type { Job } from "@/lib/schemas/job";
import { AdminHeader } from "../admin";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const [candidates, faq, jobs, employerRoles, enquiries] = await Promise.all([
      listCandidatesFn(),
      adminListFaqFn(),
      adminListJobsFn(),
      // Secondary panels must not take the overview down with them.
      staffEmployerRolesFn({ data: {} }).catch(() => null),
      adminListEnquiriesFn().catch(() => null),
    ]);
    return { candidates, faq, jobs, employerRoles, enquiries };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { candidates, faq, jobs, employerRoles, enquiries } = Route.useLoaderData();
  const toReview = employerRoles?.filter((r) => r.status === "submitted") ?? [];
  const wantsToMeet = employerRoles?.reduce((n, r) => n + r.interested, 0) ?? 0;
  const uploaded = candidates.filter((c: CandidateRow) => c.status !== "parsed").length;
  const parsed = candidates.filter((c: CandidateRow) => c.status === "parsed");
  const openJobs = jobs.filter((j: Job) => j.status === "open");
  const publishedFaq = faq.filter((f: FaqTopic) => f.published);

  return (
    <>
      <AdminHeader title="Overview" sub="What needs attention today, then the numbers." />

      <section aria-labelledby="attention" className="mb-10">
        <h2 id="attention" className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute mb-3">Needs attention</h2>
        <ul className="border border-rule rounded-md divide-y divide-rule bg-paper">
          <Attention count={toReview.length} unknown={!employerRoles} label="employer roles waiting for review" empty="No employer roles waiting for review" to="/admin/employer-roles" cta="Review roles" />
          <Attention count={wantsToMeet} unknown={!employerRoles} label="shared candidates an employer wants to meet" empty="No employer responses to follow up" to="/admin/employer-roles" cta="Open employer roles" />
          <Attention count={uploaded} label="CVs uploaded but not yet scored" empty="Every uploaded CV has been scored" to="/admin/processing" cta="CV processing" />
          <Attention count={enquiries?.length ?? 0} unknown={!enquiries} label="enquiries received in total" empty="No enquiries yet" to="/admin/enquiries" cta="Read enquiries" />
        </ul>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Candidates" value={candidates.length} sub={`${parsed.length} parsed`} to="/admin/candidates" />
        <StatCard label="Open mandates" value={openJobs.length} sub={`${jobs.length} total`} to="/admin/jobs" />
        <StatCard label="FAQ topics" value={publishedFaq.length} sub={`${faq.length} total`} to="/admin/faq" />
        <StatCard label="Avg. quality" value={avgQuality(parsed)} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickCard title="Mandates" sub="Add, edit, close or fill the roles you're recruiting for." to="/admin/jobs" cta="Manage mandates →" />
        <QuickCard title="Employer roles" sub="Review roles employers post, publish them and share candidates." to="/admin/employer-roles" cta="Open employer roles →" />
        <QuickCard title="Candidates" sub="Search the talent pool and open candidate records." to="/admin/candidates" cta="Open candidates →" />
        <QuickCard title="Consultations" sub="Set your hours and see who has booked." to="/admin/bookings" cta="Manage consultations →" />
        <QuickCard title="HR guidance" sub="Topics, videos and reviewed answers candidates see." to="/admin/faq" cta="Manage topics →" />
        <QuickCard title="Settings" sub="Your account and optional two-step verification." to="/admin/settings" cta="Open settings →" />
      </div>
    </>
  );
}

function Attention({ count, unknown, label, empty, to, cta }: { count: number; unknown?: boolean; label: string; empty: string; to: string; cta: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-sm">
      <span className={`w-9 font-display text-2xl tabular-nums ${count > 0 ? "text-accent" : "text-ink-mute"}`}>{unknown ? "–" : count}</span>
      <span className={`flex-1 min-w-[180px] ${count > 0 ? "text-ink" : "text-ink-soft"}`}>{unknown ? "Unavailable right now" : count > 0 ? label : empty}</span>
      <Link to={to} className="text-[13px] underline text-ink-soft hover:text-ink">
        {cta}
      </Link>
    </li>
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
