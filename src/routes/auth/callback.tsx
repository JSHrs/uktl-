import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { candidateSessionFromTokensFn } from "@/lib/functions";

export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
});

// Supabase email links (magic link, sign-up confirmation) land here with the
// session in the URL fragment; it is exchanged for httpOnly cookies server-side.
function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const described = hash.get("error_description") ?? query.get("error_description");
    if (described) {
      setError(described);
      return;
    }
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      setError("This sign-in link is incomplete or has already been used. Request a new one.");
      return;
    }
    const expires = Number(hash.get("expires_in"));

    candidateSessionFromTokensFn({
      data: {
        access_token,
        refresh_token,
        expires_in: Number.isFinite(expires) && expires > 0 ? expires : undefined,
      },
    })
      .then(() => {
        window.history.replaceState(null, "", window.location.pathname);
        router.navigate({ to: "/app/profile" });
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Sign-in failed. Request a new link."),
      );
  }, [router]);

  if (error) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute mb-3">
          — Sign-in link
        </div>
        <h1 className="font-display font-light text-2xl tracking-[-0.02em] mb-3">
          That link didn't work
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">{error}</p>
        <div className="flex justify-center gap-3">
          <Link
            to="/auth/forgot"
            className="text-sm px-5 py-2.5 bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
          >
            Request a new link
          </Link>
          <Link
            to="/auth/login"
            className="text-sm px-5 py-2.5 border border-rule rounded-full hover:border-ink transition-colors"
          >
            Sign in with password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] text-center">
      <div className="mx-auto mb-5 w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
      <p className="text-sm text-ink-soft">Signing you in…</p>
    </div>
  );
}
