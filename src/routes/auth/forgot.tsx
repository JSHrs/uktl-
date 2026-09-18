import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateMagicLinkFn } from "@/lib/functions";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await candidateMagicLinkFn({ data: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="w-14 h-14 rounded-full border border-rule flex items-center justify-center mx-auto mb-6">
          <span className="text-ink text-lg">✉</span>
        </div>
        <h2 className="font-display font-light text-2xl tracking-[-0.02em] mb-3">Link sent</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          If an account exists for <strong className="text-ink">{email}</strong>, you'll receive a sign-in link shortly.
        </p>
        <Link
          to="/auth/login"
          className="inline-block mt-6 text-sm text-ink underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute mb-3">
          — Password recovery
        </div>
        <h1
          className="font-display font-light tracking-[-0.025em]"
          style={{ fontSize: "clamp(28px, 4vw, 36px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          Reset password
        </h1>
        <p className="text-sm text-ink-soft mt-2">
          Enter your email and we'll send a magic sign-in link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Email address
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
          {loading ? "Sending…" : "Send sign-in link"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-mute">
        <Link to="/auth/login" className="text-ink underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
