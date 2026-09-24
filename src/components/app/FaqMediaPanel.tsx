import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  approveFaqFn,
  attachFaqMediaFn,
  createFaqUploadFn,
  faqMediaPreviewFn,
  removeFaqMediaFn,
} from "@/lib/faq-functions";

type Kind = "video" | "captions" | "thumbnail";
type Preview = Awaited<ReturnType<typeof faqMediaPreviewFn>>;

const EXTENSION_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  vtt: "text/vtt",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const SLOTS: { kind: Kind; label: string; accept: string; guidance: string }[] = [
  {
    kind: "video",
    label: "Video",
    accept: ".mp4,.m4v,.webm,video/mp4,video/webm",
    guidance: "MP4 (H.264 video, AAC audio) plays everywhere and is preferred; WebM also accepted. 720p or 1080p, up to 100 MB. Keep it under about 10 minutes.",
  },
  {
    kind: "captions",
    label: "Captions",
    accept: ".vtt,text/vtt",
    guidance: "WebVTT (.vtt), up to 1 MB. Required for any video. Convert .srt files to .vtt before uploading.",
  },
  {
    kind: "thumbnail",
    label: "Poster image",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    guidance: "JPEG, PNG or WebP, 16:9 (1280×720 recommended), up to 5 MB. Shown on the library card and before playback.",
  },
];

function contentTypeOf(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (file.type || EXTENSION_TYPES[ext] || "").toLowerCase();
}

function putWithProgress(url: string, file: File, type: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload interrupted. Check your connection and retry."));
    xhr.send(file);
  });
}

function videoDuration(file: File) {
  return new Promise<number | undefined>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

export function FaqMediaPanel({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState<Partial<Record<Kind, number>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    try {
      const p = await faqMediaPreviewFn({ data: { topicId } });
      setPreview(p);
      setTranscript((t) => t || p.transcript || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Media could not be loaded.");
    }
  }
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function upload(kind: Kind, file: File) {
    setError("");
    setNotice("");
    const limits = preview?.limits[kind];
    const type = contentTypeOf(file);
    if (limits && !limits.types.includes(type)) {
      setError(`${file.name}: unsupported format. Accepted: ${limits.types.join(", ")}.`);
      return;
    }
    if (limits && file.size > limits.maxBytes) {
      setError(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB; the limit is ${Math.round(limits.maxBytes / 1048576)} MB.`);
      return;
    }
    setBusy(true);
    setProgress((p) => ({ ...p, [kind]: 0 }));
    try {
      const durationS = kind === "video" ? await videoDuration(file) : undefined;
      const { key, signedUrl } = await createFaqUploadFn({ data: { topicId, kind, contentType: type, size: file.size } });
      await putWithProgress(signedUrl, file, type, (v) => setProgress((p) => ({ ...p, [kind]: v })));
      await attachFaqMediaFn({ data: { topicId, kind, key, durationS } });
      setNotice(`${file.name} uploaded and checked.`);
      await refresh();
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress((p) => ({ ...p, [kind]: undefined }));
    }
  }

  async function act(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(ok);
      await refresh();
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const keyFor = (k: Kind) => (k === "video" ? preview?.video_key : k === "captions" ? preview?.captions_key : preview?.thumbnail_key);
  const approved = !!preview?.reviewed_at;

  return (
    <section className="max-w-2xl mt-12 pt-8 border-t border-rule space-y-6" aria-labelledby="faq-media">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="faq-media" className="font-display text-2xl text-ink" style={{ fontVariationSettings: '"opsz" 72' }}>
          Media and approval
        </h2>
        <span
          className={`font-mono text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full border ${
            approved ? "border-accent/40 text-accent bg-accent-soft" : "border-rule text-ink-mute"
          }`}
        >
          {approved ? `Approved ${new Date(preview!.reviewed_at!).toLocaleDateString("en-GB")}` : "Not approved"}
        </span>
      </div>

      {SLOTS.map((slot) => {
        const key = keyFor(slot.kind);
        const pct = progress[slot.kind];
        return (
          <div key={slot.kind} className="border border-rule rounded-md p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink font-medium">{slot.label}</p>
              <div className="flex items-center gap-3 text-sm">
                <label className={`underline cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
                  {key ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept={slot.accept}
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void upload(slot.kind, f);
                    }}
                  />
                </label>
                {key && (
                  <button
                    className="underline text-ink-mute"
                    disabled={busy}
                    onClick={() => act(() => removeFaqMediaFn({ data: { topicId, kind: slot.kind } }), `${slot.label} removed.`)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-ink-mute">{slot.guidance}</p>
            {pct !== undefined && (
              <div className="h-1.5 rounded-full bg-paper-deep overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(pct * 100)}%` }} />
              </div>
            )}
            {key && <p className="font-mono text-[11px] text-ink-mute break-all">{key}</p>}
            {slot.kind === "video" && preview?.video_url && (
              <video controls preload="metadata" poster={preview.thumbnail_url ?? undefined} className="w-full rounded bg-ink" crossOrigin="anonymous">
                <source src={preview.video_url} />
                {preview.captions_url && <track kind="captions" src={preview.captions_url} srcLang="en" label="English" default />}
              </video>
            )}
            {slot.kind === "thumbnail" && preview?.thumbnail_url && (
              <img src={preview.thumbnail_url} alt="Poster preview" className="w-48 aspect-video object-cover rounded border border-rule" />
            )}
          </div>
        );
      })}

      <label className="block">
        <span className="text-sm text-ink font-medium">Reviewed transcript</span>
        <span className="block text-xs text-ink-mute mb-1">
          Required with a video: the full spoken text, checked against the recording. Shown under the video for accessibility.
        </span>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={8}
          maxLength={50000}
          className="w-full border border-rule rounded px-3 py-2 text-sm bg-paper text-ink focus:outline-none focus:border-ink"
        />
      </label>

      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`text-sm ${error ? "text-red-700" : "text-accent"}`}>
          {error || notice}
        </p>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <button
          disabled={busy}
          onClick={() => act(() => approveFaqFn({ data: { topicId, transcript: transcript.trim() || undefined, approve: true } }), "Approved. Published topics are now visible to candidates.")}
          className="text-[12px] px-3.5 py-1.5 border rounded-full border-ink bg-ink text-paper hover:opacity-90 disabled:opacity-40"
        >
          {approved ? "Re-approve current version" : "I have reviewed this topic — approve"}
        </button>
        {approved && (
          <button
            disabled={busy}
            onClick={() => act(() => approveFaqFn({ data: { topicId, approve: false } }), "Approval withdrawn.")}
            className="text-[12px] underline text-ink-soft"
          >
            Withdraw approval
          </button>
        )}
        <p className="text-xs text-ink-mute basis-full">
          Candidates see a topic only when it is both published and approved. Editing the title, answer, keywords, sector, transcript or any media withdraws approval.
        </p>
      </div>
    </section>
  );
}
