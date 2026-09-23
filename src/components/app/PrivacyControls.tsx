import { useState } from "react";
import { privacyRequestFn, myPrivacyRequestsFn } from "@/lib/operations-functions";
export function PrivacyControls() {
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof myPrivacyRequestsFn>> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function request(kind: "export" | "erasure") {
    if (
      kind === "erasure" &&
      !confirm(
        "Request deletion of your personal data? The team will review the request and any required retention before taking action.",
      )
    )
      return;
    setBusy(true);
    try {
      await privacyRequestFn({ data: { kind } });
      setRequests(await myPrivacyRequestsFn());
      setMessage(
        "Request saved for review. This does not mean deletion or a full export has already completed.",
      );
    } catch {
      setMessage("Your request could not be saved. Please try again or contact the team.");
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    try {
      setRequests(await myPrivacyRequestsFn());
      setMessage("");
    } catch {
      setMessage("Request history is unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="my-10 rounded-md border border-rule p-6">
      <h2 className="font-display text-2xl">Your data</h2>
      <p className="text-sm text-ink-soft my-3">
        Download a copy of your account and recruitment data, or request a reviewed export or
        erasure. Original CVs remain available on your CV page.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/api/privacy/export" className="border border-rule rounded-full px-4 py-2">
          Download my data
        </a>
        <button
          disabled={busy}
          onClick={() => request("export")}
          className="border border-rule rounded-full px-4 py-2"
        >
          Request full export
        </button>
        <button
          disabled={busy}
          onClick={() => request("erasure")}
          className="border border-rule rounded-full px-4 py-2"
        >
          Request erasure
        </button>
        <button disabled={busy} onClick={refresh} className="underline">
          Check requests
        </button>
      </div>
      <p role="status" className="my-3 text-sm">
        {message}
      </p>
      {requests?.map((r) => (
        <p key={r.id} className="py-2 border-t border-rule text-sm">
          {r.kind} · {r.status} · {new Date(r.created_at).toLocaleDateString()}
          {r.resolution && <span className="block text-ink-soft">{r.resolution}</span>}
        </p>
      ))}
      {requests?.length === 0 && <p>No requests yet.</p>}
    </section>
  );
}
