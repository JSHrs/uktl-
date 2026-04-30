import { type ReactNode } from "react";

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-block align-middle"
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(184,151,90,0.3)",
        borderTopColor: "#b8975a",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  High: { bg: "#fef2f2", fg: "#c0392b" },
  Medium: { bg: "#fffbeb", fg: "#d97706" },
  Low: { bg: "#f0fdf4", fg: "#2d9b6f" },
  New: { bg: "#eff6ff", fg: "#1d4ed8" },
  Contacted: { bg: "#f5f3ff", fg: "#7c3aed" },
  Qualified: { bg: "#f0fdf4", fg: "#166534" },
  "Proposal Sent": { bg: "#fff7ed", fg: "#c2410c" },
  "Closed Won": { bg: "#dcfce7", fg: "#15803d" },
  "Closed Lost": { bg: "#fef2f2", fg: "#dc2626" },
  Sourced: { bg: "#f1f5f9", fg: "#475569" },
  Shortlisted: { bg: "#eff6ff", fg: "#1d4ed8" },
  Interview: { bg: "#fef9c3", fg: "#ca8a04" },
  Offer: { bg: "#f0fdf4", fg: "#15803d" },
  Placed: { bg: "#dcfce7", fg: "#166534" },
  Rejected: { bg: "#fef2f2", fg: "#dc2626" },
  "Blog Article": { bg: "#eff6ff", fg: "#1d4ed8" },
  "LinkedIn Post": { bg: "#f5f3ff", fg: "#7c3aed" },
  "Email Newsletter": { bg: "#fff7ed", fg: "#c2410c" },
};

export function Badge({ text }: { text: string }) {
  const c = BADGE_COLORS[text] ?? { bg: "#f3f4f6", fg: "#6b7280" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 20,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

export function ScoreCell({ score }: { score: number }) {
  const color =
    score >= 80 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--red)";
  return (
    <span>
      <span
        className="font-serif"
        style={{ color, fontWeight: 600, fontSize: 15 }}
      >
        {score}
      </span>
      <span style={{ color: "var(--muted-c)", fontSize: 11 }}>/100</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  color = "var(--navy)",
}: {
  label: string;
  value: ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-white border rounded-[3px] px-5 py-[18px]">
      <div
        className="font-serif"
        style={{ fontSize: 24, fontWeight: 600, color, lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--muted-c)",
          marginTop: 4,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function PreviewBanner({ when }: { when: boolean | undefined }) {
  if (!when) return null;
  return (
    <div
      style={{
        background: "rgba(184,151,90,0.10)",
        border: "1px solid rgba(184,151,90,0.25)",
        color: "#7a5f2e",
        padding: "8px 14px",
        fontSize: 12,
        borderRadius: 3,
        marginBottom: 16,
      }}
    >
      Preview mode — showing illustrative data. Configure Cloudflare D1 + Anthropic
      API key for live data.
    </div>
  );
}
