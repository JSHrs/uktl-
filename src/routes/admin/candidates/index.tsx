import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminDeleteCandidateFn, listCandidatesFn } from "@/lib/server/functions";
import { AdminHeader, AdminTable, AdminTr, AdminTd, AdminBtn } from "../../admin";
import { ScoreBar, StatusPill } from "@/components/app/AppLayout";

export const Route = createFileRoute("/admin/candidates/")({
  loader: async () => listCandidatesFn({ data: {} }),
  component: AdminCandidatesList,
});

function AdminCandidatesList() {
  const candidates = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = query
    ? candidates.filter((c) =>
        [c.name, c.email, c.headline, c.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : candidates;

  async function deleteCandidate(id: string, name: string | null) {
    if (!confirm(`Delete candidate "${name ?? id}"? All associated data will be removed.`)) return;
    setBusy(id);
    try {
      await adminDeleteCandidateFn({ data: { id } });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="Candidates"
        sub={`${candidates.filter((c) => c.status === "parsed").length} parsed · ${candidates.length} total`}
      />

      <div className="mb-5">
        <input
          type="search"
          placeholder="Search by name, email, headline…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm border border-rule rounded px-4 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft text-sm">
          {query ? "No candidates match." : "No candidates yet."}
        </div>
      ) : (
        <AdminTable head={["Name", "Headline", "Seniority", "Quality", "Status", ""]}>
          {filtered.map((c) => (
            <AdminTr key={c.id}>
              <AdminTd>
                <Link
                  to="/app/candidates/$id"
                  params={{ id: c.id }}
                  className="font-medium text-ink hover:underline"
                  target="_blank"
                >
                  {c.name ?? "(unnamed)"}
                </Link>
                <div className="text-xs text-ink-mute mt-0.5">{c.source_filename ?? c.id}</div>
              </AdminTd>
              <AdminTd className="text-ink-soft text-xs max-w-48 truncate">{c.headline ?? "—"}</AdminTd>
              <AdminTd className="text-ink-soft capitalize">{c.seniority ?? "—"}</AdminTd>
              <AdminTd>
                {c.quality_score != null ? (
                  <div className="w-28">
                    <ScoreBar value={c.quality_score} />
                  </div>
                ) : (
                  <span className="text-ink-mute">—</span>
                )}
              </AdminTd>
              <AdminTd>
                <StatusPill status={c.status} />
              </AdminTd>
              <AdminTd className="text-right">
                <AdminBtn
                  variant="danger"
                  onClick={() => deleteCandidate(c.id, c.name)}
                  disabled={busy === c.id}
                >
                  Delete
                </AdminBtn>
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
