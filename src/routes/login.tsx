import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginFn } from "@/lib/server/functions";
import { setToken } from "@/lib/auth-client";
import { Spinner } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — UK Talent Link" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await loginFn({ data: { password: pw } });
      if (!result.ok) {
        setErr(result.error ?? "Incorrect password");
        setLoading(false);
        return;
      }
      setToken(result.token);
      navigate({ to: "/app" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--navy)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(184,151,90,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="anim-fadeup"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(184,151,90,0.15)",
          borderRadius: 6,
          padding: "52px 44px",
          width: "100%",
          maxWidth: 400,
          backdropFilter: "blur(10px)",
          position: "relative",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "var(--gold)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <span
              className="font-serif"
              style={{ color: "var(--navy)", fontWeight: 700, fontSize: 20 }}
            >
              UK
            </span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: "white",
              marginBottom: 8,
            }}
          >
            Admin Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            UK Talent Link · Internal Access
          </p>
        </div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            marginBottom: 8,
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Enter dashboard password"
          style={{
            width: "100%",
            padding: "13px 16px",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${
              err ? "var(--red)" : "rgba(184,151,90,0.2)"
            }`,
            borderRadius: 3,
            color: "white",
            fontSize: 14,
            marginBottom: 8,
            fontFamily: "inherit",
          }}
        />
        {err && (
          <p style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>
            {err}
          </p>
        )}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            background: "var(--gold)",
            color: "var(--navy)",
            padding: "13px",
            borderRadius: 3,
            fontWeight: 600,
            fontSize: 14,
            marginTop: 8,
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "none",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? (
            <>
              <Spinner size={14} /> Verifying…
            </>
          ) : (
            "Access Dashboard →"
          )}
        </button>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.25)",
            fontSize: 12,
            marginTop: 20,
          }}
        >
          Demo password: admin123
        </p>
      </div>
    </div>
  );
}
