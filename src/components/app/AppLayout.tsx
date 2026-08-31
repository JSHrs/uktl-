import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/app", label: "Overview", exact: true },
  { to: "/app/discover", label: "Discover" },
  { to: "/app/hr", label: "HR & Law" },
  { to: "/app/upload", label: "Upload CV" },
  { to: "/app/candidates", label: "Candidates" },
  { to: "/app/jobs", label: "Mandates" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-rule">
        <div
          className="flex items-center justify-between py-5"
          style={{ paddingLeft: "clamp(24px, 5vw, 72px)", paddingRight: "clamp(24px, 5vw, 72px)" }}
        >
          <div className="flex items-center gap-12">
            <Link
              to="/"
              className="font-display text-[18px] font-medium tracking-[-0.02em] text-ink"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
            >
              UK Talent <em className="not-italic font-normal text-ink-soft italic">Link</em>
            </Link>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute">
              — Talent Compass
            </div>
          </div>
          <nav className="flex items-center gap-8">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={item.exact ? { exact: true } : undefined}
                className="text-sm text-ink-soft hover:text-ink transition-colors"
                activeProps={{ className: "text-ink" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main
        className="py-10"
        style={{ paddingLeft: "clamp(24px, 5vw, 72px)", paddingRight: "clamp(24px, 5vw, 72px)" }}
      >
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex items-end justify-between gap-8">
      <div>
        <div className="font-mono text-xs tracking-[0.15em] uppercase text-ink-mute">
          — {eyebrow}
        </div>
        <h1
          className="font-display font-light leading-[1] tracking-[-0.025em] mt-3"
          style={{ fontSize: "clamp(32px, 4vw, 52px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {title}
        </h1>
        {lede && (
          <p className="text-[15px] text-ink-soft leading-[1.5] max-w-[62ch] mt-4">
            {lede}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="border border-rule rounded-md p-6 bg-paper">
      <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute">
        {label}
      </div>
      <div
        className="font-display font-light mt-4"
        style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
      >
        {value}
      </div>
      {sub && <div className="text-sm text-ink-soft mt-2">{sub}</div>}
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2
        className="font-display font-light tracking-[-0.02em] mb-5"
        style={{ fontSize: "clamp(20px, 2vw, 24px)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "bg-accent-soft text-accent border-accent/20"
      : tone === "warn"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : tone === "bad"
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-paper-deep text-ink-soft border-rule";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-mono tracking-[0.05em] ${toneCls}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  if (status === "parsed") return <Pill tone="good">parsed</Pill>;
  if (status === "parsing") return <Pill tone="warn">parsing…</Pill>;
  if (status === "failed") return <Pill tone="bad">failed</Pill>;
  return <Pill>{status}</Pill>;
}

export function ScoreBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const tone = clamped >= 75 ? "bg-accent" : clamped >= 50 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-paper-deep overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="font-mono text-xs tabular-nums text-ink-soft w-10 text-right">
        {clamped}
      </div>
    </div>
  );
}
