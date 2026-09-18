import { useState } from "react";
import { createBookingIntentFn, bookingIntentStatusFn } from "@/lib/booking-functions";
export function ConsultationBooking({ queryId }: { queryId?: string }) {
  const [intent, setIntent] = useState<{ id: string; url: string } | null>(null),
    [bookings, setBookings] = useState<Awaited<ReturnType<typeof bookingIntentStatusFn>>>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [checked, setChecked] = useState(false);
  async function start() {
    setBusy(true);
    setError("");
    try {
      setIntent(await createBookingIntentFn({ data: { queryId } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scheduling unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function check() {
    if (!intent) return;
    setBusy(true);
    setError("");
    try {
      setBookings(await bookingIntentStatusFn({ data: { id: intent.id } }));
      setChecked(true);
    } catch {
      setError("Booking status could not be checked. Retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border border-rule rounded p-5 space-y-4">
      <h2 className="text-xl">Consult a qualified adviser</h2>
      <p className="text-sm">
        Scheduling is provided by Calendly. Opening it shares browser information with Calendly;
        your HR question is not sent. Use the email of your signed-in account to link the
        appointment. Calendly handles its own appointment emails.
      </p>
      {!intent ? (
        <button disabled={busy} onClick={start} className="underline">
          Open Calendly scheduling
        </button>
      ) : (
        <>
          <iframe
            title="Schedule a consultation with Calendly"
            src={intent.url}
            referrerPolicy="no-referrer"
            className="w-full h-[720px] border-0"
          />
          <button disabled={busy} onClick={check} className="underline">
            Check verified booking status
          </button>
          <p className="text-sm">
            A completed booking screen is not confirmation in UKTL. Status below appears only after
            a verified provider event.
          </p>
        </>
      )}
      {checked && bookings.length === 0 && (
        <p>
          No verified appointment is linked yet. Allow time for the webhook, then retry. A different
          booking email will require staff reconciliation.
        </p>
      )}
      {bookings.map((b) => (
        <div key={b.id} className="border-t border-rule pt-3">
          <p>
            Verified: {b.status} · {new Date(Number(b.starts_at)).toLocaleString()}
          </p>
          {b.status === "confirmed" && (
            <p className="flex gap-4">
              {b.cancel_url && (
                <a href={b.cancel_url} rel="noreferrer" target="_blank" className="underline">
                  Cancel in Calendly
                </a>
              )}
              {b.reschedule_url && (
                <a href={b.reschedule_url} rel="noreferrer" target="_blank" className="underline">
                  Reschedule in Calendly
                </a>
              )}
            </p>
          )}
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
