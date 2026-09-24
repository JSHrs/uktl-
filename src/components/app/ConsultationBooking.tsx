import { useEffect, useMemo, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import {
  consultationSlotsFn,
  bookConsultationFn,
  myBookingsFn,
  cancelMyBookingFn,
} from "@/lib/booking-functions";

type Offer = Awaited<ReturnType<typeof consultationSlotsFn>>;
type Booking = Awaited<ReturnType<typeof myBookingsFn>>[number];

const TZ = "Europe/London";
const dayKey = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(ms);
const fmtTime = (ms: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(ms);
const fmtDay = (ms: number, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(ms);

const TOPICS = [
  "My CV and applications",
  "Job matches and next steps",
  "Workplace or employment-law question",
  "Something else",
];

/**
 * Native consultation booking: pick a day, pick a time, confirm details.
 * Slots come from the firm's calendar; the server re-checks every booking.
 */
export function ConsultationBooking({ queryId, showHistory = true }: { queryId?: string; showHistory?: boolean }) {
  const { session } = useRouteContext({ from: "__root__" });
  const [offer, setOffer] = useState<Offer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [replaces, setReplaces] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState(queryId ? TOPICS[2] : TOPICS[0]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ start: number; end: number; id: string } | null>(null);

  async function load(reschedule?: string | null) {
    setError("");
    try {
      const [o, mine] = await Promise.all([
        consultationSlotsFn({ data: reschedule ? { reschedule } : {} }),
        showHistory ? myBookingsFn() : Promise.resolve([]),
      ]);
      setOffer(o);
      setBookings(mine);
      const first = o.slots[0];
      setDay(first ? dayKey(first.start) : null);
      setSlot(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consultation times could not be loaded.");
    }
  }

  useEffect(() => {
    if (session.userId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.userId]);

  const days = useMemo(() => {
    const map = new Map<string, { key: string; first: number; count: number }>();
    for (const s of offer?.slots ?? []) {
      const k = dayKey(s.start);
      const d = map.get(k);
      if (d) d.count++;
      else map.set(k, { key: k, first: s.start, count: 1 });
    }
    return [...map.values()];
  }, [offer]);
  const times = (offer?.slots ?? []).filter((s) => day && dayKey(s.start) === day);
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.starts_at > Date.now());
  const past = bookings.filter((b) => !(b.status === "confirmed" && b.starts_at > Date.now())).slice(0, 5);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setBusy(true);
    setError("");
    try {
      const result = await bookConsultationFn({
        data: {
          startsAt: slot,
          name,
          phone: phone || undefined,
          topic,
          notes: notes || undefined,
          queryId,
          replaces: replaces ?? undefined,
        },
      });
      setDone(result);
      setReplaces(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed. Choose another time.");
      await load(replaces);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm_("Cancel this consultation?")) return;
    setBusy(true);
    setError("");
    try {
      await cancelMyBookingFn({ data: { id } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setBusy(false);
    }
  }

  function reschedule(id: string) {
    setReplaces(id);
    setDone(null);
    void load(id);
  }

  if (!session.userId) {
    return (
      <section className="border border-rule rounded-lg p-6 bg-paper">
        <h2 className="font-display text-2xl text-ink" style={{ fontVariationSettings: '"opsz" 72' }}>
          Book a consultation
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          <a href="/auth/login" className="underline">Sign in</a> to choose a time with a UK Talent Link consultant.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-rule rounded-lg bg-paper overflow-hidden" aria-labelledby="consult-heading">
      <div className="px-6 pt-6 pb-4 border-b border-rule">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">
          {replaces ? "Reschedule" : "Consultation"}
          {offer ? ` · ${offer.slotMinutes} min · UK time` : ""}
        </p>
        <h2
          id="consult-heading"
          className="font-display text-2xl text-ink mt-1"
          style={{ fontVariationSettings: '"opsz" 72' }}
        >
          {replaces ? "Choose a new time" : "Book a consultation"}
        </h2>
        {offer && <p className="text-sm text-ink-soft mt-1">{offer.location}</p>}
      </div>

      {done ? (
        <div className="p-6" role="status">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent">Confirmed</p>
          <p className="mt-2 text-lg text-ink">
            {fmtDay(done.start, { weekday: "long", day: "numeric", month: "long" })}, {fmtTime(done.start)}–
            {fmtTime(done.end)}
          </p>
          <p className="text-sm text-ink-soft mt-1">A confirmation email with a calendar invite is on its way.</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <a className="underline" href={`/api/consultations/${done.id}`}>Add to calendar (.ics)</a>
            <button className="underline" onClick={() => setDone(null)}>Book another time</button>
          </div>
        </div>
      ) : !offer ? (
        <p className="p-6 text-sm text-ink-mute">{error ? "" : "Loading available times…"}</p>
      ) : offer.slots.length === 0 ? (
        <p className="p-6 text-sm text-ink-soft">
          No consultation times are open right now. Please check back soon or use the{" "}
          <a href="/contact" className="underline">contact form</a>.
        </p>
      ) : (
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="p-6 md:border-r border-rule">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute mb-3">1 · Choose a day</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="listbox" aria-label="Available days">
              {days.map((d) => (
                <button
                  key={d.key}
                  role="option"
                  aria-selected={day === d.key}
                  onClick={() => {
                    setDay(d.key);
                    setSlot(null);
                  }}
                  className={`rounded-md border px-2 py-2 text-left transition-colors ${
                    day === d.key
                      ? "border-ink bg-ink text-paper"
                      : "border-rule hover:border-ink-soft text-ink"
                  }`}
                >
                  <span className="block font-mono text-[10px] uppercase tracking-[0.1em] opacity-80">
                    {fmtDay(d.first, { weekday: "short" })}
                  </span>
                  <span className="block text-sm tabular-nums">{fmtDay(d.first, { day: "numeric", month: "short" })}</span>
                  <span className="block text-[11px] opacity-70 tabular-nums">{d.count} open</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 border-t md:border-t-0 border-rule">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute mb-3">2 · Choose a time</p>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {times.map((s) => (
                <button
                  key={s.start}
                  onClick={() => setSlot(s.start)}
                  aria-pressed={slot === s.start}
                  className={`rounded-md border px-2 py-2 text-sm tabular-nums transition-colors ${
                    slot === s.start ? "border-accent bg-accent text-paper" : "border-rule hover:border-accent text-ink"
                  }`}
                >
                  {fmtTime(s.start)}
                </button>
              ))}
            </div>
          </div>
          {slot && (
            <form onSubmit={confirm} className="md:col-span-2 p-6 border-t border-rule space-y-4">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">
                3 · Confirm · {fmtDay(slot, { weekday: "long", day: "numeric", month: "long" })}, {fmtTime(slot)}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm text-ink-soft">
                  Your name
                  <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" />
                </label>
                <label className="block text-sm text-ink-soft">
                  Phone (optional)
                  <input maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} autoComplete="tel" inputMode="tel" />
                </label>
                <label className="block text-sm text-ink-soft sm:col-span-2">
                  What would you like to discuss?
                  <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
                    {TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block text-sm text-ink-soft sm:col-span-2">
                  Anything we should know beforehand? (optional)
                  <textarea maxLength={1000} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
                </label>
              </div>
              <p className="text-xs text-ink-mute">
                We send confirmation to {session.email}. You can cancel or reschedule from My account.
              </p>
              <div className="flex gap-3">
                <button disabled={busy} className="rounded-md bg-ink text-paper px-5 py-2.5 text-sm disabled:opacity-50">
                  {busy ? "Booking…" : replaces ? "Confirm new time" : "Confirm booking"}
                </button>
                {replaces && (
                  <button type="button" className="text-sm underline" onClick={() => { setReplaces(null); void load(); }}>
                    Keep my original time
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mx-6 mb-6 text-sm text-red-700 dark:text-red-300 border border-red-300/50 rounded px-3 py-2">
          {error}
        </p>
      )}

      {showHistory && (upcoming.length > 0 || past.length > 0) && (
        <div className="border-t border-rule p-6 space-y-3">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">Your consultations</p>
          {[...upcoming].reverse().map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-ink tabular-nums">
                {fmtDay(b.starts_at, { weekday: "short", day: "numeric", month: "short" })}, {fmtTime(b.starts_at)}
              </span>
              <span className="text-ink-mute">{b.topic_area}</span>
              <a className="underline" href={`/api/consultations/${b.id}`}>.ics</a>
              <button disabled={busy} className="underline" onClick={() => reschedule(b.id)}>Reschedule</button>
              <button disabled={busy} className="underline" onClick={() => cancel(b.id)}>Cancel</button>
            </div>
          ))}
          {past.map((b) => (
            <div key={b.id} className="flex flex-wrap gap-x-4 text-sm text-ink-mute">
              <span className="tabular-nums">
                {fmtDay(b.starts_at, { day: "numeric", month: "short", year: "numeric" })}, {fmtTime(b.starts_at)}
              </span>
              <span>{b.status === "cancelled" ? (b.rescheduled_to ? "Rescheduled" : "Cancelled") : "Completed"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const field =
  "mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-ink focus:outline-none focus:border-ink";

function confirm_(message: string) {
  return typeof window === "undefined" ? false : window.confirm(message);
}
