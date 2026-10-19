import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { adminLoginFn } from "@/lib/functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Staff sign in — UK Talent Link" }, { name: "description", content: "Secure access for UK Talent Link staff." }, { property: "og:title", content: "Staff sign in — UK Talent Link" }, { property: "og:description", content: "Access your recruitment operations workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await adminLoginFn({ data: { email, password } });
      if (!result.ok) {
        setError(result.error ?? "Invalid password");
        setBusy(false);
        return;
      }
      await navigate({ to: "/auth/security" });
    } catch {
      setError("Login failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <Link to="/auth/login" className="inline-block mb-6 text-sm underline">← Back to sign in</Link>
        <div className="mb-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute mb-1">
            UK Talent Link
          </div>
          <h1 className="font-display font-light text-3xl tracking-[-0.02em] text-ink">
            Admin access
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div><label htmlFor="staff-email" className="block text-sm mb-2">Staff email</label>
            <input id="staff-email" type="email" autoComplete="username" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="Staff email" className="w-full border border-rule rounded px-4 py-2.5" />
          </div>
          <div>
            <label htmlFor="staff-password" className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
              Password
            </label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-rule rounded px-4 py-2.5 text-sm bg-paper text-ink focus:outline-none focus:border-ink transition-colors"
              placeholder="Admin password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !password || !email}
            className="w-full text-[13px] py-2.5 border border-ink bg-ink text-paper rounded-full disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {busy ? "Verifying…" : "Sign in"}
          </button>
        </form>

        <Link to="/simulation" search={{ role: "admin" }} className="block mt-6 text-center text-sm underline">Open prebuilt admin preview →</Link>
        <p className="mt-6 text-xs text-ink-mute text-center">
          Staff accounts are invitation-only. Ask your administrator for access.
        </p>

      </div>
    </div>
  );
}
