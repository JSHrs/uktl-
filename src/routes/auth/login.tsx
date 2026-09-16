import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { candidateLoginFn } from "@/lib/functions";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await candidateLoginFn({ data: { email, password } });
      router.navigate({ to: "/app/profile" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute mb-3">
          — Candidate portal
        </div>
        <h1
          className="font-display font-light tracking-[-0.025em]"
          style={{ fontSize: "clamp(28px, 4vw, 36px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          Sign in
        </h1>
        <p className="text-sm text-ink-soft mt-2">
          Access your CV profile, job matches, and HR guidance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div>
          <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-ink text-paper text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <div>
          <Link
            to="/auth/forgot"
            className="text-sm text-ink-mute hover:text-ink transition-colors underline"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="text-sm text-ink-mute">
          No account?{" "}
          <Link to="/auth/register" className="text-ink underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
