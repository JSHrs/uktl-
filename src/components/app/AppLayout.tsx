import type { ReactNode } from "react";
import { Link, useRouteContext, useRouter, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { signOutFn } from "@/lib/functions";
import { setTheme, useTheme } from "@/lib/preferences";

type Section = { to: string; label: string; exact?: boolean };

const CANDIDATE_SECTIONS: Section[] = [
  { to: "/app", label: "Dashboard", exact: true },
  { to: "/app/upload", label: "My CV" },
  { to: "/app/discover", label: "Job matches" },
  { to: "/app/jobs", label: "All jobs" },
  { to: "/app/activity", label: "My interests" },
  { to: "/app/hr", label: "HR & Law" },
  { to: "/app/consultations", label: "Consultations" },
  { to: "/app/messages", label: "Messages" },
  { to: "/app/profile", label: "Profile" },
];

// Staff reach the candidate area only to open a record or a mandate pipeline.
const EMPLOYER_SECTIONS: Section[] = [
  { to: "/employer", label: "Your roles", exact: true },
  { to: "/employer/roles/new", label: "Post a role" },
  { to: "/employer/company", label: "Company & settings" },
];

const STAFF_SECTIONS: Section[] = [
  { to: "/app/candidates", label: "Candidates" },
  { to: "/app/jobs", label: "Mandates" },
  { to: "/app/upload", label: "Upload a CV" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useRouteContext({ from: "__root__" });
  const router = useRouter();
  const current = useRouterState().location.pathname;
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const employer = session.accountRole === "employer" && !session.isStaff;
  const sections = session.isStaff ? STAFF_SECTIONS : employer ? EMPLOYER_SECTIONS : CANDIDATE_SECTIONS;
  const area = session.isStaff ? "Staff workspace" : employer ? "Employer portal" : "Your account";
  const nextTheme = theme === "dark" ? "light" : "dark";
  // The longest matching section is the current one, so "/employer/roles/new" does not also light "Your roles".
  const active = [...sections]
    .filter((item) => (item.exact ? current === item.to : current === item.to || current.startsWith(item.to + "/")))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;
  async function signOut() {
    await signOutFn();
    await router.navigate({ to: "/auth/login", replace: true });
    await router.invalidate();
  }
  const brand = (
    <Link to="/" className="font-display text-[19px] font-medium tracking-[-0.025em] text-ink whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}>
      UK <em className="italic font-normal text-ink-soft">Talent</em> Link
    </Link>
  );
  const themeButton = (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      className="w-8 h-8 rounded-full border border-rule hover:border-ink grid place-items-center transition-colors shrink-0"
    >
      <i className="theme-dot" aria-hidden="true" />
    </button>
  );
  return (
    <div className="min-h-screen bg-paper text-ink md:flex">
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-3 border-b border-rule bg-paper">
        {brand}
        <div className="flex items-center gap-2">
          {themeButton}
          <Button variant="ghost" size="icon" aria-label={open ? "Close account menu" : "Open account menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <aside className={`${open ? "flex" : "hidden"} md:flex flex-col w-full md:w-60 md:h-screen md:sticky md:top-0 shrink-0 border-b md:border-b-0 md:border-r border-rule bg-paper-deep/40 p-5`}>
        <div className="hidden md:flex items-center justify-between gap-2 mb-2">
          {brand}
          {themeButton}
        </div>
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute mb-6">{area}</p>
        <nav aria-label="Account" className="flex-1 space-y-0.5">
          {sections.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              aria-current={active === item.to ? "page" : undefined}
              className={`flex items-center px-3 py-2.5 text-sm rounded-md border transition-colors ${
                active === item.to ? "bg-paper border-rule text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink hover:bg-paper/60"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-rule">
          {session.displayName && <p className="text-sm text-ink truncate">{session.displayName}</p>}
          <p className="text-xs text-ink-mute truncate" title={session.email ?? undefined}>{session.email}</p>
          <Button variant="ghost" className="w-full justify-start mt-3 -ml-2" onClick={signOut}>
            <LogOut />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-5 md:p-10">{children}</main>
        <footer className="border-t border-rule px-5 py-5 text-xs text-ink-soft flex flex-wrap justify-center gap-6" aria-label="Account support">
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          <Link to="/contact" className="hover:text-ink">Support</Link>
        </footer>
      </div>
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
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8">
      <div>
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute flex items-center gap-2.5">
          <span className="w-5 h-px bg-current" />
          {eyebrow}
        </div>
        <h1
          className="font-display font-semibold leading-tight tracking-[-0.025em] mt-3 text-ink"
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
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
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
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
        : tone === "bad"
          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
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
    <div className="border border-dashed border-rule rounded-lg px-6 py-12 text-center">
      <div className="font-display text-xl tracking-[-0.01em] text-ink mb-1.5">{title}</div>
      {body && <div className="text-[14px] text-ink-soft max-w-[48ch] mx-auto">{body}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
