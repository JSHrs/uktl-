import { type ReactNode, type ComponentType, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Inbox,
  PenLine,
  Users,
  BarChart3,
  Globe,
  LogOut,
  type LucideProps,
} from "lucide-react";
import { clearToken, getToken } from "@/lib/auth-client";
import { verifyTokenFn } from "@/lib/functions";
import { Spinner } from "@/components/dashboard/primitives";

type NavItem = {
  to: string;
  icon: ComponentType<LucideProps>;
  label: string;
  exact?: boolean;
};
const NAV: NavItem[] = [
  { to: "/app", icon: Inbox, label: "Lead Intelligence", exact: true },
  { to: "/app/content", icon: PenLine, label: "Content Workshop" },
  { to: "/app/recruitment", icon: Users, label: "Recruitment Tracker" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
];

export function DashboardShell({
  children,
  headerExtra,
}: {
  children: ReactNode;
  headerExtra?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authState, setAuthState] = useState<"checking" | "ok" | "no">(
    "checking",
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    verifyTokenFn({ data: { token } })
      .then((r) => {
        if (r.valid) setAuthState("ok");
        else {
          clearToken();
          navigate({ to: "/login" });
        }
      })
      .catch(() => {
        clearToken();
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const onLogout = () => {
    clearToken();
    navigate({ to: "/login" });
  };

  const currentNav =
    NAV.find((n: NavItem) =>
      n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to),
    ) ?? NAV[0];

  if (authState === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--navy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.6)",
          gap: 12,
          fontSize: 13,
        }}
      >
        <Spinner size={16} /> Verifying session…
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f8f7f4",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: 240,
          background: "var(--navy)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(184,151,90,0.1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(184,151,90,0.1)",
          }}
        >
          <Link
            to="/app"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "var(--gold)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="font-serif"
                style={{ color: "var(--navy)", fontWeight: 700, fontSize: 14 }}
              >
                UK
              </span>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 500, fontSize: 14 }}>
                UK Talent Link
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Admin Dashboard
              </div>
            </div>
          </Link>
        </div>

        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {NAV.map((n) => {
            const active =
              n.exact
                ? location.pathname === n.to
                : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as "/app"}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 4,
                  background: active ? "rgba(184,151,90,0.12)" : "transparent",
                  border: active
                    ? "1px solid rgba(184,151,90,0.2)"
                    : "1px solid transparent",
                  color: active ? "var(--gold-2)" : "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  fontWeight: 400,
                  textAlign: "left",
                  marginBottom: 4,
                  textDecoration: "none",
                }}
              >
                <n.icon size={16} strokeWidth={1.75} />
                <span style={{ flex: 1 }}>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid rgba(184,151,90,0.1)",
          }}
        >
          <Link
            to="/"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(184,151,90,0.08)",
              border: "1px solid rgba(184,151,90,0.15)",
              borderRadius: 4,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
              textDecoration: "none",
            }}
          >
            <Globe size={14} strokeWidth={1.75} />
            View Public Site
          </Link>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <LogOut size={14} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            background: "white",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            padding: "0 32px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h1
            style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 10 }}
          >
            <currentNav.icon size={18} strokeWidth={1.75} color="var(--gold)" />
            {currentNav.label}
          </h1>
          <div
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            {headerExtra}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 0 3px rgba(45,155,111,0.2)",
              }}
            />
            <span style={{ fontSize: 13, color: "var(--muted-c)" }}>Live</span>
          </div>
        </header>

        <div style={{ flex: 1, overflow: "auto", padding: 32 }}>{children}</div>
      </main>
    </div>
  );
}
