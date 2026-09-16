import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  PageHeader,
  Pill,
  ScoreBar,
  StatusPill,
} from "@/components/app/AppLayout";
import { getViewerFn, listCandidatesFn } from "@/lib/functions";

export const Route = createFileRoute("/app/candidates/")({
  beforeLoad: async () => {
    const viewer = await getViewerFn();
    if (!viewer.isAdmin && !viewer.userId) throw redirect({ to: "/auth/login" });
  },
  loader: async () => await listCandidatesFn(),
  component: CandidatesListPage,
});

function CandidatesListPage() {
  const candidates = Route.useLoaderData();
  const [query, setQuery] = useState("");

  const filtered = candidates.filter((c) => {
    if (!query) return true;
    const haystack = [c.name, c.headline, c.email, c.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow="Candidates"
        title={
          <>
            Talent{" "}
            <em className="not-italic italic font-normal text-ink-soft">pool</em>
          </>
        }
        lede="Every parsed CV lives here, with a quality score, seniority signal, and click-through to matched mandates."
        actions={
          <Link
            to="/app/upload"
            className="text-[13px] px-[18px] py-2.5 border border-ink bg-ink text-paper rounded-full"
          >
            Upload CV
          </Link>
        }
      />

      <div className="mb-6 max-w-md">
        <input
          type="search"
          placeholder="Search by name, headline, email, location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-rule rounded-md px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-ink"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft">
          No candidates match. Try a looser search or{" "}
          <Link to="/app/upload" className="underline">
            upload a CV
          </Link>
          .
        </div>
      ) : (
        <div className="border border-rule rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper-deep text-ink-mute">
                <Th>Name</Th>
                <Th>Headline</Th>
                <Th>Location</Th>
                <Th>Seniority</Th>
                <Th>YoE</Th>
                <Th>Quality</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-rule hover:bg-paper-deep/40">
                  <Td>
                    <Link
                      to="/app/candidates/$id"
                      params={{ id: c.id }}
                      className="text-ink hover:underline font-medium"
                    >
                      {c.name ?? "(unnamed)"}
                    </Link>
                    <div className="text-xs text-ink-mute mt-0.5">
                      {c.source_filename ?? c.id}
                    </div>
                  </Td>
                  <Td>{c.headline ?? "—"}</Td>
                  <Td>{c.location ?? "—"}</Td>
                  <Td>{c.seniority ? <Pill>{c.seniority}</Pill> : "—"}</Td>
                  <Td className="tabular-nums text-ink-soft">
                    {c.total_years_experience ?? "—"}
                  </Td>
                  <Td>
                    {c.quality_score != null ? (
                      <div className="w-28">
                        <ScoreBar value={c.quality_score} />
                      </div>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <StatusPill status={c.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-mono text-[11px] tracking-[0.12em] uppercase px-4 py-3 text-ink-mute font-normal">
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
