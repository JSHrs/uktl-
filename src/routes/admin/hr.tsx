import { useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  listHrSourcesFn,
  retrieveHrSourceFn,
  reviewHrSourceFn,
} from "@/lib/hr-functions";
import { adminListFaqFn } from "@/lib/functions";
import { AdminHeader, AdminField, AdminBtn, inputCls, textareaCls } from "@/routes/admin";
export const Route = createFileRoute("/admin/hr")({
  loader: async () => ({ sources: await listHrSourcesFn(), topics: await adminListFaqFn() }),
  component: HrReview,
});
function HrReview() {
  const { sources, topics } = Route.useLoaderData(),
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-8">
      <AdminHeader
        title="HR content review"
        sub="Only reviewed content is offered to users. Approval requires a qualified human review; importing is not approval."
      />
      {error && <p role="alert">{error}</p>}
      <section className="space-y-4">
        <h2 className="text-xl">Retrieve an ACAS guidance page</h2>
        <p className="text-sm">
          The exact HTTPS page is fetched with redirects disabled. Review its extracted text against
          the original. Retrieval or re-retrieval unpublishes that source. Approval expires after 30
          days or earlier withdrawal; check legal changes before relying on it.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(() =>
              retrieveHrSourceFn({
                data: {
                  url: String(f.get("url")),
                  title: String(f.get("title")),
                  category: String(f.get("category")),
                },
              }),
            );
          }}
        >
          <AdminField label="ACAS URL">
            <input
              name="url"
              type="url"
              required
              maxLength={500}
              placeholder="https://www.acas.org.uk/..."
              className={inputCls}
            />
          </AdminField>
          <AdminField label="Source title">
            <input name="title" required maxLength={200} className={inputCls} />
          </AdminField>
          <AdminField label="Category">
            <select name="category" className={inputCls}>
              {[
                "dismissal",
                "contracts",
                "discrimination",
                "pay",
                "redundancy",
                "holiday",
                "working-time",
                "leave",
                "whistleblowing",
                "settlement",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </AdminField>
          <AdminBtn type="submit" disabled={busy}>
            Retrieve for review
          </AdminBtn>
        </form>
        {sources.map((s) => (
          <article key={s.id} className="border border-rule p-4 space-y-3">
            <h3>
              {s.title} · {s.active ? "approved" : "not approved"}
            </h3>
            <a href={s.url} target="_blank" rel="noreferrer" className="underline">
              Original guidance
            </a>
            <p className="text-xs">
              Retrieved {new Date(Number(s.retrieved_at)).toLocaleString()}. Sources must be both
              retrieved and reviewed within 30 days to be used.
            </p>
            <details>
              <summary>Review extracted text</summary>
              <p className="whitespace-pre-wrap text-sm my-4">{s.body}</p>
            </details>
            <AdminBtn
              disabled={busy}
              onClick={() =>
                act(() =>
                  reviewHrSourceFn({ data: { id: s.id, hash: s.content_hash, active: !s.active } }),
                )
              }
            >
              {s.active ? "Withdraw source" : "I have reviewed this version — approve"}
            </AdminBtn>
          </article>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl">FAQ answers and videos</h2>
        <p className="text-sm text-ink-soft">
          Write answers, upload videos, captions and posters, and approve topics for candidates from each topic&apos;s
          page. Any change to an approved topic withdraws approval until it is reviewed again.
        </p>
        <ul className="border border-rule rounded-md divide-y divide-rule">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center gap-4 px-4 py-2 text-sm">
              <Link to="/admin/faq/$id" params={{ id: t.id }} className="underline flex-1">
                {t.title}
              </Link>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-mute">
                {t.reviewed_at ? "approved" : "needs review"}
              </span>
            </li>
          ))}
        </ul>
        <Link to="/admin/faq/new" className="underline text-sm">Add a topic</Link>
      </section>
    </div>
  );
}
