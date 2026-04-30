import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getAnalyticsFn } from "@/lib/server/functions";
import { StatCard, PreviewBanner } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/app/analytics")({
  loader: async () => {
    const data = await getAnalyticsFn();
    return { data };
  },
  component: AnalyticsPage,
});

const PIE_COLORS = ["#b8975a", "#0d1b2a", "#2d9b6f", "#8a94a6", "#7c3aed"];

function AnalyticsPage() {
  const { data } = Route.useLoaderData();

  return (
    <div>
      <PreviewBanner when={data.preview} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Visitors (6mo)"
          value={data.summary.visitors.toLocaleString()}
          color="var(--navy)"
        />
        <StatCard
          label="Total Leads"
          value={data.summary.leads}
          color="#1d4ed8"
        />
        <StatCard
          label="Conversion Rate"
          value={`${data.summary.conversionRate.toFixed(1)}%`}
          color="var(--green)"
        />
        <StatCard
          label="Avg Lead Score"
          value={data.summary.averageScore}
          color="var(--gold)"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <ChartCard title="Monthly Visitors">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.visitors}>
              <XAxis dataKey="month" stroke="#8a94a6" fontSize={12} />
              <YAxis stroke="#8a94a6" fontSize={12} />
              <Tooltip
                cursor={{ fill: "rgba(184,151,90,0.08)" }}
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#b8975a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Leads">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.leads}>
              <XAxis dataKey="month" stroke="#8a94a6" fontSize={12} />
              <YAxis stroke="#8a94a6" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0d1b2a"
                strokeWidth={2}
                dot={{ fill: "#b8975a", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <ChartCard title="Service Breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.services}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
              >
                {data.services.map((_: unknown, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
            {data.services.map((s: { name: string; value: number }, i: number) => (
              <div
                key={s.name}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: PIE_COLORS[i % PIE_COLORS.length],
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--slate)" }}>
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Conversion Funnel">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.funnel} layout="vertical">
              <XAxis type="number" stroke="#8a94a6" fontSize={12} />
              <YAxis
                dataKey="stage"
                type="category"
                stroke="#8a94a6"
                fontSize={12}
                width={100}
              />
              <Tooltip
                cursor={{ fill: "rgba(184,151,90,0.08)" }}
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="n" fill="#0d1b2a" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 4,
        padding: 20,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--slate)",
          marginBottom: 14,
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
