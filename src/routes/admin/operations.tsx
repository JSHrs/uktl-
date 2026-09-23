import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getOperationsFn,
  retryFileDeletionFn,
  reviewPrivacyRequestFn,
} from "@/lib/operations-functions";
export const Route = createFileRoute("/admin/operations")({
  loader: () => getOperationsFn(),
  component: Operations,
});
function Operations() {
  const data = Route.useLoaderData(),
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function retry(id: string) {
    setBusy(true);
    try {
      await retryFileDeletionFn({ data: { id } });
      setMessage("Private file cleanup completed.");
      await router.invalidate();
    } catch {
      setMessage("Cleanup is still pending. Check storage configuration before retrying.");
    } finally {
      setBusy(false);
    }
  }
  async function review(id: string) {
    const resolution = prompt(
      "Enter a factual review update for the candidate (at least 10 characters). Do not include internal notes.",
    );
    if (!resolution) return;
    setBusy(true);
    try {
      await reviewPrivacyRequestFn({ data: { id, status: "reviewing", resolution } });
      await router.invalidate();
    } catch {
      setMessage("Review update failed. Reload and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Operations & privacy</h1>
        <p className="text-sm text-ink-soft mt-2">
          Checked {new Date(data.checkedAt).toLocaleString()}. Refresh to retrieve a new snapshot.
        </p>
        <button className="underline mt-2" disabled={busy} onClick={() => router.invalidate()}>
          Refresh
        </button>
      </header>
      <p role="status">{message}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Failed CV tasks", data.queue.failed],
          ["Expired leases", data.queue.expired],
          ["Overdue tasks", data.queue.overdue],
          ["Undelivered booking events", data.failedDeliveries],
        ].map(([title, n]) => (
          <div key={title} className="border border-rule rounded p-4">
            <p className="text-xs text-ink-soft">{title}</p>
            <p className="text-2xl mt-2">{n}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="font-display text-2xl mb-3">Vacancy sync</h2>
        <Records rows={data.sync} />
        {!data.sync.length && (
          <p>No sync has been recorded. This is not a healthy-sync confirmation.</p>
        )}
      </section>
      <section>
        <h2 className="font-display text-2xl mb-3">AI usage · last 24 hours</h2>
        <p className="text-sm text-ink-soft mb-3">
          Provider calls and reported token usage. Missing counts are unknown, not zero. Started
          calls may have been interrupted and still incurred charges. Reconcile provider billing,
          including cache pricing, before reporting monetary spend. A shared hourly call limit
          bounds new requests.
        </p>
        <Records rows={data.usage} />
        {!data.usage.length && <p>No usage recorded in this window.</p>}
      </section>
      <section>
        <h2 className="font-display text-2xl mb-3">Private file cleanup</h2>
        {data.deletions.map((r) => (
          <div key={r.id} className="border-b border-rule py-3 flex flex-wrap gap-4">
            <span className="break-all">CV record {r.candidate_id}</span>
            <button disabled={busy} className="underline" onClick={() => retry(r.id)}>
              Retry cleanup
            </button>
          </div>
        ))}
        {!data.deletions.length && <p>No pending deletions.</p>}
      </section>
      <section>
        <h2 className="font-display text-2xl mb-3">Privacy requests</h2>
        <p className="text-sm text-ink-soft mb-3">
          Review identity, scope, retention obligations and external provider records before
          fulfillment. This queue never labels an unperformed erasure as complete.
        </p>
        {data.privacy.map((r) => (
          <div key={r.id} className="border-b border-rule py-3">
            <p className="break-all">
              {r.kind} · {r.status} · account {r.user_id}
            </p>
            <p className="text-sm">Received {new Date(r.created_at).toLocaleDateString()}</p>
            <button className="underline mt-2" disabled={busy} onClick={() => review(r.id)}>
              Record review update
            </button>
          </div>
        ))}
        {!data.privacy.length && <p>No open requests.</p>}
      </section>
      <section>
        <h2 className="font-display text-2xl mb-3">Latest audit events</h2>
        <p className="text-sm text-ink-soft mb-3">
          Latest 100 changes. Only identifiers, actor and action are recorded; no CVs or private
          message bodies.
        </p>
        <Records rows={data.audit} />
      </section>
    </section>
  );
}
function Records({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto border border-rule rounded">
      <table className="text-xs w-full">
        <thead>
          <tr>
            {keys.map((k) => (
              <th scope="col" key={k} className="text-left px-3 py-2 font-medium whitespace-nowrap">
                {k.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-rule">
              {keys.map((k) => (
                <td key={k} className="p-3 max-w-xs break-words">
                  {r[k] == null ? "Unknown" : String(r[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
