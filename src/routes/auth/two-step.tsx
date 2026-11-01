import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { accountDestination } from "@/lib/account-role";
import { signOutFn } from "@/lib/functions";
import { twoStepVerifyFn } from "@/lib/two-step-functions";

/**
 * Second step of sign-in for candidates and employers who switched on two-step
 * verification in their settings. Nobody else is sent here.
 */
export const Route = createFileRoute("/auth/two-step")({
  beforeLoad: ({ context }) => {
    const { session } = context;
    if (!session.mfaPending) throw redirect({ href: session.userId ? accountDestination(session) : "/auth/login" });
  },
  head: () => ({ meta: [{ title: "Enter your code — UK Talent Link" }] }),
  component: TwoStep,
});

function TwoStep() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await twoStepVerifyFn({ data: { code } });
      await router.invalidate();
      await router.navigate({ href: "/auth/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Please try again.");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-display font-light tracking-[-0.025em] text-[32px] text-center">Enter your code</h1>
      <p className="mt-3 text-sm text-ink-soft text-center">
        You switched on two-step verification. Open your authenticator app and enter the 6-digit code for UK Talent Link.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label htmlFor="two-step-code" className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">
          Authentication code
        </label>
        <input
          id="two-step-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-rule rounded-md px-4 py-3 text-center text-xl tracking-[0.4em] bg-paper text-ink focus:outline-none focus:border-ink"
        />
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <button disabled={busy || code.length !== 6} className="w-full py-3 bg-ink text-paper text-sm rounded-md disabled:opacity-50">
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-mute">
        Lost access to your authenticator?{" "}
        <a href="mailto:info@uktalentlink.co.uk" className="underline">Contact us</a> ·{" "}
        <button
          type="button"
          className="underline"
          onClick={async () => {
            await signOutFn();
            await router.invalidate();
            await router.navigate({ to: "/" });
          }}
        >
          Sign out
        </button>
      </p>
    </div>
  );
}
