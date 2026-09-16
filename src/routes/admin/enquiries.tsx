import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminHeader, AdminTable, AdminTd, AdminTr, selectCls } from "@/routes/admin";
import { adminListEnquiriesFn, adminSetEnquiryStatusFn } from "@/lib/functions";
import type { EnquiryRow } from "@/lib/server/db";

export const Route = createFileRoute("/admin/enquiries")({
  loader: () => adminListEnquiriesFn(),
  component: EnquiriesPage,
});

const STATUSES = ["new", "replied", "closed"] as const;
type Status = (typeof STATUSES)[number];
type Filter = Status | "all";

function EnquiriesPage() {
  const enquiries = Route.useLoaderData();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("new");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, enquiries.filter((e: EnquiryRow) => e.status === s).length]),
  ) as Record<Status, number>;
  const visible = filter === "all" ? enquiries : enquiries.filter((e: EnquiryRow) => e.status === filter);

  async function setStatus(e: EnquiryRow, status: Status) {
    setBusy(e.id);
    try {
      await adminSetEnquiryStatusFn({ data: { id: e.id, status } });
      toast.success(`${e.name} marked ${status}`);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the enquiry");
    } finally {
      setBusy(null);
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <AdminHeader
        title="Enquiries"
        sub={`${counts.new} new · ${counts.replied} replied · ${counts.closed} closed`}
      />

      <div className="flex flex-wrap gap-1.5 mb-5">
        {(["new", "replied", "closed", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-full border capitalize transition-colors ${
              filter === f
                ? "bg-ink text-paper border-ink"
                : "border-rule text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {f}
            <span className={`font-mono text-[10px] tabular-nums ${filter === f ? "text-paper/60" : "text-ink-mute"}`}>
              {f === "all" ? enquiries.length : counts[f]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md p-10 text-center text-sm text-ink-mute">
          {enquiries.length === 0
            ? "No enquiries yet. Messages sent through the contact form will appear here."
            : `Nothing ${filter === "all" ? "" : filter} right now.`}
        </div>
      ) : (
        <AdminTable head={["From", "Type", "Message", "Received", "Status"]}>
          {visible.map((e: EnquiryRow) => {
            const open = expanded.has(e.id);
            const long = e.message.length > 140;
            return (
              <AdminTr key={e.id}>
                <AdminTd className="align-top">
                  <div className="font-medium text-ink">{e.name}</div>
                  {e.company && <div className="text-xs text-ink-mute">{e.company}</div>}
                  <a
                    href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your enquiry to UK Talent Link")}`}
                    className="text-xs underline text-ink-soft hover:text-ink"
                  >
                    {e.email}
                  </a>
                </AdminTd>
                <AdminTd className="align-top text-ink-soft text-xs whitespace-nowrap">
                  {e.enquiry_type ?? "—"}
                </AdminTd>
                <AdminTd className="align-top max-w-[44ch]">
                  <p className="text-[13px] text-ink-soft leading-relaxed m-0 whitespace-pre-line">
                    {open || !long ? e.message : `${e.message.slice(0, 140).trimEnd()}…`}
                  </p>
                  {long && (
                    <button
                      type="button"
                      onClick={() => toggle(e.id)}
                      className="mt-1 text-[12px] text-ink-mute hover:text-ink underline"
                    >
                      {open ? "Show less" : "Show all"}
                    </button>
                  )}
                </AdminTd>
                <AdminTd className="align-top text-ink-mute tabular-nums text-xs whitespace-nowrap">
                  {formatDate(e.created_at)}
                </AdminTd>
                <AdminTd className="align-top">
                  <select
                    aria-label={`Status for enquiry from ${e.name}`}
                    value={e.status}
                    disabled={busy === e.id}
                    onChange={(ev) => setStatus(e, ev.target.value as Status)}
                    className={`${selectCls} text-[12px] py-1.5 capitalize`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </AdminTd>
              </AdminTr>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
