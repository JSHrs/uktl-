import { DataError } from "@/components/app/DataError";
import { useState, type ReactNode } from "react";
import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { adminLogoutFn } from "@/lib/functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: ({ context, location }) => {
    if (location.pathname.startsWith("/admin/login")) return { staffRole: null };
    const { session } = context;
    if (session.staffRole && !session.isStaff) throw redirect({ to: "/auth/security" });
    if (!session.isStaff) throw redirect({ to: "/admin/login" });
    if (session.staffRole === "consultant" && !location.pathname.startsWith("/admin/candidates") && location.pathname!=="/admin/messages") throw redirect({ to: "/admin/candidates" });
    return { staffRole: session.staffRole ?? null };
  },
  errorComponent: DataError,
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", group: "Business", exact: true },
  { to: "/admin/analytics", label: "Analytics", group: "Business" },
  { to: "/admin/candidates", label: "Candidates", group: "Recruitment" },
  { to: "/admin/jobs", label: "Mandates", group: "Recruitment" },
  { to: "/admin/processing", label: "CV processing", group: "Recruitment" },
  { to: "/admin/messages", label: "Messages", group: "Communications" },
  { to: "/admin/bookings", label: "Consultations", group: "Communications" },
  { to: "/admin/enquiries", label: "Enquiries", group: "Communications" },
  { to: "/admin/campaigns", label: "Email campaigns", group: "Communications" },
  { to: "/admin/faq", label: "Topics & videos", group: "Content" },
  { to: "/admin/hr", label: "HR content review", group: "Content" },
  { to: "/admin/calendar", label: "Calendar connections", group: "Operations" },
  { to: "/admin/operations", label: "Operations & privacy", group: "Operations" },
] as const;

function AdminLayout() {
  const router = useRouter();
  const { staffRole } = Route.useRouteContext();
  const [menuOpen,setMenuOpen]=useState(false);
  const current=router.state.location.pathname;
  const section=[...NAV].reverse().find(item=>item.to!=="/admin" && current.startsWith(item.to));
  if (router.state.location.pathname.startsWith("/admin/login")) return <Outlet />;

  async function logout() {
    await adminLogoutFn();
    await router.invalidate();
    await router.navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-60 md:h-screen md:sticky md:top-0 md:overflow-y-auto flex-shrink-0 border-r border-rule bg-paper-deep/40 flex flex-col">
        <div className="px-5 py-5 border-b border-rule">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute">
            UK Talent Link
          </div>
          <div className="font-display font-light text-lg mt-0.5 text-ink">Admin</div>
        </div>
        <button className="md:hidden px-5 py-3 text-left border-b border-rule" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"Close admin menu":"Open admin menu"}</button>
        <nav id="admin-navigation" aria-label="Administration" className={`${menuOpen?"block":"hidden"} md:block flex-1 px-3 py-4 space-y-5`}>
          {[...new Set(NAV.map(i=>i.group))].map(group=>{
            const items=NAV.filter(i=>i.group===group && (staffRole==="admin" || (i.to==="/admin/candidates" || i.to==="/admin/messages")));
            return items.length>0 && <div key={group}><p className="px-3 mb-2 text-xs font-semibold text-ink-mute">{group}</p>{items.map(item=><Link key={item.to} to={item.to} onClick={()=>setMenuOpen(false)} activeOptions={{exact:item.to==="/admin"}} className="block px-3 py-2.5 rounded text-sm text-ink-soft hover:bg-paper-deep" activeProps={{className:"block px-3 py-2.5 rounded text-sm bg-paper border border-rule text-ink",'aria-current':'page'}}>{item.label}</Link>)}</div>;
          })}
        </nav>
        <div className="px-3 py-4 border-t border-rule">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded text-sm text-ink-mute hover:text-ink hover:bg-paper-deep transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-ink-soft mb-6"><Link to={staffRole==="admin"?"/admin":"/admin/candidates"}>Workspace</Link>{section&&<><span aria-hidden="true">/</span><Link to={section.to}>{section.label}</Link>{current!==section.to&&<><span aria-hidden="true">/</span><span>{current.endsWith('/new')?'Create':'Details'}</span></>}</>}</nav>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// ── Shared admin UI primitives ────────────────────────────────────────────────

/** Admin-only CSV download link (the server also enforces admin + MFA and audits it). */
export function ExportLink({ kind, job, label = "Export CSV" }: { kind: "candidates" | "pipeline" | "enquiries" | "bookings"; job?: string; label?: string }) {
  const { staffRole } = Route.useRouteContext();
  if (staffRole !== "admin") return null;
  return (
    <a
      href={`/api/admin/export/${kind}${job ? `?job=${encodeURIComponent(job)}` : ""}`}
      className="text-[12px] px-3.5 py-1.5 border border-rule rounded-full text-ink-soft hover:border-ink hover:text-ink transition-colors"
    >
      {label}
    </a>
  );
}

export function AdminHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="font-display font-light text-3xl tracking-[-0.02em] text-ink">{title}</h1>
        {sub && <p className="text-sm text-ink-soft mt-1">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function AdminTable({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="border border-rule rounded-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper-deep">
            {head.map((h) => (
              <th
                key={h}
                className="text-left font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute px-4 py-2.5 font-normal"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTr({ children }: { children: ReactNode }) {
  return <tr className="border-t border-rule hover:bg-paper-deep/30">{children}</tr>;
}

export function AdminTd({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function AdminBtn({
  children,
  variant = "default",
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls =
    variant === "primary"
      ? "border-ink bg-ink text-paper hover:opacity-90"
      : variant === "danger"
        ? "border-red-300 text-red-700 hover:border-red-600 hover:bg-red-50"
        : "border-rule text-ink-soft hover:border-ink hover:text-ink";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`text-[12px] px-3.5 py-1.5 border rounded-full transition-colors disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

export function AdminField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block">
        <span className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">{label}</span>
        {children}
      </label>
      {hint && <p className="text-xs text-ink-mute mt-1">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "w-full border border-rule rounded px-3 py-2 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors";

export const textareaCls =
  "w-full border border-rule rounded px-3 py-2 text-sm bg-paper text-ink placeholder:text-ink-mute resize-y focus:outline-none focus:border-ink transition-colors";

export const selectCls =
  "w-full border border-rule rounded px-3 py-2 text-sm bg-paper text-ink focus:outline-none focus:border-ink transition-colors";
