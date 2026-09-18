import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { getHrAnswerFn, saveHrResolutionFn, answerHrQuestionFn } from "@/lib/hr-functions";
import { HrVideo } from "@/components/app/HrVideo";
import { ConsultationBooking } from "@/components/app/ConsultationBooking";
import { DataError } from "@/components/app/DataError";
export const Route = createFileRoute("/app/hr/answer")({
  validateSearch: (s) =>
    z
      .object({ id: z.string().max(100).optional(), topic: z.string().max(100).optional() })
      .parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getHrAnswerFn({ data: deps }),
  errorComponent: DataError,
  component: Answer,
});
function Answer() {
  const { journey, topic, related, confidence } = Route.useLoaderData(),
    router = useRouter();
  const [context, setContext] = useState(journey?.additional_context ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saved = journey?.ai_response ? parseAnswer(journey.ai_response) : null;
  async function resolve(
    resolution: "yes" | "partly" | "no" | null,
    topicId: string | null = topic?.id ?? null,
  ) {
    if (!journey) return;
    setBusy(true);
    setError("");
    try {
      await saveHrResolutionFn({
        data: { id: journey.id, revision: journey.revision, topicId, resolution },
      });
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  async function answer() {
    if (!journey) return;
    setBusy(true);
    setError("");
    try {
      await answerHrQuestionFn({ data: { id: journey.id, revision: journey.revision, context } });
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Guidance unavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-[760px]">
      <Link to="/app/hr" className="underline">
        ← Workplace questions
      </Link>
      <h1 className="font-display text-3xl my-6">
        {journey?.question ?? topic?.title ?? "Select a published topic"}
      </h1>
      <p className="border border-rule p-4 mb-6 text-sm">
        General information, not legal advice. Source excerpts may not cover your circumstances or
        later legal changes. For decisions or deadlines, consult a qualified employment adviser.
      </p>
      {error && (
        <p role="alert" className="my-4">
          {error}
        </p>
      )}
      {topic ? (
        <>
          <p className="text-sm mb-2">
            {journey && !journey.faq_topic_id
              ? confidence === "high"
                ? "Suggested topic — confirm it addresses your question."
                : "Possible topic — this is a low-confidence keyword match."
              : "Selected topic"}
          </p>
          <HrVideo key={topic.id} topic={topic} />
        </>
      ) : (
        <p>
          No reviewed published video matched. You can request reviewed source excerpts or speak to
          an adviser.
        </p>
      )}
      {!!related.length && (
        <section className="my-5">
          <h2 className="text-lg">Other possible topics</h2>
          {related.map(({ topic: t }) => (
            <button
              disabled={busy}
              key={t.id}
              className="block underline my-2"
              onClick={() => resolve(null, t.id)}
            >
              {t.title}
            </button>
          ))}
        </section>
      )}
      {journey ? (
        <>
          <section className="my-6">
            <h2 className="text-lg">Did this answer your question?</h2>
            <div className="flex gap-3 my-3">
              {(["yes", "partly", "no"] as const).map((r) => (
                <button
                  key={r}
                  disabled={busy}
                  aria-pressed={journey.resolution_type === r}
                  className="border border-rule rounded-full px-4 py-2"
                  onClick={() => resolve(r)}
                >
                  {r === "yes" ? "Resolved" : r === "partly" ? "Partly" : "Not resolved"}
                </button>
              ))}
            </div>
          </section>
          <label htmlFor="hr-context" className="block">
            Additional context (optional; saved privately)
          </label>
          <textarea
            id="hr-context"
            maxLength={8000}
            rows={4}
            className="w-full border border-rule rounded-md p-3 my-2"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <button
            disabled={busy}
            className="border border-rule rounded-full px-5 py-2"
            onClick={answer}
          >
            {busy ? "Working…" : "Find reviewed source excerpts"}
          </button>
          {saved && (
            <section className="my-6">
              <h2 className="text-xl">Source-backed response</h2>
              {saved.excerpts.length ? (
                saved.excerpts.map((e, i) => (
                  <div key={i} className="border border-rule p-4 my-3">
                    <blockquote>{e.quote}</blockquote>
                    <a className="underline" href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.title}
                    </a>
                    <p className="text-xs">
                      Retrieved {new Date(e.retrievedAt).toLocaleDateString()} · reviewed{" "}
                      {new Date(e.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>The reviewed sources did not establish an answer. Please consult an adviser.</p>
              )}
              <p className="text-sm">{saved.notice}</p>
            </section>
          )}
        </>
      ) : (
        <p className="my-5">
          <Link to="/app/hr" className="underline">
            Sign in and ask a question to save your resolution and receive source excerpts.
          </Link>
        </p>
      )}
      <ConsultationBooking queryId={journey?.id} />
    </div>
  );
}
function parseAnswer(raw: string) {
  try {
    return z
      .object({
        excerpts: z.array(
          z.object({
            quote: z.string(),
            url: z.string().url(),
            title: z.string(),
            reviewedAt: z.number(),
            retrievedAt: z.number(),
          }),
        ),
        notice: z.string(),
      })
      .parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
