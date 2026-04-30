import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  listCandidatesFn,
  insertCandidateFn,
  updateCandidateFn,
  analyseCandidateFn,
} from "@/lib/server/functions";
import {
  Badge,
  Spinner,
  PreviewBanner,
} from "@/components/dashboard/primitives";
import {
  STAGES,
  type Candidate,
  type Stage,
} from "@/lib/schemas";

export const Route = createFileRoute("/app/recruitment")({
  loader: async () => {
    const candidates = await listCandidatesFn();
    return { candidates };
  },
  component: RecruitmentPage,
});

function RecruitmentPage() {
  const { candidates: initial } = Route.useLoaderData();
  const [candidates, setCandidates] = useState<Candidate[]>(initial);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [adding, setAdding] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [newC, setNewC] = useState({
    name: "",
    role: "",
    client: "",
    email: "",
    notes: "",
    stage: "Sourced" as Stage,
  });

  const previewMode =
    candidates.length > 0 && candidates[0]?.id?.startsWith("cand_seed_") === true;

  const stageCount = (s: Stage) =>
    candidates.filter((c) => c.stage === s).length;

  const updateStage = async (id: string, stage: Stage) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage } : c)),
    );
    if (selected?.id === id) setSelected({ ...selected, stage });
    try {
      await updateCandidateFn({ data: { id, stage } });
    } catch {
      // optimistic
    }
  };

  const addCandidate = async () => {
    if (!newC.name || !newC.role) return;
    try {
      const r = await insertCandidateFn({
        data: {
          name: newC.name,
          role: newC.role,
          client: newC.client || null,
          email: newC.email || null,
          stage: newC.stage,
          notes: newC.notes || null,
        },
      });
      setCandidates((prev) => [r.candidate as Candidate, ...prev]);
      setAdding(false);
      setNewC({
        name: "",
        role: "",
        client: "",
        email: "",
        notes: "",
        stage: "Sourced",
      });
    } catch {
      // ignore
    }
  };

  const generateAnalysis = async () => {
    if (!selected) return;
    setAnalysing(true);
    try {
      const r = await analyseCandidateFn({ data: { id: selected.id } });
      const updated = { ...selected, ai_analysis: r.analysis };
      setSelected(updated);
      setCandidates((prev) =>
        prev.map((c) => (c.id === selected.id ? updated : c)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setSelected({ ...selected, ai_analysis: `Error: ${msg}` });
    } finally {
      setAnalysing(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 85 ? "var(--green)" : s >= 65 ? "var(--amber)" : "var(--red)";

  return (
    <div>
      <PreviewBanner when={previewMode} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {STAGES.map((s) => (
          <div
            key={s}
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 4,
              padding: "14px 12px",
              textAlign: "center",
            }}
          >
            <div
              className="font-serif"
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--navy)",
                lineHeight: 1.1,
              }}
            >
              {stageCount(s)}
            </div>
            <div
              style={{ fontSize: 11, color: "var(--muted-c)", marginTop: 2 }}
            >
              {s}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1fr 380px" : "1fr",
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
              All Candidates ({candidates.length})
            </h3>
            <button
              onClick={() => setAdding(true)}
              style={{
                background: "var(--navy)",
                color: "white",
                padding: "9px 20px",
                borderRadius: 3,
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + Add Candidate
            </button>
          </div>

          {adding && (
            <div
              className="anim-fadein"
              style={{
                background: "white",
                border: "1px solid var(--gold)",
                borderRadius: 4,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                New Candidate
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {(
                  [
                    ["name", "Full Name *"],
                    ["role", "Role *"],
                    ["client", "Client"],
                    ["email", "Email"],
                    ["stage", "Stage"],
                  ] as const
                ).map(([k, l]) => (
                  <div key={k}>
                    <label style={miniLabel}>{l}</label>
                    {k === "stage" ? (
                      <select
                        value={newC.stage}
                        onChange={(e) =>
                          setNewC({ ...newC, stage: e.target.value as Stage })
                        }
                        style={smallInput}
                      >
                        {STAGES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={newC[k]}
                        onChange={(e) =>
                          setNewC({ ...newC, [k]: e.target.value })
                        }
                        style={smallInput}
                      />
                    )}
                  </div>
                ))}
              </div>
              <textarea
                value={newC.notes}
                onChange={(e) => setNewC({ ...newC, notes: e.target.value })}
                placeholder="Candidate notes..."
                rows={2}
                style={{ ...smallInput, resize: "none", marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={addCandidate}
                  style={{
                    padding: "9px 20px",
                    background: "var(--green)",
                    color: "white",
                    borderRadius: 3,
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setAdding(false)}
                  style={{
                    padding: "9px 16px",
                    background: "#f5f5f5",
                    border: "none",
                    borderRadius: 3,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
                    "Candidate",
                    "Role",
                    "Client",
                    "Stage",
                    "Score",
                    "Date",
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      cursor: "pointer",
                      background: selected?.id === c.id ? "#fdf8f0" : "white",
                    }}
                  >
                    <td
                      style={{
                        ...td,
                        fontWeight: 500,
                        fontSize: 14,
                        color: "var(--ink)",
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        ...td,
                        fontSize: 13,
                        color: "var(--slate)",
                      }}
                    >
                      {c.role}
                    </td>
                    <td
                      style={{
                        ...td,
                        fontSize: 13,
                        color: "var(--muted-c)",
                      }}
                    >
                      {c.client ?? "—"}
                    </td>
                    <td style={td}>
                      <Badge text={c.stage} />
                    </td>
                    <td style={td}>
                      <span
                        className="font-serif"
                        style={{
                          color: scoreColor(c.score),
                          fontWeight: 600,
                          fontSize: 15,
                        }}
                      >
                        {c.score}
                      </span>
                    </td>
                    <td
                      style={{
                        ...td,
                        fontSize: 12,
                        color: "var(--muted-c)",
                      }}
                    >
                      {new Date(c.created_at).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
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
                      No candidates yet. Click + Add Candidate to start.
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
                padding: "18px 22px",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 500 }}>
                  {selected.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--muted-c)",
                    marginTop: 2,
                  }}
                >
                  {selected.role} · {selected.client ?? "—"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  color: "var(--muted-c)",
                  fontSize: 18,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px 22px" }}>
              <div style={{ marginBottom: 18 }}>
                <label style={miniLabel}>Stage</label>
                <select
                  value={selected.stage}
                  onChange={(e) =>
                    updateStage(selected.id, e.target.value as Stage)
                  }
                  style={smallInput}
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              {selected.notes && (
                <div
                  style={{
                    background: "#f9f8f6",
                    padding: 14,
                    borderRadius: 3,
                    marginBottom: 18,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--muted-c)",
                      marginBottom: 6,
                    }}
                  >
                    Notes
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--slate)",
                      lineHeight: 1.65,
                    }}
                  >
                    {selected.notes}
                  </p>
                </div>
              )}

              <div
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  paddingTop: 18,
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
                  AI Analysis
                </p>
                {selected.ai_analysis ? (
                  <div
                    style={{
                      background: "#fafdf9",
                      border: "1px solid rgba(0,0,0,0.06)",
                      padding: 14,
                      borderRadius: 3,
                      fontSize: 13,
                      color: "var(--ink)",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selected.ai_analysis}
                  </div>
                ) : (
                  <button
                    onClick={generateAnalysis}
                    disabled={analysing}
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
                      opacity: analysing ? 0.7 : 1,
                      border: "none",
                      cursor: analysing ? "wait" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {analysing ? (
                      <>
                        <Spinner size={14} /> Analysing…
                      </>
                    ) : (
                      "✨ Generate AI Analysis"
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
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--muted-c)",
  fontWeight: 500,
  borderBottom: "1px solid rgba(0,0,0,0.08)",
};
const td: React.CSSProperties = { padding: "13px 16px" };

const miniLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--muted-c)",
  display: "block",
  marginBottom: 5,
};
const smallInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 3,
  fontSize: 13,
  background: "white",
  fontFamily: "inherit",
};
