import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
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
  return <FaqForm mode="edit" initial={topic} />;
}

// Shared form used by both new.tsx and $id.tsx
export function FaqForm({ mode, initial }: { mode: "create" | "edit"; initial?: FaqTopic }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "dismissal");
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(", "));
  const [sectorTag, setSectorTag] = useState(initial?.sector_tag ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail ?? "");
  const [durationS, setDurationS] = useState(initial?.duration_s?.toString() ?? "");
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
      video_url: videoUrl || null,
      thumbnail: thumbnail || null,
      duration_s: durationS ? parseInt(durationS, 10) : null,
      published,
    };
    try {
      if (mode === "create") {
        await adminCreateFaqFn({ data: payload });
        await navigate({ to: "/admin/faq" });
      } else {
        await adminUpdateFaqFn({ data: { id: initial!.id, ...payload } });
        await navigate({ to: "/admin/faq" });
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
      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
        <AdminField label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. What counts as unfair dismissal?" />
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

        <AdminField label="Video URL" hint="Supabase Storage public URL or CDN URL for the MP4.">
          <input className={inputCls} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/storage/v1/object/public/videos/…mp4" />
        </AdminField>

        <AdminField label="Thumbnail URL" hint="Optional still image for the card and video poster.">
          <input className={inputCls} type="url" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://…/thumbnail.jpg" />
        </AdminField>

        <AdminField label="Duration (seconds)">
          <input className={inputCls} type="number" min={1} value={durationS} onChange={(e) => setDurationS(e.target.value)} placeholder="e.g. 187" />
        </AdminField>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-ink" />
          <span className="text-sm text-ink">Published — visible in the HR video library</span>
        </label>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <AdminBtn variant="primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create topic" : "Save changes"}
          </AdminBtn>
          <AdminBtn onClick={() => navigate({ to: "/admin/faq" })}>Cancel</AdminBtn>
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
