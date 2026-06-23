import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  listContentFn,
  generateContentFn,
  saveContentFn,
} from "@/lib/server/functions";
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

  const previewMode = items.length > 0 && items[0]?.id?.startsWith("cont_seed_") === true;

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

  return (
    <div>
      <PreviewBanner when={previewMode} />

      <div
        style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}
      >
        <div>
          <div
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 4,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 20,
              }}
            >
              Generate Content
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Content Type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: "7px 12px",
                      fontSize: 12,
                      borderRadius: 3,
                      background: type === t ? "var(--navy)" : "#f5f5f5",
                      color: type === t ? "white" : "var(--slate)",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Topic / Title</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="E.g. 'How to conduct a fair disciplinary hearing in the UK'"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 3,
                  fontSize: 13,
                  resize: "vertical",
                  color: "var(--ink)",
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={label}>Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
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
                background: generating ? "var(--muted-c)" : "var(--gold)",
                color: "var(--navy)",
                padding: 12,
                borderRadius: 3,
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
              }}
            >
              {generating ? (
                <>
                  <Spinner size={14} /> Writing with AI…
                </>
              ) : (
                "✨ Generate Content"
              )}
            </button>
            {error && (
              <p
                style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}
              >
                {error}
              </p>
            )}
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 4,
              padding: 20,
            }}
          >
            <p
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted-c)",
                marginBottom: 12,
              }}
            >
              Topic Suggestions
            </p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  color: "var(--slate)",
                  cursor: "pointer",
                  borderBottom:
                    i < SUGGESTIONS.length - 1
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              >
                → {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          {result ? (
            <div
              className="anim-fadein"
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 4,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  gap: 12,
                }}
              >
                <div>
                  <Badge text={result.type} />
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginTop: 8,
                    }}
                  >
                    {result.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted-c)",
                      marginTop: 4,
                    }}
                  >
                    {wordCount} words
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={save}
                    style={{
                      padding: "9px 18px",
                      background: "var(--green)",
                      color: "white",
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Save to Library
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setEditedContent("");
                    }}
                    style={{
                      padding: "9px 14px",
                      background: "#f5f5f5",
                      color: "var(--slate)",
                      borderRadius: 3,
                      fontSize: 12,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Discard
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
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: "var(--ink)",
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none",
                  minHeight: 480,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 4,
                padding: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 16,
                }}
              >
                Saved Content Library
              </h3>
              {items.length === 0 ? (
                <p
                  style={{
                    color: "var(--muted-c)",
                    fontSize: 13,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  No content saved yet. Generate something with the panel on the left.
                </p>
              ) : (
                items.map((s: typeof items[number], i: number) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 0",
                      borderBottom:
                        i < items.length - 1
                          ? "1px solid rgba(0,0,0,0.06)"
                          : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "var(--ink)",
                          marginBottom: 4,
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
                          style={{ fontSize: 11, color: "var(--muted-c)" }}
                        >
                          {s.word_count} words ·{" "}
                          {new Date(s.created_at).toISOString().slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--muted-c)",
  marginBottom: 8,
};
