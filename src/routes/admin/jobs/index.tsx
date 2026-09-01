import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminDeleteJobFn, adminListJobsFn } from "@/lib/server/functions";
import { AdminHeader, AdminTable, AdminTr, AdminTd, AdminBtn } from "../../admin";

export const Route = createFileRoute("/admin/jobs/")({
  loader: async () => adminListJobsFn({ data: {} }),
  component: AdminJobsList,
});

function AdminJobsList() {
  const jobs = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function deleteJob(id: string, title: string) {
    if (!confirm(`Delete mandate "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      await adminDeleteJobFn({ data: { id } });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="Mandates"
        sub={`${jobs.filter((j) => j.status === "open").length} open · ${jobs.length} total`}
        actions={
          <Link
            to="/admin/jobs/new"
            className="text-[12px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
          >
            + Add mandate
          </Link>
        }
      />

      {jobs.length === 0 ? (
        <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft text-sm">
          No mandates yet.{" "}
          <Link to="/admin/jobs/new" className="underline">
            Add the first one
          </Link>
          .
        </div>
      ) : (
        <AdminTable head={["Title", "Company", "Location", "Sector", "Seniority", "Status", ""]}>
          {jobs.map((j) => (
            <AdminTr key={j.id}>
              <AdminTd>
                <Link
                  to="/admin/jobs/$id"
                  params={{ id: j.id }}
                  className="font-medium text-ink hover:underline"
                >
                  {j.title}
                </Link>
              </AdminTd>
              <AdminTd className="text-ink-soft">{j.company ?? "—"}</AdminTd>
              <AdminTd className="text-ink-soft">{j.location ?? "—"}</AdminTd>
              <AdminTd className="text-ink-soft">{j.sector ?? "—"}</AdminTd>
              <AdminTd className="text-ink-soft capitalize">{j.seniority ?? "—"}</AdminTd>
              <AdminTd>
                <span
                  className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${
                    j.status === "open"
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-rule text-ink-mute"
                  }`}
                >
                  {j.status}
                </span>
              </AdminTd>
              <AdminTd className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link to="/admin/jobs/$id" params={{ id: j.id }}>
                    <AdminBtn>Edit</AdminBtn>
                  </Link>
                  <AdminBtn
                    variant="danger"
                    onClick={() => deleteJob(j.id, j.title)}
                    disabled={busy === j.id}
                  >
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
