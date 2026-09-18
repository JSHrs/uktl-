import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listHrHistoryFn } from "@/lib/hr-functions";
import { DataError } from "@/components/app/DataError";
export const Route = createFileRoute("/app/hr/history")({
  loader: () => listHrHistoryFn({ data: {} }),
  errorComponent: DataError,
  component: History,
});
function History() {
  const initial = Route.useLoaderData();
  const [items, setItems] = useState(initial.items),
    [cursor, setCursor] = useState(initial.nextCursor),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function more() {
    if (!cursor || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await listHrHistoryFn({ data: { cursor } });
      setItems((old) => [...old, ...r.items.filter((i) => !old.some((o) => o.id === i.id))]);
      setCursor(r.nextCursor);
    } catch {
      setError("History could not be loaded. Retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="max-w-3xl space-y-6">
      <h1 className="text-3xl">Your HR questions</h1>
      <Link to="/app/hr" className="underline">
        Ask a question
      </Link>
      {items.length === 0 && <p>No saved questions yet.</p>}
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.id} className="border border-rule p-4">
            <Link to="/app/hr/answer" search={{ id: i.id }} className="underline">
              {i.question}
            </Link>
            <p className="text-sm">
              {new Date(Number(i.created_at)).toLocaleDateString()} · Resolution:{" "}
              {i.resolution_type ?? "not recorded"}
            </p>
          </li>
        ))}
      </ul>
      {cursor && (
        <button disabled={busy} onClick={more} className="underline">
          Load more
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
