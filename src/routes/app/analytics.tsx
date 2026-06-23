import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Inbox,
  Target,
  Gauge,
  Activity,
  PieChart as PieIcon,
  Filter,
} from "lucide-react";
import { getAnalyticsFn } from "@/lib/functions";
import { PreviewBanner } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/app/analytics")({
  loader: async () => {
    const data = await getAnalyticsFn();
    return { data };
  },
  component: AnalyticsPage,
});

const PIE_COLORS = ["#6366f1", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"];

function pctChange(series: { count: number }[]): number {
  if (series.length < 2) return 0;
  const last = series[series.length - 1].count;
  const prev = series[series.length - 2].count;
  if (prev === 0) return last > 0 ? 100 : 0;
  return ((last - prev) / prev) * 100;
}

function AnalyticsPage() {
  const { data } = Route.useLoaderData();

  const visitorTrend = pctChange(data.visitors);
  const leadTrend = pctChange(data.leads);

  return (
    <div>
      <PreviewBanner when={data.preview} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
          paddingBottom: 18,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--muted-c)",
              marginBottom: 6,
            }}
          >
            Performance · Last 6 months
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            Analytics
          </h1>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 999,
            fontSize: 12,
            color: "var(--slate)",
          }}
        >
          <Activity size={14} color="var(--green)" />
          <span style={{ fontWeight: 500 }}>Live</span>
          <span style={{ color: "var(--muted-c)" }}>· updated just now</span>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <MetricCard
          icon={<Users size={16} />}
          label="Total Visitors"
          value={data.summary.visitors.toLocaleString()}
          trend={visitorTrend}
          accent="var(--navy)"
        />
        <MetricCard
          icon={<Inbox size={16} />}
          label="Total Leads"
          value={data.summary.leads.toLocaleString()}
          trend={leadTrend}
          accent="#1d4ed8"
        />
        <MetricCard
          icon={<Target size={16} />}
          label="Conversion Rate"
          value={`${data.summary.conversionRate.toFixed(1)}%`}
          accent="var(--green)"
          subtle="visitors → leads"
        />
        <MetricCard
          icon={<Gauge size={16} />}
          label="Avg Lead Score"
          value={String(data.summary.averageScore)}
          accent="var(--gold)"
          subtle="of 100"
        />
      </div>

      {/* Primary chart — full width */}
      <ChartCard
        title="Visitors & Leads"
        subtitle="Monthly performance over the last 6 months"
        icon={<Activity size={14} />}
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data.visitors.map((v: { month: string; count: number }, i: number) => ({
              month: v.month,
              visitors: v.count,
              leads: data.leads[i]?.count ?? 0,
            }))}
            margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke="#8a94a6" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8a94a6" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 6,
                fontSize: 12,
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#gradVisitors)"
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#ec4899"
              strokeWidth={2}
              fill="url(#gradLeads)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <Legend
          items={[
            { label: "Visitors", color: "#6366f1" },
            { label: "Leads", color: "#ec4899" },
          ]}
        />
      </ChartCard>

      {/* Secondary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <ChartCard
          title="Service Breakdown"
          subtitle="Lead distribution by service line"
          icon={<PieIcon size={14} />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.services}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={88}
                innerRadius={56}
                paddingAngle={2}
                stroke="white"
                strokeWidth={2}
              >
                {data.services.map((_: unknown, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 6,
                  fontSize: 12,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 12,
            }}
          >
            {data.services.map((s: { name: string; value: number }, i: number) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 10px",
                  background: "#fafaf8",
                  borderRadius: 4,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--slate)" }}>{s.name}</span>
                </span>
                <span
                  className="font-serif"
                  style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Conversion Funnel"
          subtitle="Drop-off across the pipeline"
          icon={<Filter size={14} />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.funnel} layout="vertical" margin={{ left: 8, right: 16 }}>
              <defs>
                <linearGradient id="gradFunnel" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#8a94a6" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="stage"
                type="category"
                stroke="#8a94a6"
                fontSize={11}
                width={110}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.1)" }}
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 6,
                  fontSize: 12,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="n" fill="url(#gradFunnel)" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  trend,
  subtle,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  subtle?: string;
  accent: string;
}) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div
      style={{
        position: "relative",
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 6,
        padding: "18px 18px 16px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: accent,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: accent,
          }}
        >
          {icon}
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--muted-c)",
              fontWeight: 500,
            }}
          >
            {label}
          </span>
        </div>
        {trend !== undefined && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 11,
              fontWeight: 600,
              color: positive ? "var(--green)" : "var(--red)",
              background: positive
                ? "rgba(45,155,111,0.1)"
                : "rgba(200,60,60,0.1)",
              padding: "2px 6px",
              borderRadius: 999,
            }}
          >
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div
        className="font-serif"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtle && (
        <div style={{ fontSize: 11, color: "var(--muted-c)", marginTop: 4 }}>
          {subtle}
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 6,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--ink)",
          }}
        >
          {icon && <span style={{ color: "var(--gold)" }}>{icon}</span>}
          <h3
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </h3>
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "var(--muted-c)",
              marginTop: 4,
              marginLeft: icon ? 22 : 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 8, paddingLeft: 4 }}>
      {items.map((it) => (
        <div
          key={it.label}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 2,
              background: it.color,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--slate)" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
