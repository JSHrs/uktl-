import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppLayout";
import { publicVideoTopicsFn } from "@/lib/hr-functions";
import { DataError } from '@/components/app/DataError';
import type { FaqTopic } from "@/lib/server/db";

export const Route = createFileRoute("/app/hr/library")({
  loader: async () => publicVideoTopicsFn(),
  errorComponent: DataError,
  component: LibraryPage,
});

const CATEGORIES = [
  { value: "", label: "All topics" },
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

function LibraryPage() {
  const topics = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSector, setActiveSector] = useState("");

  const filtered = topics.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (activeSector && t.sector_tag && t.sector_tag !== activeSector) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="HR & Employment Law"
        title={
          <>
            Video{" "}
            <em className="not-italic italic font-normal text-ink-soft">
              library
            </em>
          </>
        }
        lede="Browse all available HR and employment law guidance videos. Accessible without submitting a question."
        actions={
          <Link
            to="/app/hr"
            className="text-[13px] px-[18px] py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-90 transition-opacity"
          >
            Ask a question
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="search"
          placeholder="Search videos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-rule rounded-full px-4 py-2 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors min-w-[200px]"
        />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value === activeCategory ? "" : c.value)}
              className={`px-3.5 py-1.5 border rounded-full text-xs font-mono tracking-[0.04em] transition-colors ${
                activeCategory === c.value
                  ? "border-ink bg-ink text-paper"
                  : "border-rule text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["", "construction", "technology"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSector(s === activeSector ? "" : s)}
              className={`px-3.5 py-1.5 border rounded-full text-xs font-mono tracking-[0.04em] transition-colors ${
                activeSector === s && s !== ""
                  ? "border-ink bg-ink text-paper"
                  : "border-rule text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {s === "" ? "All sectors" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-5">
        — {filtered.length} video{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-rule border-dashed rounded-md p-10 text-center text-ink-soft text-sm">
          No videos match your filters.{" "}
          <button
            onClick={() => { setQuery(""); setActiveCategory(""); setActiveSector(""); }}
            className="underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <VideoCard key={t.id} topic={t} />
          ))}
        </div>
      )}
    </>
  );
}

function VideoCard({ topic }: { topic: FaqTopic }) {
  return (
    <Link
      to="/app/hr/answer"
      search={{ topic: topic.id }}
      className="group border border-rule rounded-md overflow-hidden hover:border-ink transition-colors bg-paper flex flex-col"
    >
      {/* Thumbnail / placeholder */}
      <div
        className="bg-paper-deep flex items-center justify-center flex-shrink-0"
        style={{ aspectRatio: "16/9" }}
      >
        {topic.thumbnail ? (
          <img
            src={topic.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-mute">
            <div className="w-10 h-10 rounded-full border border-rule flex items-center justify-center group-hover:border-ink transition-colors">
              <span className="text-base">▶</span>
            </div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">
          {topic.title}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-mute capitalize">
            {topic.category.replace("-", " ")}
            {topic.sector_tag && (
              <span className="ml-1.5 px-1.5 py-0.5 border border-rule rounded text-[9px]">
                {topic.sector_tag}
              </span>
            )}
          </span>
          <span className="font-mono text-[10px] text-ink-mute">
            {topic.duration_s ? formatDuration(topic.duration_s) : "—"}
          </span>
        </div>
        <div className="font-mono text-[10px] text-ink-mute">
          {topic.view_count.toLocaleString()} recorded signed-in plays
        </div>
      </div>
    </Link>
  );
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
