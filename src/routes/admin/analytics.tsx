import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader } from "@/routes/admin";
import { adminGetAnalyticsFn } from "@/lib/server/functions";

export const Route = createFileRoute("/admin/analytics")({
  loader: () => adminGetAnalyticsFn(),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const data = Route.useLoaderData();

  const resolutionRate =
    data.total_queries > 0
      ? Math.round((data.resolved_queries / data.total_queries) * 100)
      : null;

  const conversionRate =
    data.total_queries > 0
      ? Math.round((data.total_bookings / data.total_queries) * 100)
      : null;

  return (
    <>
      <AdminHeader title="Analytics" sub="Platform activity overview" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Tile label="Total candidates" value={data.total_candidates} />
        <Tile label="CVs parsed" value={data.parsed_candidates} />
        <Tile
          label="Avg. CV quality"
          value={data.avg_quality_score != null ? `${data.avg_quality_score}` : "—"}
          unit="/100"
        />
        <Tile label="Open mandates" value={data.open_jobs} />
      </div>

      <h2 className="font-display font-light text-xl tracking-[-0.02em] mb-4">HR module</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Tile label="FAQ video views" value={data.total_faq_views} />
        <Tile label="Questions submitted" value={data.total_queries} />
        <Tile
          label="Resolution rate"
          value={resolutionRate != null ? `${resolutionRate}%` : "—"}
          subtext={resolutionRate != null ? `${data.resolved_queries} of ${data.total_queries} resolved` : undefined}
        />
        <Tile
          label="Booking conversions"
          value={conversionRate != null ? `${conversionRate}%` : "—"}
          subtext={`${data.total_bookings} booking${data.total_bookings !== 1 ? "s" : ""} total`}
        />
      </div>

      <div className="border border-rule rounded-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-rule bg-paper-deep">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">
            Funnel — HR module
          </span>
        </div>
        <div className="p-5">
          <FunnelBar label="Questions submitted" value={data.total_queries} max={data.total_queries} />
          <FunnelBar label="Resolved by video" value={data.resolved_queries} max={data.total_queries} />
          <FunnelBar label="Escalated to AI" value={data.resolved_queries} max={data.total_queries} note="estimated" />
          <FunnelBar label="Booked consultation" value={data.total_bookings} max={data.total_queries} />
        </div>
      </div>
    </>
  );
}

function Tile({
  label,
  value,
  unit,
  subtext,
}: {
  label: string;
  value: number | string;
  unit?: string;
  subtext?: string;
}) {
  return (
    <div className="border border-rule rounded-md p-5 bg-paper">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute mb-3">
        {label}
      </div>
      <div
        className="font-display font-light leading-none tabular-nums"
        style={{ fontSize: "clamp(26px, 3vw, 36px)" }}
      >
        {value}
        {unit && <span className="text-ink-mute text-base ml-0.5">{unit}</span>}
      </div>
      {subtext && <div className="text-xs text-ink-mute mt-2">{subtext}</div>}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  note,
}: {
  label: string;
  value: number;
  max: number;
  note?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-4 mb-3">
      <div className="w-[160px] text-xs text-ink-soft flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-paper-deep overflow-hidden">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%`, opacity: 0.75 }}
        />
      </div>
      <div className="font-mono text-xs tabular-nums text-ink-mute w-12 text-right">
        {value}
        {note && <span className="text-[10px]">*</span>}
      </div>
    </div>
  );
}
