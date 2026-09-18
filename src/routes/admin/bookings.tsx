import { NotificationStatus } from "@/components/app/NotificationStatus";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminHeader,
  AdminTable,
  AdminTd,
  AdminTr,
} from "@/routes/admin";
import { adminListBookingsFn } from "@/lib/functions";
import type { BookingRow } from "@/lib/server/db";
import {useState} from 'react';
import {useRouter} from '@tanstack/react-router';
import {bookingDeliveryEventsFn,retryBookingEventFn} from '@/lib/booking-functions';

export const Route = createFileRoute("/admin/bookings")({
  loader: async () => ({bookings:await adminListBookingsFn(),events:await bookingDeliveryEventsFn()}),
  component: BookingsPage,
});

function BookingsPage() {
  const {bookings,events} = Route.useLoaderData(),router=useRouter();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function retry(id:string){setBusy(true);setError('');try{await retryBookingEventFn({data:{id}});await router.invalidate();}catch{setError('Delivery state could not be updated. Check provider logs before retrying.');}finally{setBusy(false);}}

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
          head={["Name", "Email", "Phone", "Topic", "Status", "Appointment / request date"]}
        >
          {bookings.map((b: BookingRow) => (
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
                  {b.provider_invitee_uri?<p className="text-xs">Provider verified · {b.intent_id?'account linked':'unlinked — reconcile manually'}{b.old_invitee_uri?' · rescheduled from an earlier appointment':''}</p>:<NotificationStatus kind="bookings" id={b.id} status={b.notification_status} createdAt={b.created_at} />}
              </AdminTd>
              <AdminTd className="text-ink-mute tabular-nums text-xs">
                {b.starts_at?new Date(Number(b.starts_at)).toLocaleString():`Request: ${formatDate(Number(b.created_at))}`}
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}
      <section className="mt-8 space-y-4"><h2 className="text-xl">Verified-event email delivery</h2><p className="text-sm">One durable notification per provider state. Failed/skipped events can be retried within 23 hours. Interrupted sends and older events require Resend log reconciliation to avoid duplicates. Appointment status is independent of email delivery.</p>{error&&<p role="alert">{error}</p>}{events.map(e=><div key={e.id} className="border border-rule p-3 text-sm"><p>{e.booking_id} · {e.delivery_status} · {e.attempts} attempts</p>{e.last_error&&<p>{e.last_error}</p>}{['pending','failed','skipped'].includes(e.delivery_status)&&Number(e.created_at)>Date.now()-23*3600000&&<button disabled={busy} className="underline" onClick={()=>retry(e.id)}>Retry notification</button>}</div>)}</section>
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
