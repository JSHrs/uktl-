import { useState, useCallback, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppLayout";
import { uploadAndParseCvFn } from "@/lib/functions";

export const Route = createFileRoute("/app/upload")({
  component: UploadPage,
});

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

type Stage = "idle" | "uploading" | "parsing" | "matching" | "done" | "failed";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading to secure storage…",
  parsing: "Claude is reading the CV…",
  matching: "Scoring against open mandates…",
  done: "Done — redirecting…",
  failed: "Something went wrong",
};

function stagePercent(stage: Stage): number {
  return { idle: 0, uploading: 20, parsing: 55, matching: 85, done: 100, failed: 0 }[stage];
}

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = stage !== "idle" && stage !== "failed";

  function validateAndSetFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError(`File is too large (${(f.size / 1048576).toFixed(1)} MB). Maximum is 10 MB.`);
      return;
    }
    setError(null);
    setFile(f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0] ?? null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setError(null);
    setStage("uploading");

    // Simulate stage transitions while the server function runs
    const parseTimer = setTimeout(() => setStage("parsing"), 1200);
    const matchTimer = setTimeout(() => setStage("matching"), 8000);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadAndParseCvFn({ data: fd });
      clearTimeout(parseTimer);
      clearTimeout(matchTimer);

      if (result.status === "failed") {
        const message = result.error ?? "CV parsing failed — check the file and try again.";
        setError(message);
        setStage("failed");
        toast.error(message);
        return;
      }

      setStage("done");
      toast.success(`CV parsed — quality ${result.quality.score}/100`);
      await navigate({ to: "/app/candidates/$id", params: { id: result.id } });
    } catch (err) {
      clearTimeout(parseTimer);
      clearTimeout(matchTimer);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStage("failed");
      toast.error(message);
    }
  }

  const pct = stagePercent(stage);

  return (
    <>
      <PageHeader
        eyebrow="Upload"
        title={
          <>
            Drop a CV,{" "}
            <em className="not-italic italic font-normal text-ink-soft">
              receive a shortlist.
            </em>
          </>
        }
        lede="PDF, DOCX, or plain text. We extract the structured profile, grade CV quality, and rank the candidate against every open mandate — all in one pass."
      />

      <form onSubmit={onSubmit} className="max-w-[720px]">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Click or drag a file to upload"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && !busy && inputRef.current?.click()}
          className={`
            relative border border-dashed rounded-md px-8 py-16 text-center cursor-pointer
            transition-colors duration-150 select-none
            ${dragOver && !busy ? "border-ink bg-paper-deep/50" : ""}
            ${!dragOver && !file ? "border-rule hover:border-ink/50" : ""}
            ${file && !busy ? "border-ink/40 bg-paper-deep/30" : ""}
            ${busy ? "cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={busy}
            onChange={(e) => validateAndSetFile(e.target.files?.[0] ?? null)}
          />

          {busy ? (
            <div className="space-y-4">
              <div className="font-display text-xl text-ink">{STAGE_LABELS[stage]}</div>
              <div className="mx-auto w-48 h-1 bg-rule rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-ink-mute">This usually takes 15–30 seconds</div>
            </div>
          ) : file ? (
            <>
              <div className="text-2xl mb-2">📄</div>
              <div className="font-display text-xl text-ink">{file.name}</div>
              <div className="text-sm text-ink-soft mt-1.5">
                {file.size >= 1048576
                  ? `${(file.size / 1048576).toFixed(1)} MB`
                  : `${(file.size / 1024).toFixed(1)} KB`}{" "}
                · click or drag to replace
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl mb-2">⬆</div>
              <div className="font-display text-xl text-ink">
                {dragOver ? "Drop to upload" : "Drag a CV here"}
              </div>
              <div className="text-sm text-ink-soft mt-1.5">
                or click to browse · PDF, DOCX, TXT · max 10 MB
              </div>
            </>
          )}
        </div>

        {/* Progress label */}
        {busy && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
            <span className="text-xs text-ink-soft font-mono">{STAGE_LABELS[stage]}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            {error}
          </div>
        )}

        {/* Footer row */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs text-ink-mute max-w-[44ch]">
            Files are stored privately in Cloudflare R2 and never shared. Processing is server-side only.
          </p>
          <button
            type="submit"
            disabled={!file || busy}
            className="flex-shrink-0 text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full
              disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {busy ? STAGE_LABELS[stage].replace("…", "") : "Parse & match →"}
          </button>
        </div>
      </form>

      {/* Pipeline explainer */}
      <section className="mt-14 max-w-[720px]">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
          — What happens
        </div>
        <ol className="space-y-3">
          {[
            ["Store", "The CV file is stored privately in Cloudflare R2 — never accessible publicly."],
            ["Extract", "Claude reads the document and outputs a strict JSON profile: identity, experience, skills, education."],
            ["Normalise", 'Skills are collapsed to a canonical taxonomy so "React.js" and "ReactJS" count as one.'],
            ["Grade", "CV quality is scored 0–100 with concrete improvement notes for the consultant."],
            ["Match", "The candidate is ranked against every open mandate and surfaced on the discovery dashboard."],
          ].map(([step, desc], i) => (
            <li key={step} className="flex gap-4 text-sm">
              <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border border-rule flex items-center justify-center font-mono text-[10px] text-ink-mute">
                {i + 1}
              </span>
              <span>
                <span className="font-medium text-ink">{step} — </span>
                <span className="text-ink-soft">{desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
