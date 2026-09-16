import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  escalateToAiFn,
  matchFaqTopicFn,
  recordFaqViewFn,
} from "@/lib/functions";
import type { FaqTopic } from "@/lib/server/db";

export const Route = createFileRoute("/app/hr/answer")({
  validateSearch: (s) =>
    z.object({
      q: z.string(),
      category: z.string().optional(),
    }).parse(s),
  loaderDeps: ({ search }) => ({ q: search.q, category: search.category }),
  loader: async ({ deps }) =>
    matchFaqTopicFn({ data: { question: deps.q, category: deps.category } }),
  component: AnswerPage,
});

type Resolution = "yes" | "no" | "partly" | null;

function AnswerPage() {
  const { q, category } = Route.useSearch();
  const { match, related } = Route.useLoaderData();

  const [resolution, setResolution] = useState<Resolution>(null);
  const [context, setContext] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const topic = match?.topic ?? null;
  const highConfidence = match?.confidence === "high";

  // Fire view count when a topic is shown
  if (topic && typeof window !== "undefined") {
    recordFaqViewFn({ data: { id: topic.id } }).catch(() => {});
  }

  async function requestAi() {
    setLoadingAi(true);
    try {
      const result = await escalateToAiFn({
        data: { question: q, category, additionalContext: context || undefined },
      });
      setAiResponse(result.response);
    } catch {
      setAiResponse("Unable to generate a response at this time. Please try again or book a consultation.");
    } finally {
      setLoadingAi(false);
    }
  }

  return (
    <div className="max-w-[760px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-mute mb-8">
        <Link to="/app/hr" className="hover:text-ink transition-colors">
          HR &amp; Employment Law
        </Link>
        <span>/</span>
        <span className="text-ink truncate max-w-[48ch]">{q}</span>
      </div>

      {/* Legal disclaimer — persistent */}
      <div className="mb-6 border border-rule bg-paper-deep/60 rounded-md px-4 py-3 flex gap-3 items-start">
        <span className="text-ink-mute flex-shrink-0 font-mono text-xs mt-0.5">ℹ</span>
        <p className="text-xs text-ink-mute leading-relaxed">
          <strong className="font-medium text-ink-soft">Information, not legal advice.</strong>{" "}
          Content is grounded in ACAS guidance and UK employment law. For your specific situation, consult a qualified employment solicitor.
        </p>
      </div>

      {/* ── VIDEO MATCH ── */}
      {topic ? (
        <section className="mb-8">
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
            — {highConfidence ? "Best match" : "Closest match"}
          </div>
          <FaqVideoCard topic={topic} />

          {/* Resolution prompt */}
          {!aiResponse && (
            <div className="mt-8 border border-rule rounded-md p-6 bg-paper">
              <p className="font-display font-light text-lg tracking-[-0.015em] mb-4">
                Did this answer your question?
              </p>
              <div className="flex flex-wrap gap-3">
                {(["yes", "partly", "no"] as Resolution[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setResolution(r);
                      if (r === "no" || r === "partly") setAiResponse(null);
                    }}
                    className={`px-5 py-2 border rounded-full text-sm font-mono tracking-[0.05em] transition-colors ${
                      resolution === r
                        ? "border-ink bg-ink text-paper"
                        : "border-rule hover:border-ink text-ink-soft hover:text-ink"
                    }`}
                  >
                    {r === "yes" ? "Yes, resolved" : r === "partly" ? "Partly" : "No, need more"}
                  </button>
                ))}
              </div>

              {resolution === "yes" && (
                <div className="mt-5 text-sm text-ink-soft">
                  Glad that helped.{" "}
                  <Link to="/app/hr" className="underline">
                    Ask another question
                  </Link>{" "}
                  or{" "}
                  <Link to="/app/hr/library" className="underline">
                    browse the full video library
                  </Link>
                  .
                </div>
              )}

              {(resolution === "no" || resolution === "partly") && !aiResponse && (
                <div className="mt-5">
                  <label className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute block mb-2">
                    Add more detail <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={3}
                    placeholder="e.g. I've worked there 3 years on a fixed-term contract..."
                    className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute resize-none focus:outline-none focus:border-ink transition-colors"
                  />
                  <button
                    onClick={requestAi}
                    disabled={loadingAi}
                    className="mt-3 text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {loadingAi ? "Generating…" : "Get AI guidance"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        /* ── NO MATCH ── */
        <div className="mb-8 border border-rule rounded-md p-6 bg-paper">
          <p className="font-display font-light text-lg tracking-[-0.015em] mb-2">
            No FAQ video found for this query
          </p>
          <p className="text-sm text-ink-soft mb-5">
            We couldn't find a pre-recorded video that matches your question closely enough. You can get AI-generated guidance below, or browse the video library for related topics.
          </p>
          {!aiResponse && (
            <>
              <label className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute block mb-2">
                Additional context <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                placeholder="Add any relevant details to improve the guidance..."
                className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute resize-none focus:outline-none focus:border-ink transition-colors"
              />
              <button
                onClick={requestAi}
                disabled={loadingAi}
                className="mt-3 text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loadingAi ? "Generating…" : "Get AI guidance"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── AI RESPONSE ── */}
      {aiResponse && (
        <section className="mb-8">
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
            — AI guidance
          </div>
          <div className="border border-rule rounded-md p-6 bg-paper">
            <div className="prose-sm text-ink leading-relaxed whitespace-pre-wrap text-sm">
              {aiResponse}
            </div>
          </div>
        </section>
      )}

      {/* ── RELATED TOPICS ── */}
      {related.length > 0 && (
        <section className="mb-8">
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
            — Related topics
          </div>
          <div className="flex flex-col gap-2">
            {related.map((t) => (
              <Link
                key={t.id}
                to="/app/hr/answer"
                search={{ q: t.title, category: t.category }}
                className="group border border-rule rounded-md px-5 py-3.5 hover:border-ink transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-medium text-ink group-hover:text-ink">
                    {t.title}
                  </div>
                  <div className="text-xs text-ink-mute mt-0.5 capitalize">
                    {t.category.replace("-", " ")} · {formatDuration(t.duration_s)}
                  </div>
                </div>
                <span className="text-ink-mute text-xs flex-shrink-0">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CONSULTATION BOOKING ── */}
      <section className="border border-rule rounded-md overflow-hidden">
        <div className="px-6 py-5 border-b border-rule bg-paper">
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-2">
            — Speak to a consultant
          </div>
          <p className="font-display font-light text-lg tracking-[-0.015em]">
            Still need help? Book a consultation.
          </p>
          <p className="text-sm text-ink-soft mt-1">
            Our employment law advisers can provide specific guidance on your situation.
          </p>
        </div>
        <div className="px-6 py-6 bg-paper-deep/40">
          {/* Calendly embed placeholder — client to provide embed URL */}
          <div className="border border-dashed border-rule rounded-md p-8 text-center">
            <p className="text-sm text-ink-mute mb-3">
              Calendly booking embed will appear here once the client provides the account link.
            </p>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity inline-block"
            >
              Book a consultation →
            </a>
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
        <Link to="/app/hr" className="text-sm text-ink-mute hover:text-ink transition-colors">
          ← Ask another question
        </Link>
        <Link to="/app/hr/library" className="text-sm text-ink-mute hover:text-ink transition-colors">
          Browse all videos →
        </Link>
      </div>
    </div>
  );
}

function FaqVideoCard({ topic }: { topic: FaqTopic }) {
  return (
    <div className="border border-rule rounded-md overflow-hidden bg-paper">
      {/* Video player area */}
      <div
        className="bg-paper-deep flex items-center justify-center"
        style={{ aspectRatio: "16/9", maxHeight: 320 }}
      >
        {topic.video_url ? (
          <video
            src={topic.video_url}
            controls
            className="w-full h-full object-cover"
            poster={topic.thumbnail ?? undefined}
          />
        ) : (
          <div className="text-center px-8 py-12">
            <div className="w-14 h-14 rounded-full border border-rule flex items-center justify-center mx-auto mb-4">
              <span className="text-ink-mute text-xl">▶</span>
            </div>
            <p className="text-sm text-ink-soft font-medium">{topic.title}</p>
            <p className="text-xs text-ink-mute mt-2">
              Video will appear here once uploaded to Supabase Storage
            </p>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-sm text-ink">{topic.title}</p>
          <p className="text-xs text-ink-mute mt-1 capitalize">
            {topic.category.replace("-", " ")}
            {topic.sector_tag && ` · ${topic.sector_tag}`}
            {topic.duration_s && ` · ${formatDuration(topic.duration_s)}`}
          </p>
        </div>
        <div className="text-xs text-ink-mute font-mono tabular-nums flex-shrink-0">
          {topic.view_count.toLocaleString()} views
        </div>
      </div>
    </div>
  );
}

function formatDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
