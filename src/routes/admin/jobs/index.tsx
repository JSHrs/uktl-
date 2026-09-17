import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminDeleteJobFn, adminListJobsFn, syncReedJobsFn } from "@/lib/functions";
import type { Job } from "@/lib/schemas/job";
import { AdminHeader, AdminTable, AdminTr, AdminTd, AdminBtn } from "../../admin";

export const Route = createFileRoute("/admin/jobs/")({
  loader: async () => adminListJobsFn(),
  component: AdminJobsList,
});

function AdminJobsList() {
  const jobs = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ inserted: number; skipped: number; failed: number } | null>(null);

  async function syncFromReed() {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncReedJobsFn({ data: { keywords: "", sector: "construction", resultsToTake: 50 } });
      setSyncResult({ inserted: result.inserted, skipped: result.skipped, failed: result.failed });
      await router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reed sync failed");
    } finally {
      setSyncing(false);
    }
  }

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
        sub={`${jobs.filter((j: Job) => j.status === "open").length} open · ${jobs.length} total`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={syncFromReed}
              disabled={syncing}
              className="text-[12px] px-4 py-2 border border-rule text-ink-soft rounded-full hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
            >
              {syncing ? "Syncing…" : "Sync from Reed"}
            </button>
            <Link
              to="/admin/jobs/new"
              className="text-[12px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
            >
              + Add mandate
            </Link>
          </div>
        }
      />

      {syncResult && (
        <div className="mb-4 px-4 py-3 rounded-md border border-accent/30 bg-accent-soft text-sm text-accent">
          Reed sync complete — {syncResult.inserted} new mandate{syncResult.inserted !== 1 ? "s" : ""} imported
          {syncResult.skipped > 0 ? `, ${syncResult.skipped} already existed` : ""}
          {syncResult.failed > 0 ? `, ${syncResult.failed} failed — retry the sync` : ""}.
        </div>
      )}

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
          {jobs.map((j: Job) => (
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

