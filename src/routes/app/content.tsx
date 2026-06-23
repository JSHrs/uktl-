import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Lightbulb,
  Library,
  Save,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  listContentFn,
  generateContentFn,
  saveContentFn,
} from "@/lib/functions";
import {
  Badge,
  Spinner,
  PreviewBanner,
} from "@/components/dashboard/primitives";
import {
  CONTENT_TYPES,
  TONES,
  type ContentType,
  type Tone,
} from "@/lib/schemas";

export const Route = createFileRoute("/app/content")({
  loader: async () => {
    const items = await listContentFn();
    return { items };
  },
  component: ContentPage,
});

const SUGGESTIONS = [
  "The New UK Employment Rights Bill: What Employers Need to Know",
  "How to Handle Disciplinary Procedures Without Risking a Tribunal",
  "Hiring in the UAE vs UK: Key Differences for British Businesses",
  "TUPE Transfers Explained: A Guide for Employers",
  "Building an HR Framework for a Scaling Business",
];

function ContentPage() {
  const router = useRouter();
  const { items } = Route.useLoaderData();
  const [type, setType] = useState<ContentType>("Blog Article");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("Professional & Authoritative");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    content: string;
    type: ContentType;
    tone: Tone;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const previewMode =
    items.length > 0 && items[0]?.id?.startsWith("cont_seed_") === true;

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const r = await generateContentFn({
        data: { type, topic: topic.trim(), tone },
      });
      setResult({ title: topic.trim(), content: r.content, type, tone });
      setEditedContent(r.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!result) return;
    try {
      await saveContentFn({
        data: {
          title: result.title,
          type: result.type,
          tone: result.tone,
          content: editedContent,
        },
      });
      setResult(null);
      setTopic("");
      setEditedContent("");
      router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const wordCount = editedContent.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(wordCount / 200));

  return (
    <div>
      <PreviewBanner when={previewMode} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
          paddingBottom: 18,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--muted-c)",
              marginBottom: 6,
            }}
          >
            AI Studio · Content Workshop
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            Craft <span style={{ fontStyle: "italic", color: "#6366f1" }}>publish-ready</span> content
          </h1>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: "#6366f1",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 999,
          }}
        >
          <Wand2 size={12} /> {items.length} in library
        </span>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}
      >
        {/* LEFT — generator */}
        <div>
          <div
            style={{
              position: "relative",
              background:
                "linear-gradient(180deg, white 0%, #fafaff 100%)",
              border: "1px solid rgba(99,102,241,0.18)",
              borderRadius: 8,
              padding: 22,
              marginBottom: 16,
              boxShadow: "0 8px 24px -16px rgba(99,102,241,0.25)",
            }}
          >
            <SectionTitle icon={<Sparkles size={14} />} title="Generate Content" />

            <div style={{ marginBottom: 16, marginTop: 16 }}>
              <label style={fieldLabel}>Content Type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: "7px 12px",
                      fontSize: 12,
                      borderRadius: 999,
                      background:
                        type === t
                          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                          : "white",
                      color: type === t ? "white" : "var(--slate)",
                      border:
                        type === t
                          ? "1px solid transparent"
                          : "1px solid rgba(0,0,0,0.08)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: type === t ? 500 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>Topic / Title</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="E.g. 'How to conduct a fair disciplinary hearing in the UK'"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 6,
                  fontSize: 13,
                  resize: "vertical",
                  color: "var(--ink)",
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                  background: "white",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "white",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                {TONES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <button
              onClick={generate}
              disabled={generating || !topic.trim()}
              style={{
                width: "100%",
                background: generating
                  ? "var(--muted-c)"
                  : "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                color: "white",
                padding: "13px 14px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: !topic.trim() ? 0.5 : 1,
                cursor: !topic.trim() || generating ? "not-allowed" : "pointer",
                border: "none",
                fontFamily: "inherit",
                boxShadow: generating
                  ? "none"
                  : "0 8px 20px -8px rgba(99,102,241,0.55)",
                transition: "all 0.15s",
              }}
            >
              {generating ? (
                <>
                  <Spinner size={14} /> Writing with AI…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate Content
                </>
              )}
            </button>
            {error && (
              <p
                style={{
                  color: "var(--red)",
                  fontSize: 12,
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "rgba(200,60,60,0.08)",
                  borderRadius: 4,
                }}
              >
                {error}
              </p>
            )}
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 8,
              padding: 18,
            }}
          >
            <SectionTitle
              icon={<Lightbulb size={14} />}
              title="Topic Suggestions"
              accent="#f59e0b"
            />
            <div style={{ marginTop: 12 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "1px solid transparent",
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: "var(--slate)",
                    cursor: "pointer",
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                    marginBottom: 4,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fafaff";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <ArrowRight size={12} color="#6366f1" />
                  <span style={{ flex: 1 }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — output or library */}
        <div>
          {result ? (
            <div
              className="anim-fadein"
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 8,
                padding: 28,
                boxShadow: "0 12px 32px -20px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                  paddingBottom: 18,
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge text={result.type} />
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted-c)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {result.tone}
                    </span>
                  </div>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginTop: 10,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                    }}
                  >
                    {result.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--muted-c)",
                    }}
                  >
                    <span>{wordCount.toLocaleString()} words</span>
                    <span>·</span>
                    <span>{readMins} min read</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={save}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 16px",
                      background: "var(--green)",
                      color: "white",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 12px -4px rgba(45,155,111,0.5)",
                    }}
                  >
                    <Save size={13} /> Save to Library
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setEditedContent("");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 14px",
                      background: "white",
                      color: "var(--slate)",
                      borderRadius: 6,
                      fontSize: 12,
                      border: "1px solid rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Trash2 size={13} /> Discard
                  </button>
                </div>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={28}
                style={{
                  width: "100%",
                  border: "none",
                  fontSize: 14.5,
                  lineHeight: 1.85,
                  color: "var(--ink)",
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none",
                  minHeight: 480,
                  background: "transparent",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 8,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <SectionTitle
                  icon={<Library size={14} />}
                  title="Saved Content Library"
                  accent="#06b6d4"
                />
                <span style={{ fontSize: 12, color: "var(--muted-c)" }}>
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>
              {items.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    border: "1.5px dashed rgba(0,0,0,0.1)",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6366f1",
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <p
                    style={{
                      color: "var(--ink)",
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    No content saved yet
                  </p>
                  <p style={{ color: "var(--muted-c)", fontSize: 12.5 }}>
                    Generate something with the panel on the left to begin.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {items.map((s: typeof items[number]) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 16px",
                        background: "#fafafa",
                        border: "1px solid rgba(0,0,0,0.05)",
                        borderRadius: 6,
                        transition: "all 0.15s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fafaff";
                        e.currentTarget.style.borderColor =
                          "rgba(99,102,241,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fafafa";
                        e.currentTarget.style.borderColor =
                          "rgba(0,0,0,0.05)";
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            color: "var(--ink)",
                            marginBottom: 6,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Badge text={s.type} />
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--muted-c)",
                            }}
                          >
                            {s.word_count} words ·{" "}
                            {new Date(s.created_at)
                              .toISOString()
                              .slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  accent = "#6366f1",
}: {
  icon: React.ReactNode;
  title: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: 6,
          background: `${accent}1f`,
          color: accent,
        }}
      >
        {icon}
      </span>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </h3>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--muted-c)",
  marginBottom: 8,
};
