import { useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  listHrSourcesFn,
  retrieveHrSourceFn,
  reviewHrSourceFn,
  reviewVideoFn,
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
        <h2 className="text-xl">Approve video, captions and transcript</h2>
        <p className="text-sm">
          Upload reviewed MP4/WebM and VTT assets to private Storage bucket <code>uktl-videos</code>{" "}
          using paths under <code>videos/</code>. No uploads or content approval happen
          automatically. Then save their keys and the transcript here. Publish/unpublish the topic
          in{" "}
          <Link to="/admin/faq" className="underline">
            FAQ Topics
          </Link>
          .
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(() =>
              reviewVideoFn({
                data: {
                  id: String(f.get("id")),
                  videoKey: String(f.get("videoKey")),
                  captionsKey: String(f.get("captionsKey")),
                  transcript: String(f.get("transcript")),
                },
              }),
            );
          }}
        >
          <AdminField label="Topic">
            <select name="id" className={inputCls} required>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.reviewed_at ? " (reviewed)" : ""}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Video object key">
            <input name="videoKey" required placeholder="videos/topic.mp4" className={inputCls} />
          </AdminField>
          <AdminField label="Captions object key">
            <input
              name="captionsKey"
              required
              placeholder="videos/topic.vtt"
              className={inputCls}
            />
          </AdminField>
          <AdminField label="Reviewed transcript">
            <textarea
              name="transcript"
              required
              minLength={20}
              maxLength={50000}
              rows={8}
              className={textareaCls}
            />
          </AdminField>
          <AdminBtn type="submit" disabled={busy || !topics.length}>
            Approve these video assets
          </AdminBtn>
        </form>
      </section>
    </div>
  );
}
