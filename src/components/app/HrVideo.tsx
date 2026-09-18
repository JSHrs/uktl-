import { useState } from "react";
import { videoPlaybackFn, recordVideoPlayFn } from "@/lib/hr-functions";
import type { FaqTopic } from "@/lib/server/db";
export function HrVideo({ topic }: { topic: FaqTopic }) {
  const [urls, setUrls] = useState<{ video: string; captions: string | null } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setUrls(await videoPlaybackFn({ data: { id: topic.id } }));
    } catch {
      setError("Video unavailable. Please use the transcript or try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border border-rule rounded-md p-5">
      <h2 className="font-display text-xl">{topic.title}</h2>
      {urls ? (
        <video
          className="w-full my-4"
          src={urls.video}
          controls
          crossOrigin="anonymous"
          onPlay={() => {
            void recordVideoPlayFn({ data: { id: topic.id } }).catch(() => {});
          }}
          onError={() => setError("Playback failed. Reload the video or read its transcript.")}
        >
          {urls.captions && (
            <track kind="captions" src={urls.captions} srcLang="en" label="English" default />
          )}
        </video>
      ) : null}
      <button className="underline my-3" disabled={busy} onClick={load}>
        {busy ? "Loading…" : urls ? "Refresh video link" : "Load video"}
      </button>
      {error && <p role="alert">{error}</p>}
      {topic.transcript && (
        <details>
          <summary>Read transcript</summary>
          <p className="whitespace-pre-wrap my-3">{topic.transcript}</p>
        </details>
      )}
      <p className="text-xs my-2">
        Content review:{" "}
        {topic.reviewed_at ? new Date(topic.reviewed_at).toLocaleDateString() : "Not recorded"}.
        Playback counts are deduplicated per signed-in viewer per UTC day.
      </p>
    </section>
  );
}
