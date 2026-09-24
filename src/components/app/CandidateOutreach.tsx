import { useEffect, useState } from "react";
import { toast } from "sonner";
import { candidateOutreachFn, sendCandidateMessageFn } from "@/lib/admin-tools-functions";
import { OUTREACH_TEMPLATES, fillTemplate, type OutreachTemplate } from "@/lib/outreach-templates";
import { STAGE_LABELS } from "@/lib/stages";
import type { MatchStage } from "@/lib/schemas/job";

type Context = Awaited<ReturnType<typeof candidateOutreachFn>>;

const field =
  "mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink";

/** Staff-only: email a candidate from a reviewed template; every message is logged. */
export function CandidateOutreach({ candidateId, name, onClose }: { candidateId: string; name: string | null; onClose: () => void }) {
  const [ctx, setCtx] = useState<Context | null>(null);
  const [template, setTemplate] = useState<OutreachTemplate>("role_intro");
  const [jobId, setJobId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const c = await candidateOutreachFn({ data: { candidateId } });
      setCtx(c);
      if (c.roles[0]) setJobId((j) => j || c.roles[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Outreach is unavailable.");
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  // Re-draft whenever the template or role changes; staff edit freely afterwards.
  useEffect(() => {
    if (!ctx) return;
    const role = ctx.roles.find((r) => r.id === jobId);
    const t = OUTREACH_TEMPLATES[template];
    const vars = {
      name,
      role: role?.title,
      company: role?.company,
      consultant: ctx.consultant ? ctx.consultant.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "Your consultant",
      siteUrl: ctx.siteUrl || (typeof window !== "undefined" ? window.location.origin : ""),
    };
    setSubject(fillTemplate(t.subject, vars));
    setBody(fillTemplate(t.body, vars));
  }, [ctx, template, jobId, name]);

  const needsRole = OUTREACH_TEMPLATES[template].needsRole;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await sendCandidateMessageFn({
        data: { candidateId, template, subject, body, jobId: needsRole && jobId ? jobId : undefined },
      });
      if (result.status === "sent") toast.success(`Email sent to ${result.to}`);
      else toast.error(`Saved but not delivered: ${result.reason ?? result.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-rule rounded-md bg-paper p-6 mb-8" aria-labelledby="outreach-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <h2 id="outreach-heading" className="font-display text-2xl text-ink" style={{ fontVariationSettings: '"opsz" 72' }}>
          Email {name ?? "candidate"}
        </h2>
        <button className="text-sm underline text-ink-mute" onClick={onClose}>Close</button>
      </div>

      {!ctx ? (
        <p className="text-sm text-ink-mute">{error || "Loading…"}</p>
      ) : !ctx.recipient.email ? (
        <p className="text-sm text-ink-soft">This candidate has no valid email address on file.</p>
      ) : (
        <form onSubmit={send} className="space-y-4">
          <p className="text-sm text-ink-soft">
            To <span className="text-ink">{ctx.recipient.email}</span>{" "}
            <span className="text-ink-mute">
              ({ctx.recipient.source === "account" ? "verified account email" : "email from their CV — no verified account"})
            </span>
            . Replies go to {ctx.consultant || "your staff email"}.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm text-ink-soft">
              Template
              <select className={field} value={template} onChange={(e) => setTemplate(e.target.value as OutreachTemplate)}>
                {Object.entries(OUTREACH_TEMPLATES).map(([k, t]) => (
                  <option key={k} value={k}>{t.label}</option>
                ))}
              </select>
            </label>
            {needsRole && (
              <label className="block text-sm text-ink-soft">
                Mandate
                <select className={field} value={jobId} onChange={(e) => setJobId(e.target.value)}>
                  {ctx.roles.length === 0 && <option value="">No matched mandates</option>}
                  {ctx.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}{r.company ? ` — ${r.company}` : ""} · {STAGE_LABELS[r.stage as MatchStage] ?? r.stage}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="block text-sm text-ink-soft">
            Subject
            <input className={field} required minLength={3} maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="block text-sm text-ink-soft">
            Message
            <textarea className={`${field} font-[inherit] leading-relaxed`} rows={12} required minLength={20} maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <p className="text-xs text-ink-mute">
            Check every detail before sending. A standard footer explaining why they are receiving this is added automatically. The message is logged on this record.
          </p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="rounded-full bg-ink text-paper px-5 py-2 text-[13px] disabled:opacity-50">
            {busy ? "Sending…" : "Send email"}
          </button>
        </form>
      )}

      {ctx && ctx.messages.length > 0 && (
        <div className="mt-8 border-t border-rule pt-5">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute mb-3">Sent to this candidate</p>
          <ul className="space-y-2">
            {ctx.messages.map((m) => (
              <li key={m.id} className="text-sm">
                <details>
                  <summary className="cursor-pointer flex flex-wrap gap-x-3">
                    <span className="tabular-nums text-ink-mute">
                      {new Date(m.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-ink">{m.subject}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${m.status === "sent" ? "text-accent" : "text-red-700"}`}>
                      {m.status}
                    </span>
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-ink-soft">{m.body}</p>
                  {m.error && <p className="text-xs text-ink-mute mt-1">{m.error}</p>}
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
