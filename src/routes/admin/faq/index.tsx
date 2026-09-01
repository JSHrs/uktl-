import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminDeleteFaqFn, adminListFaqFn, adminUpdateFaqFn } from "@/lib/server/functions";
import { AdminHeader, AdminTable, AdminTr, AdminTd, AdminBtn } from "../../admin";

export const Route = createFileRoute("/admin/faq/")({
  loader: async () => adminListFaqFn({ data: {} }),
  component: AdminFaqList,
});

function AdminFaqList() {
  const topics = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function togglePublish(id: string, published: number, topic: (typeof topics)[number]) {
    setBusy(id);
    try {
      await adminUpdateFaqFn({
        data: {
          id,
          title: topic.title,
          category: topic.category,
          keywords: topic.keywords,
          sector_tag: topic.sector_tag,
          video_url: topic.video_url,
          thumbnail: topic.thumbnail,
          duration_s: topic.duration_s,
          published: !published,
        },
      });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  async function deleteTopic(id: string) {
    if (!confirm("Delete this FAQ topic? This cannot be undone.")) return;
    setBusy(id);
    try {
      await adminDeleteFaqFn({ data: { id } });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="FAQ Topics"
        sub={`${topics.length} topics · ${topics.filter((t) => t.published).length} published`}
        actions={
          <Link
            to="/admin/faq/new"
            className="text-[12px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
          >
            + Add topic
          </Link>
        }
      />

      {topics.length === 0 ? (
        <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft text-sm">
          No FAQ topics yet.{" "}
          <Link to="/admin/faq/new" className="underline">
            Add the first one
          </Link>
          .
        </div>
      ) : (
        <AdminTable head={["Title", "Category", "Sector", "Duration", "Views", "Status", ""]}>
          {topics.map((t) => (
            <AdminTr key={t.id}>
              <AdminTd>
                <Link
                  to="/admin/faq/$id"
                  params={{ id: t.id }}
                  className="font-medium text-ink hover:underline"
                >
                  {t.title}
                </Link>
              </AdminTd>
              <AdminTd className="text-ink-soft capitalize">{t.category.replace("-", " ")}</AdminTd>
              <AdminTd className="text-ink-soft">{t.sector_tag ?? "—"}</AdminTd>
              <AdminTd className="font-mono text-xs text-ink-mute">
                {t.duration_s ? `${Math.floor(t.duration_s / 60)}:${String(t.duration_s % 60).padStart(2, "0")}` : "—"}
              </AdminTd>
              <AdminTd className="font-mono text-xs text-ink-mute tabular-nums">{t.view_count.toLocaleString()}</AdminTd>
              <AdminTd>
                <button
                  onClick={() => togglePublish(t.id, t.published, t)}
                  disabled={busy === t.id}
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border transition-colors ${
                    t.published
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-rule text-ink-mute"
                  }`}
                >
                  {t.published ? "published" : "draft"}
                </button>
              </AdminTd>
              <AdminTd className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link to="/admin/faq/$id" params={{ id: t.id }}>
                    <AdminBtn>Edit</AdminBtn>
                  </Link>
                  <AdminBtn variant="danger" onClick={() => deleteTopic(t.id)} disabled={busy === t.id}>
                    Delete
                  </AdminBtn>
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
