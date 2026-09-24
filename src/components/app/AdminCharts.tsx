import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STAGE_LABELS } from "@/lib/stages";
import type { MatchStage } from "@/lib/schemas/job";

type Charts = {
  series: { week: number; candidates: number; questions: number; bookings: number }[];
  status: Record<string, number>;
  quality: Record<string, number>;
  stages: Record<string, number>;
};

const TOKENS = ["accent", "ink", "ink-soft", "ink-mute", "rule", "paper", "accent-light"] as const;
type Palette = Record<(typeof TOKENS)[number], string>;

/** Resolves the design tokens to concrete colours and follows light/dark changes. */
function usePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const read = () => {
      const css = getComputedStyle(document.documentElement);
      setPalette(Object.fromEntries(TOKENS.map((t) => [t, css.getPropertyValue(`--${t}`).trim()])) as Palette);
    };
    read();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", read);
    return () => media.removeEventListener("change", read);
  }, []);
  return palette;
}

const weekLabel = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  parsing: "Parsing",
  processing: "Processing",
  parsed: "Parsed",
  failed: "Failed",
};

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <figure className="border border-rule rounded-md bg-paper">
      <figcaption className="px-5 py-3.5 border-b border-rule flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute">{title}</span>
        {note && <span className="text-[11px] text-ink-mute">{note}</span>}
      </figcaption>
      <div className="p-4 h-64">{children}</div>
    </figure>
  );
}

export function AdminCharts({ data }: { data: Charts }) {
  const p = usePalette();
  if (!p) return <div className="h-64" aria-hidden />;
  const axis = { stroke: p.rule, tick: { fill: p["ink-mute"], fontSize: 11 }, tickLine: false };
  const tooltip = {
    contentStyle: { background: p.paper, border: `1px solid ${p.rule}`, borderRadius: 6, fontSize: 12, color: p.ink },
    labelStyle: { color: p["ink-soft"] },
    cursor: { fill: p.rule, opacity: 0.35 },
  };
  const series = data.series.map((s) => ({ ...s, label: weekLabel(s.week) }));
  const quality = ["0–39", "40–59", "60–79", "80–100"].map((k) => ({ band: k, candidates: data.quality[k] ?? 0 }));
  const stages = (Object.keys(STAGE_LABELS) as MatchStage[]).map((k) => ({ stage: STAGE_LABELS[k], count: data.stages[k] ?? 0 }));
  const status = Object.entries(data.status)
    .map(([k, n]) => ({ status: STATUS_LABELS[k] ?? k, count: n }))
    .sort((a, b) => b.count - a.count);
  const empty = (rows: { [k: string]: unknown }[], key: string) => rows.every((r) => !r[key]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2">
        <Panel title="Weekly activity" note="Last 12 weeks · weeks start Monday (UTC)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={p.rule} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
              <YAxis {...axis} allowDecimals={false} axisLine={false} />
              <Tooltip {...tooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: p["ink-soft"] }} iconType="plainline" />
              <Line type="monotone" dataKey="candidates" name="CVs received" stroke={p.accent} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="questions" name="HR questions" stroke={p["ink-soft"]} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="bookings" name="Consultations booked" stroke={p.ink} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="CV score distribution" note="Parsed CVs with a score">
        {empty(quality, "candidates") ? (
          <Empty text="No scored CVs yet." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quality} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={p.rule} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="band" {...axis} />
              <YAxis {...axis} allowDecimals={false} axisLine={false} />
              <Tooltip {...tooltip} />
              <Bar dataKey="candidates" name="Candidates" fill={p.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel title="Pipeline by stage" note="All mandates">
        {empty(stages, "count") ? (
          <Empty text="No candidates in a pipeline yet." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stages} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
              <CartesianGrid stroke={p.rule} strokeDasharray="2 4" horizontal={false} />
              <XAxis type="number" {...axis} allowDecimals={false} />
              <YAxis type="category" dataKey="stage" {...axis} width={84} axisLine={false} />
              <Tooltip {...tooltip} />
              <Bar dataKey="count" name="Candidates" fill={p["ink-soft"]} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <div className="lg:col-span-2">
        <Panel title="CV processing status" note="All uploaded CVs">
          {status.length === 0 ? (
            <Empty text="No CVs uploaded yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={status} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={p.rule} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="status" {...axis} />
                <YAxis {...axis} allowDecimals={false} axisLine={false} />
                <Tooltip {...tooltip} />
                <Bar dataKey="count" name="CVs" fill={p.ink} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="h-full grid place-items-center text-sm text-ink-mute">{text}</div>;
}
