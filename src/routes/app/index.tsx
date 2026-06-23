import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowUpRight, X } from "lucide-react";
import {
  listLeadsFn,
  updateLeadFn,
  draftLeadReplyFn,
} from "@/lib/functions";
import {
  Badge,
  Spinner,
  StatCard,
  PreviewBanner,
} from "@/components/dashboard/primitives";
import {
  STATUS_OPTIONS,
  type Lead,
  type LeadStatus,
} from "@/lib/schemas";

export const Route = createFileRoute("/app/")({
  loader: async () => {
    const leads = await listLeadsFn();
    return { leads };
  },
  component: LeadsPage,
});

function LeadsPage() {
  const { leads: initial } = Route.useLoaderData();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [drafting, setDrafting] = useState(false);

  const previewMode =
    leads.length > 0 && leads[0]?.id?.startsWith("lead_seed_") === true;

  const filtered =
    filter === "All"
      ? leads
      : leads.filter((l) => l.priority === filter || l.status === filter);

  const statusUpdate = async (id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );
    if (selected?.id === id) setSelected({ ...selected, status });
    try {
      await updateLeadFn({ data: { id, status } });
    } catch {
      // optimistic — leave UI as-is even on error in preview mode
    }
  };

  const generateDraft = async () => {
    if (!selected) return;
    setDrafting(true);
    try {
      const result = await draftLeadReplyFn({ data: { id: selected.id } });
      const updated = { ...selected, ai_draft: result.draft };
      setSelected(updated);
      setLeads((prev) =>
        prev.map((l) => (l.id === selected.id ? updated : l)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Draft failed";
      setSelected({ ...selected, ai_draft: `Error generating draft:\n\n${msg}` });
    } finally {
      setDrafting(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "var(--green)" : s >= 50 ? "var(--amber)" : "var(--red)";

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const highPriority = leads.filter((l) => l.priority === "High").length;
  const avgScore =
    leads.length === 0
      ? 0
      : Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length);

  return (
    <div>
      <PreviewBanner when={previewMode} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1fr 420px" : "1fr",
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard label="Total Leads" value={totalLeads} />
            <StatCard label="New" value={newLeads} color="#1d4ed8" />
            <StatCard
              label="High Priority"
              value={highPriority}
              color="var(--red)"
            />
            <StatCard
              label="Avg Score"
              value={avgScore}
              color="var(--green)"
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              "All",
              "High",
              "Medium",
              "Low",
              "New",
              "Contacted",
              "Qualified",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  background: filter === f ? "var(--navy)" : "white",
                  color: filter === f ? "white" : "var(--slate)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  fontWeight: filter === f ? 500 : 400,
                  fontFamily: "inherit",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f8f6" }}>
                  {[
                    "Name & Company",
                    "Service",
                    "Score",
                    "Priority",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    style={{
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      cursor: "pointer",
                      background: selected?.id === l.id ? "#fdf8f0" : "white",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={td}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: "var(--ink)",
                        }}
                      >
                        {l.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--muted-c)",
                          marginTop: 2,
                        }}
                      >
                        {l.company ?? "—"}
                      </div>
                    </td>
                    <td
                      style={{
                        ...td,
                        fontSize: 13,
                        color: "var(--slate)",
                      }}
                    >
                      {l.service}
                    </td>
                    <td style={td}>
                      <span
                        className="font-serif"
                        style={{
                          fontWeight: 600,
                          color: scoreColor(l.score),
                          fontSize: 15,
                        }}
                      >
                        {l.score}
                      </span>
                      <span
                        style={{ color: "var(--muted-c)", fontSize: 11 }}
                      >
                        /100
                      </span>
                    </td>
                    <td style={td}>
                      <Badge text={l.priority} />
                    </td>
                    <td style={td}>
                      <Badge text={l.status} />
                    </td>
                    <td
                      style={{
                        ...td,
                        fontSize: 12,
                        color: "var(--muted-c)",
                      }}
                    >
                      {fmtDate(l.created_at)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--muted-c)",
                        fontSize: 13,
                      }}
                    >
                      No leads matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div
            className="anim-fadein"
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 4,
              overflow: "auto",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {selected.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--muted-c)",
                    marginTop: 2,
                  }}
                >
                  {selected.company ?? "Independent"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  color: "var(--muted-c)",
                  fontSize: 18,
                  padding: "0 4px",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  ["Email", selected.email],
                  ["Phone", selected.phone ?? "—"],
                  ["Service", selected.service],
                  ["Score", `${selected.score}/100`],
                ].map(([k, v]) => (
                  <div
                    key={k as string}
                    style={{
                      background: "#f9f8f6",
                      padding: "12px 14px",
                      borderRadius: 3,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--muted-c)",
                        marginBottom: 4,
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ink)",
                        fontWeight: 400,
                        wordBreak: "break-word",
                      }}
                    >
                      {v as string}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted-c)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Update Status
                </label>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    statusUpdate(selected.id, e.target.value as LeadStatus)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 3,
                    fontSize: 13,
                    background: "white",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              {selected.message && (
                <div
                  style={{
                    background: "#f9f8f6",
                    padding: 14,
                    borderRadius: 3,
                    marginBottom: 20,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--muted-c)",
                      marginBottom: 8,
                    }}
                  >
                    Their Message
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--slate)",
                      lineHeight: 1.7,
                    }}
                  >
                    {selected.message}
                  </p>
                </div>
              )}

              <div
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  paddingTop: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    color: "var(--slate)",
                    textTransform: "uppercase",
                    marginBottom: 12,
                    fontWeight: 500,
                  }}
                >
                  AI Draft Reply
                </p>

                {selected.ai_draft ? (
                  <div>
                    <textarea
                      defaultValue={selected.ai_draft}
                      rows={10}
                      style={{
                        width: "100%",
                        padding: 14,
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 3,
                        fontSize: 13,
                        lineHeight: 1.75,
                        resize: "vertical",
                        color: "var(--ink)",
                        background: "#fafdf9",
                        fontFamily: "inherit",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <a
                        href={`mailto:${selected.email}?subject=Re: Your enquiry to UK Talent Link&body=${encodeURIComponent(selected.ai_draft ?? "")}`}
                        style={{
                          flex: 1,
                          background: "var(--navy)",
                          color: "white",
                          padding: "10px",
                          borderRadius: 3,
                          fontSize: 13,
                          fontWeight: 500,
                          textAlign: "center",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        Send Email <ArrowUpRight size={14} />
                      </a>
                      <button
                        onClick={generateDraft}
                        disabled={drafting}
                        style={{
                          padding: "10px 14px",
                          background: "white",
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 3,
                          fontSize: 12,
                          color: "var(--slate)",
                          cursor: drafting ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {drafting ? "Working…" : "Regenerate"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generateDraft}
                    disabled={drafting}
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "var(--gold)",
                      color: "var(--navy)",
                      borderRadius: 3,
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: drafting ? 0.7 : 1,
                      border: "none",
                      cursor: drafting ? "wait" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {drafting ? (
                      <>
                        <Spinner size={14} /> Generating with AI…
                      </>
                    ) : (
                      "✨ Generate AI Reply Draft"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted-c)",
  fontWeight: 500,
  borderBottom: "1px solid rgba(0,0,0,0.08)",
};

const td: React.CSSProperties = {
  padding: "14px 16px",
};

function fmtDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
