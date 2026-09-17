import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminLoginFn } from "@/lib/functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await adminLoginFn({ data: { password } });
      if (!result.ok) {
        setError(result.error ?? "Invalid password");
        setBusy(false);
        return;
      }
      await navigate({ to: "/admin" });
    } catch {
      setError("Login failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute mb-1">
            UK Talent Link
          </div>
          <h1 className="font-display font-light text-3xl tracking-[-0.02em] text-ink">
            Admin access
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
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
            disabled={busy || !password}
            className="w-full text-[13px] py-2.5 border border-ink bg-ink text-paper rounded-full disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {busy ? "Verifying…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-mute text-center">
          Authorised consultants only.
        </p>

      </div>
    </div>
  );
}
