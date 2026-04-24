import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppLayout";
import { uploadAndParseCvFn } from "@/lib/server/functions";

export const Route = createFileRoute("/app/upload")({
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadAndParseCvFn({ data: fd });
      if (result.status === "failed") {
        setError(result.error ?? "Parsing failed");
        setBusy(false);
        return;
      }
      await navigate({
        to: "/app/candidates/$id",
        params: { id: result.id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

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

      <form
        onSubmit={onSubmit}
        className="max-w-[720px] border border-rule rounded-md p-10 bg-paper"
      >
        <label
          htmlFor="cv"
          className={`block border border-dashed rounded-md px-8 py-14 text-center cursor-pointer transition-colors ${
            file ? "border-ink bg-paper-deep/40" : "border-rule hover:border-ink/50"
          }`}
        >
          <input
            id="cv"
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <div className="font-display text-xl">{file.name}</div>
              <div className="text-sm text-ink-soft mt-2">
                {(file.size / 1024).toFixed(1)} KB — click to replace
              </div>
            </>
          ) : (
            <>
              <div className="font-display text-xl">Choose a CV file</div>
              <div className="text-sm text-ink-soft mt-2">
                PDF recommended · max 10 MB
              </div>
            </>
          )}
        </label>

        {error && (
          <div className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-ink-mute max-w-[46ch]">
            The file is stored privately and processed server-side. PII is
            redacted from any text sent to third-party models where possible.
          </p>
          <button
            type="submit"
            disabled={!file || busy}
            className="text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Parsing…" : "Parse & match"}
          </button>
        </div>
      </form>

      <section className="mt-14 max-w-[720px] text-sm text-ink-soft space-y-3">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute">
          — What happens next
        </div>
        <ol className="list-decimal list-inside space-y-2">
          <li>The CV is stored privately in R2.</li>
          <li>Claude extracts a strict JSON profile — identity, experience, skills, education.</li>
          <li>Skills are normalised against our taxonomy so "React.js" and "ReactJS" collapse to one.</li>
          <li>CV quality is graded 0–100 with concrete improvement notes.</li>
          <li>The candidate is scored against every open mandate and surfaced on the dashboards.</li>
        </ol>
      </section>
    </>
  );
}
