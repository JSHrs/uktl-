import { useState } from "react";
import { createFileRoute, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { FaqMediaPanel } from "@/components/app/FaqMediaPanel";
import { adminCreateFaqFn, adminGetFaqFn, adminUpdateFaqFn } from "@/lib/functions";
import type { FaqTopic } from "@/lib/server/db";
import {
  AdminHeader, AdminField, AdminBtn,
  inputCls, textareaCls, selectCls,
} from "../../admin";

export const Route = createFileRoute("/admin/faq/$id")({
  loader: async ({ params }) => {
    const topic = await adminGetFaqFn({ data: { id: params.id } });
    if (!topic) throw notFound();
    return topic;
  },
  component: EditFaqPage,
});

function EditFaqPage() {
  const topic = Route.useLoaderData();
  return (
    <>
      <FaqForm key={topic.id} mode="edit" initial={topic} />
      <FaqMediaPanel topicId={topic.id} />
    </>
  );
}

// Shared form used by both new.tsx and $id.tsx
export function FaqForm({ mode, initial }: { mode: "create" | "edit"; initial?: FaqTopic }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [category, setCategory] = useState(initial?.category ?? "dismissal");
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(", "));
  const [sectorTag, setSectorTag] = useState(initial?.sector_tag ?? "");
  const [published, setPublished] = useState(initial ? !!initial.published : false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      title,
      category,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      sector_tag: sectorTag || null,
      answer: answer.trim() || null,
      // Legacy external links are preserved untouched; new media is uploaded below.
      video_url: initial?.video_url ?? null,
      thumbnail: initial?.thumbnail ?? null,
      duration_s: initial?.duration_s ?? null,
      published,
    };
    try {
      if (mode === "create") {
        const { id } = await adminCreateFaqFn({ data: payload });
        // Straight to the topic page so media can be uploaded and the topic approved.
        await navigate({ to: "/admin/faq/$id", params: { id } });
      } else {
        await adminUpdateFaqFn({ data: { id: initial!.id, ...payload } });
        await router.invalidate();
        setBusy(false);
        setSaved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <>
      <AdminHeader
        title={mode === "create" ? "Add FAQ topic" : "Edit FAQ topic"}
        sub={mode === "edit" ? initial?.title : undefined}
      />
      <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
        <AdminField label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. What counts as unfair dismissal?" />
        </AdminField>

        <AdminField
          label="Written answer"
          hint="Plain text shown to candidates in the HR library. Blank lines start a new paragraph. Keep it general guidance, cite ACAS or GOV.UK where relevant, and avoid advice on an individual's case."
        >
          <textarea className={textareaCls} rows={12} maxLength={20000} value={answer} onChange={(e) => { setAnswer(e.target.value); setSaved(false); }} placeholder="Explain the rule in plain English, what the candidate can do next, and where to find official guidance." />
          <span className="block text-right text-[11px] text-ink-mute tabular-nums">{answer.length.toLocaleString()} / 20,000</span>
        </AdminField>

        <AdminField label="Category">
          <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </AdminField>

        <AdminField label="Keywords" hint="Comma-separated — used for topic matching. Include synonyms and key phrases.">
          <textarea className={textareaCls} rows={2} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="dismissal, unfair, employment rights, redundancy…" />
        </AdminField>

        <AdminField label="Sector tag" hint="Leave blank for all sectors.">
          <select className={selectCls} value={sectorTag} onChange={(e) => setSectorTag(e.target.value)}>
            <option value="">All sectors</option>
            <option value="construction">Construction</option>
            <option value="technology">Technology</option>
          </select>
        </AdminField>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-ink" />
          <span className="text-sm text-ink">Published — visible in the HR library once approved below</span>
        </label>

        {saved && !error && (
          <p role="status" className="text-sm text-accent">Saved. Changes to an approved topic need approving again below.</p>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <AdminBtn variant="primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create topic and add media" : "Save changes"}
          </AdminBtn>
          <AdminBtn onClick={() => navigate({ to: "/admin/faq" })}>{mode === "edit" ? "Back to topics" : "Cancel"}</AdminBtn>
        </div>
      </form>
    </>
  );
}

const CATEGORIES = [
  { value: "dismissal", label: "Dismissal" },
  { value: "contracts", label: "Contracts" },
  { value: "discrimination", label: "Discrimination" },
  { value: "pay", label: "Pay" },
  { value: "redundancy", label: "Redundancy" },
  { value: "holiday", label: "Holiday" },
  { value: "working-time", label: "Working Hours" },
  { value: "leave", label: "Parental Leave" },
  { value: "whistleblowing", label: "Whistleblowing" },
  { value: "settlement", label: "Settlement" },
];
