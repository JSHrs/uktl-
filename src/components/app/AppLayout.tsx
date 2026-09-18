import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

const nav = [
  { to: "/app", label: "Overview", exact: true },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/discover", label: "Discover" },
  { to: "/app/activity", label: "Interests" },
  { to: "/app/hr", label: "HR & Law" },
  { to: "/app/upload", label: "Upload CV" },
  { to: "/app/candidates", label: "Candidates" },
  { to: "/app/jobs", label: "Mandates" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppNav />
      <main
        className="py-8 md:py-10"
        style={{ paddingLeft: "clamp(16px, 4vw, 56px)", paddingRight: "clamp(16px, 4vw, 56px)" }}
      >
        {children}
      </main>
    </div>
  );
}

function AppNav() {
  const routerState = useRouterState();
  const current = routerState.location.pathname;

  return (
    <header className="border-b border-rule sticky top-0 z-50 bg-paper/95 backdrop-blur-md">
      <div
        className="flex items-center gap-4 py-3"
        style={{ paddingLeft: "clamp(16px, 4vw, 56px)", paddingRight: "clamp(16px, 4vw, 56px)" }}
      >
        <Link
          to="/"
          className="font-display text-[15px] font-medium tracking-[-0.025em] text-ink shrink-0 mr-1"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
        >
          UK Talent{" "}
          <em className="not-italic font-normal text-ink-mute italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            Compass
          </em>
        </Link>

        <span className="hidden sm:block w-px h-4 bg-rule flex-shrink-0" aria-hidden="true" />

        <nav
          className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {nav.map((item) => {
            const isActive = "exact" in item && item.exact
              ? current === item.to
              : current.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={"exact" in item && item.exact ? { exact: true } : undefined}
                className={`text-[13px] whitespace-nowrap px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "text-ink bg-paper-deep font-medium"
                    : "text-ink-mute hover:text-ink hover:bg-paper-deep/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
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
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute flex items-center gap-2.5">
          <span className="w-5 h-px bg-current" />
          {eyebrow}
        </div>
        <h1
          className="font-display font-light leading-[1.02] tracking-[-0.025em] mt-3 text-ink"
          style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {title}
        </h1>
        {lede && (
          <p className="text-[14px] text-ink-soft leading-[1.55] max-w-[62ch] mt-3">
            {lede}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg p-5 border ${accent ? "border-accent/20 bg-accent-soft" : "border-rule bg-paper"}`}>
      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">
        {label}
      </div>
      <div
        className={`font-display font-light mt-3 leading-none tabular-nums ${accent ? "text-accent" : "text-ink"}`}
        style={{ fontSize: "clamp(26px, 3vw, 40px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
      >
        {value}
      </div>
      {sub && <div className={`text-[12px] mt-2 ${accent ? "text-accent/60" : "text-ink-mute"}`}>{sub}</div>}
    </div>
  );
}

export function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2
          className="font-display font-light tracking-[-0.02em] text-ink"
          style={{ fontSize: "clamp(18px, 1.8vw, 22px)" }}
        >
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
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
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "bad"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-paper-deep text-ink-mute border-rule";
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-[11px] font-mono tracking-[0.04em] leading-none ${toneCls}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  if (status === "parsed") return <Pill tone="good">parsed</Pill>;
  if (status === "parsing") return <Pill tone="warn">parsing…</Pill>;
  if (status === "uploading") return <Pill tone="warn">uploading</Pill>;
  if (status === "failed") return <Pill tone="bad">failed</Pill>;
  return <Pill>{status}</Pill>;
}

export function ScoreBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    clamped >= 75 ? "bg-accent" : clamped >= 50 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1 rounded-full bg-paper-deep overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="font-mono text-[11px] tabular-nums text-ink-mute w-8 text-right shrink-0">
        {clamped}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-rule rounded-lg p-12 text-center">
      <div className="text-[15px] text-ink-soft mb-1.5">{title}</div>
      {body && <div className="text-[13px] text-ink-mute max-w-[36ch] mx-auto">{body}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
