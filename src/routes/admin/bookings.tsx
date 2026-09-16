import { createFileRoute } from "@tanstack/react-router";
import {
  AdminHeader,
  AdminTable,
  AdminTd,
  AdminTr,
} from "@/routes/admin";
import { adminListBookingsFn } from "@/lib/server/functions";

export const Route = createFileRoute("/admin/bookings")({
  loader: () => adminListBookingsFn(),
  component: BookingsPage,
});

function BookingsPage() {
  const bookings = Route.useLoaderData();

  return (
    <>
      <AdminHeader
        title="Booking log"
        sub={`${bookings.length} consultation booking${bookings.length !== 1 ? "s" : ""}`}
      />

      {bookings.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md p-10 text-center text-sm text-ink-mute">
          No consultation bookings yet. They'll appear here once candidates book through the platform.
        </div>
      ) : (
        <AdminTable
          head={["Name", "Email", "Phone", "Topic", "Status", "Date"]}
        >
          {bookings.map((b) => (
            <AdminTr key={b.id}>
              <AdminTd>{b.contact_name ?? "—"}</AdminTd>
              <AdminTd>
                <a href={`mailto:${b.contact_email}`} className="underline hover:text-ink">
                  {b.contact_email}
                </a>
              </AdminTd>
              <AdminTd>{b.contact_phone ?? "—"}</AdminTd>
              <AdminTd className="text-ink-soft">{b.topic_area ?? "—"}</AdminTd>
              <AdminTd>
                <StatusBadge status={b.status} />
              </AdminTd>
              <AdminTd className="text-ink-mute tabular-nums text-xs">
                {formatDate(b.created_at)}
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "confirmed"
      ? "bg-accent-soft text-accent border-accent/20"
      : status === "cancelled"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-paper-deep text-ink-soft border-rule";
  return (
    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono tracking-[0.06em] rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
