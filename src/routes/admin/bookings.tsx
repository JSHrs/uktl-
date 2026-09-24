import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { NotificationStatus } from "@/components/app/NotificationStatus";
import { AdminHeader, ExportLink, AdminTable, AdminTd, AdminTr, AdminBtn, AdminField, inputCls, selectCls } from "@/routes/admin";
import { adminListBookingsFn } from "@/lib/functions";
import type { BookingRow } from "@/lib/server/db";
import {
  adminCalendarFn,
  bookingDeliveryEventsFn,
  retryBookingEventFn,
  saveCalendarSettingsFn,
  saveAvailabilityFn,
  addAvailabilityBlockFn,
  removeAvailabilityBlockFn,
  staffCancelBookingFn,
} from "@/lib/booking-functions";

export const Route = createFileRoute("/admin/bookings")({
  loader: async () => {
    const [calendar, events, requests] = await Promise.all([
      adminCalendarFn(),
      bookingDeliveryEventsFn(),
      adminListBookingsFn(),
    ]);
    return { calendar, events, requests: requests.filter((b: BookingRow & { source?: string }) => b.source !== "native") };
  },
  component: ConsultationsAdmin,
});

const TZ = "Europe/London";
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const fmt = (ms: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o }).format(ms);
const toHm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const fromHm = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};
function ConsultationsAdmin() {
  const { calendar, events, requests } = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await router.invalidate();
      setNotice(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();
  const upcoming = calendar.upcoming.filter((b) => b.ends_at > now);
  const byDay = new Map<string, typeof upcoming>();
  for (const b of upcoming) {
    const k = fmt(b.starts_at, { weekday: "long", day: "numeric", month: "long" });
    byDay.set(k, [...(byDay.get(k) ?? []), b]);
  }
  const confirmedCount = upcoming.filter((b) => b.status === "confirmed").length;

  return (
    <>
      <AdminHeader
        title="Consultations"
        sub={`${confirmedCount} upcoming · ${calendar.rules.length ? "calendar open" : "no opening hours set"} · times in UK time`}
        actions={<ExportLink kind="bookings" />}
      />
      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`mb-6 text-sm border rounded px-3 py-2 ${error ? "text-red-700 border-red-300" : "text-accent border-accent/30"}`}>
          {error || notice}
        </p>
      )}

      <section className="mb-10">
        <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute mb-3">Upcoming appointments</h2>
        {byDay.size === 0 ? (
          <div className="border border-dashed border-rule rounded-md p-8 text-center text-sm text-ink-mute">
            No upcoming consultations. {calendar.rules.length ? "Candidates can book from their account." : "Set opening hours below to open the calendar."}
          </div>
        ) : (
          <div className="space-y-5">
            {[...byDay.entries()].map(([label, items]) => (
              <div key={label}>
                <p className="text-sm text-ink mb-2">{label}</p>
                <div className="border border-rule rounded-md divide-y divide-rule">
                  {items.map((b) => (
                    <div key={b.id} className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-sm ${b.status === "cancelled" ? "opacity-60" : ""}`}>
                      <span className="tabular-nums text-ink w-28">
                        {fmt(b.starts_at, { hour: "2-digit", minute: "2-digit" })}–{fmt(b.ends_at, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-ink min-w-[10rem]">{b.contact_name ?? "—"}</span>
                      <a href={`mailto:${b.contact_email}`} className="underline text-ink-soft">{b.contact_email}</a>
                      {b.contact_phone && <span className="text-ink-soft">{b.contact_phone}</span>}
                      <span className="text-ink-mute">{b.topic_area ?? ""}</span>
                      <span className="ml-auto flex gap-3 items-center">
                        {b.status === "cancelled" ? (
                          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-mute">
                            {b.rescheduled_to ? "rescheduled" : `cancelled by ${b.cancelled_by ?? "—"}`}
                          </span>
                        ) : (
                          <>
                            <a href={`/api/consultations/${b.id}`} className="underline text-ink-soft">.ics</a>
                            <AdminBtn variant="danger" disabled={busy} onClick={() => { if (window.confirm("Cancel this consultation and email the candidate?")) void run(() => staffCancelBookingFn({ data: { id: b.id } }), "Consultation cancelled; the candidate has been emailed."); }}>
                              Cancel
                            </AdminBtn>
                          </>
                        )}
                      </span>
                      {b.notes && <p className="basis-full text-ink-soft text-[13px] whitespace-pre-wrap">{b.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-10 mb-10">
        <AvailabilityEditor rules={calendar.rules} busy={busy} onSave={(rules) => run(() => saveAvailabilityFn({ data: { rules } }), "Opening hours saved.")} />
        <SettingsEditor settings={calendar.settings} busy={busy} onSave={(s) => run(() => saveCalendarSettingsFn({ data: s }), "Booking rules saved.")} />
      </div>

      <ClosuresEditor
        blocks={calendar.blocks}
        busy={busy}
        onAdd={(from, to, reason) => run(() => addAvailabilityBlockFn({ data: { from, to, reason } }), "Closure added.")}
        onRemove={(id) => run(() => removeAvailabilityBlockFn({ data: { id } }), "Closure removed.")}
      />

      <section className="mt-10 space-y-3">
        <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute">Email delivery</h2>
        <p className="text-sm text-ink-soft max-w-2xl">
          Each confirmation, reschedule and cancellation emails the candidate (with a calendar file) and the team inbox.
          Failed or skipped sends can be retried within 23 hours; older ones need checking in the Resend log first so nobody receives a duplicate.
        </p>
        {events.length === 0 ? (
          <p className="text-sm text-ink-mute">No booking emails yet.</p>
        ) : (
          <AdminTable head={["Event", "Status", "Attempts", "Created", ""]}>
            {events.map((e) => (
              <AdminTr key={e.id}>
                <AdminTd className="font-mono text-xs">{e.id.slice(0, 40)}</AdminTd>
                <AdminTd>{e.delivery_status}{e.last_error ? <span className="block text-xs text-ink-mute">{e.last_error}</span> : null}</AdminTd>
                <AdminTd className="tabular-nums">{e.attempts}</AdminTd>
                <AdminTd className="tabular-nums text-xs text-ink-mute">{fmt(Number(e.created_at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</AdminTd>
                <AdminTd>
                  {["pending", "failed", "skipped"].includes(e.delivery_status) && Number(e.created_at) > now - 23 * 3600000 && (
                    <AdminBtn disabled={busy} onClick={() => run(() => retryBookingEventFn({ data: { id: e.id } }), "Retry attempted.")}>Retry</AdminBtn>
                  )}
                </AdminTd>
              </AdminTr>
            ))}
          </AdminTable>
        )}
      </section>

      {requests.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute">Earlier requests (before the native calendar)</h2>
          <AdminTable head={["Name", "Email", "Topic", "Status", "Date"]}>
            {requests.map((b: BookingRow) => (
              <AdminTr key={b.id}>
                <AdminTd>{b.contact_name ?? "—"}</AdminTd>
                <AdminTd><a href={`mailto:${b.contact_email}`} className="underline">{b.contact_email}</a></AdminTd>
                <AdminTd className="text-ink-soft">{b.topic_area ?? "—"}</AdminTd>
                <AdminTd>
                  {b.status}
                  {!b.provider_invitee_uri && <NotificationStatus kind="bookings" id={b.id} status={b.notification_status} createdAt={b.created_at} />}
                </AdminTd>
                <AdminTd className="tabular-nums text-xs text-ink-mute">
                  {fmt(Number(b.starts_at ?? b.created_at), { day: "numeric", month: "short", year: "numeric" })}
                </AdminTd>
              </AdminTr>
            ))}
          </AdminTable>
        </section>
      )}
    </>
  );
}

type Rule = { weekday: number; start_minute: number; end_minute: number };

function AvailabilityEditor({ rules, busy, onSave }: { rules: Rule[]; busy: boolean; onSave: (r: Rule[]) => void }) {
  const [draft, setDraft] = useState<Rule[]>(rules.map(({ weekday, start_minute, end_minute }) => ({ weekday, start_minute, end_minute })));
  const update = (i: number, patch: Partial<Rule>) => setDraft((d) => d.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <section>
      <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute mb-3">Weekly opening hours</h2>
      <div className="border border-rule rounded-md divide-y divide-rule">
        {WEEKDAYS.map((name, idx) => {
          const weekday = idx + 1;
          const periods = draft.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === weekday);
          return (
            <div key={name} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-24 text-sm text-ink">{name}</span>
              <div className="flex-1 space-y-2">
                {periods.length === 0 && <span className="text-sm text-ink-mute">Closed</span>}
                {periods.map(({ r, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <input aria-label={`${name} opens`} type="time" step={900} className={`${inputCls} w-28`} value={toHm(r.start_minute)} onChange={(e) => update(i, { start_minute: fromHm(e.target.value) })} />
                    <span className="text-ink-mute">–</span>
                    <input aria-label={`${name} closes`} type="time" step={900} className={`${inputCls} w-28`} value={toHm(r.end_minute === 1440 ? 0 : r.end_minute)} onChange={(e) => update(i, { end_minute: fromHm(e.target.value) || 1440 })} />
                    <button type="button" className="text-xs underline text-ink-mute" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" className="text-xs underline text-ink-soft" onClick={() => setDraft((d) => [...d, { weekday, start_minute: 540, end_minute: 1020 }])}>
                Add hours
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3"><AdminBtn variant="primary" disabled={busy} onClick={() => onSave(draft)}>Save opening hours</AdminBtn></div>
    </section>
  );
}

type Settings = { slot_minutes: number; buffer_minutes: number; min_notice_hours: number; max_days_ahead: number; daily_limit: number; location: string };

function SettingsEditor({ settings, busy, onSave }: { settings: Settings; busy: boolean; onSave: (s: Settings & { slot_minutes: 15 | 20 | 30 | 45 | 60 | 90 }) => void }) {
  const [s, setS] = useState(settings);
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setS({ ...s, [k]: Number(e.target.value) });
  return (
    <section>
      <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute mb-3">Booking rules</h2>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Appointment length">
          <select className={selectCls} value={s.slot_minutes} onChange={num("slot_minutes")}>
            {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </AdminField>
        <AdminField label="Gap between appointments" hint="Minutes kept free before and after each booking.">
          <input type="number" min={0} max={120} className={inputCls} value={s.buffer_minutes} onChange={num("buffer_minutes")} />
        </AdminField>
        <AdminField label="Minimum notice (hours)">
          <input type="number" min={0} max={336} className={inputCls} value={s.min_notice_hours} onChange={num("min_notice_hours")} />
        </AdminField>
        <AdminField label="Book up to (days ahead)">
          <input type="number" min={1} max={180} className={inputCls} value={s.max_days_ahead} onChange={num("max_days_ahead")} />
        </AdminField>
        <AdminField label="Maximum per day">
          <input type="number" min={1} max={48} className={inputCls} value={s.daily_limit} onChange={num("daily_limit")} />
        </AdminField>
        <div className="col-span-2">
          <AdminField label="Location shown to candidates" hint="E.g. how the video link or phone call will reach them.">
            <input className={inputCls} maxLength={300} value={s.location} onChange={(e) => setS({ ...s, location: e.target.value })} />
          </AdminField>
        </div>
      </div>
      <div className="mt-3">
        <AdminBtn variant="primary" disabled={busy} onClick={() => onSave(s as Settings & { slot_minutes: 30 })}>Save booking rules</AdminBtn>
      </div>
    </section>
  );
}

function ClosuresEditor({
  blocks,
  busy,
  onAdd,
  onRemove,
}: {
  blocks: { id: string; starts_at: number; ends_at: number; reason: string | null }[];
  busy: boolean;
  onAdd: (from: string, to: string, reason?: string) => void;
  onRemove: (id: string) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const valid = from && (to || from) && (to || from) >= from;
  return (
    <section>
      <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute mb-3">Closures and leave</h2>
      <div className="flex flex-wrap items-end gap-3">
        <AdminField label="From"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></AdminField>
        <AdminField label="To (inclusive)"><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></AdminField>
        <AdminField label="Reason (internal)"><input className={inputCls} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bank holiday" /></AdminField>
        <AdminBtn
          disabled={busy || !valid}
          onClick={() => {
            onAdd(from, to || from, reason || undefined);
            setFrom(""); setTo(""); setReason("");
          }}
        >
          Add closure
        </AdminBtn>
      </div>
      {blocks.length > 0 && (
        <ul className="mt-4 border border-rule rounded-md divide-y divide-rule">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center gap-4 px-4 py-2 text-sm">
              <span className="tabular-nums text-ink">
                {fmt(b.starts_at, { day: "numeric", month: "short", year: "numeric" })} – {fmt(b.ends_at - 1, { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="text-ink-mute flex-1">{b.reason ?? ""}</span>
              <button disabled={busy} className="text-xs underline" onClick={() => onRemove(b.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
