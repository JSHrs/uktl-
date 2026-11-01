import { useEffect, useState } from "react";
import { toast } from "sonner";
import { twoStepDisableFn, twoStepEnrollFn, twoStepStatusFn, twoStepVerifyFn } from "@/lib/two-step-functions";

type Status = Awaited<ReturnType<typeof twoStepStatusFn>>;

/**
 * Optional two-step verification for candidate and employer accounts. Off by default;
 * once on, every new sign-in asks for a code from the authenticator app.
 */
export function TwoStepSetting() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [setup, setSetup] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setStatus(await twoStepStatusFn());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const on = status?.enabled ?? false;

  return (
    <section className="rounded-lg border border-rule p-6 my-8" aria-labelledby="two-step-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="two-step-title" className="font-display text-xl">Two-step verification</h2>
          <p className="mt-1 text-sm text-ink-soft max-w-[56ch]">
            Optional. When it's on, signing in also asks for a 6-digit code from an authenticator app such as Google
            Authenticator or 1Password.
          </p>
        </div>
        {status && (
          <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${on ? "bg-accent-soft text-accent border-accent/25" : "bg-paper-deep text-ink-mute border-rule"}`}>
            {on ? "On" : "Off"}
          </span>
        )}
      </div>

      {loadError && <p role="alert" className="mt-4 text-sm text-bad">Two-step settings are unavailable right now. Please try again later.</p>}

      {status && !on && !setup && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(async () => setSetup(await twoStepEnrollFn()))}
          className="mt-5 min-h-10 rounded-full bg-ink text-paper px-5 text-[14px] disabled:opacity-60"
        >
          {busy ? "Starting…" : "Turn on two-step verification"}
        </button>
      )}

      {setup && (
        <form
          className="mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] items-start"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await twoStepVerifyFn({ data: { factorId: setup.id, code } });
              setSetup(null);
              setCode("");
              toast.success("Two-step verification is on");
              await load();
            });
          }}
        >
          <img src={setup.qrCode} alt="QR code to add UK Talent Link to your authenticator app" className="w-44 h-44 bg-white p-2 rounded" />
          <div className="space-y-3 text-sm">
            <p>1. Scan the code with your authenticator app.</p>
            <details>
              <summary className="cursor-pointer underline">Can't scan? Enter the key instead</summary>
              <code className="mt-2 block break-all text-[12px]">{setup.secret}</code>
            </details>
            <label htmlFor="two-step-setup-code" className="block">2. Enter the 6-digit code it shows</label>
            <input
              id="two-step-setup-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-40 border border-rule rounded-md px-3 py-2 text-center tracking-[0.3em] bg-paper"
            />
            <div className="flex gap-2">
              <button disabled={busy || code.length !== 6} className="min-h-10 rounded-full bg-ink text-paper px-5 text-[14px] disabled:opacity-50">
                {busy ? "Checking…" : "Turn on"}
              </button>
              <button type="button" onClick={() => setSetup(null)} className="min-h-10 rounded-full border border-rule px-5 text-[14px]">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {status && on && !status.staff && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!confirm("Turn off two-step verification? Signing in will only need your password or email link.")) return;
            run(async () => {
              await twoStepDisableFn({ data: { factorId: status.factors[0].id } });
              toast("Two-step verification is off");
              await load();
            });
          }}
          className="mt-5 min-h-10 rounded-full border border-rule px-5 text-[14px] hover:border-ink"
        >
          Turn off
        </button>
      )}
      {status?.staff && on && <p className="mt-4 text-sm text-ink-mute">Staff accounts keep two-step verification on.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-bad">{error}</p>}
    </section>
  );
}
