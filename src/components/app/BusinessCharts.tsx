import { Link } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { BusinessAnalytics } from "@/lib/server/business-analytics";
export function BusinessCharts({
  data,
  onOpen,
}: {
  data: BusinessAnalytics;
  onOpen?: (path: string) => void;
}) {
  const panels = [
    { title: "Mandate status", rows: data.jobs, to: "/admin/jobs" },
    { title: "Enquiry workload", rows: data.enquiries, to: "/admin/enquiries" },
    { title: "Consultation outcomes", rows: data.bookings, to: "/admin/bookings" },
    { title: "Email delivery", rows: data.delivery, to: "/admin/campaigns" },
    { title: "CV task queue", rows: data.processing, to: "/admin/processing" },
    { title: "Communication task queue", rows: data.communications, to: "/admin/operations" },
  ];
  return (
    <section className="space-y-5 mb-10" aria-label="Business operations analytics">
      <div>
        <h2 className="text-xl font-semibold">Business operations</h2>
        <p className="text-sm text-ink-soft mt-2">
          Current status snapshots, not conversion funnels. Updated{" "}
          {new Date(data.asOf).toLocaleString("en-GB")}. Revenue and profit are not tracked.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          [
            "Average time to fill",
            data.averageDaysToFill === null ? "—" : `${data.averageDaysToFill} days`,
            `${data.filled} currently filled mandates; creation to fill`,
          ],
          ["Ageing open mandates", data.ageingJobs, "Open for more than 30 days"],
          [
            "Enquiries needing attention",
            data.overdueEnquiries,
            "New or pending for more than 48 hours",
          ],
        ].map(([label, value, note]) => (
          <div key={label} className="border border-rule rounded-xl p-5">
            <p className="text-sm text-ink-soft">{label}</p>
            <p className="text-3xl font-semibold mt-3">{value}</p>
            <p className="text-xs text-ink-soft mt-2">{note}</p>
          </div>
        ))}
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        {panels.map((p) => (
          <section key={p.title} className="min-w-0 border border-rule rounded-xl p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold">{p.title}</h3>
              {onOpen ? (
                <button className="text-sm underline" onClick={() => onOpen(p.to)}>
                  Open workspace
                </button>
              ) : (
                <Link to={p.to} className="text-sm underline">
                  Open workspace
                </Link>
              )}
            </div>
            {p.rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink-soft">
                No records yet. This chart will populate as work is recorded.
              </p>
            ) : (
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={p.rows}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                    accessibilityLayer
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="label" width={95} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--paper)",
                        color: "var(--ink)",
                        borderColor: "var(--rule)",
                      }}
                    />
                    <Bar dataKey="count" name="Records" fill="#4464a8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer">View exact counts</summary>
              <table className="w-full mt-3">
                <thead>
                  <tr>
                    <th className="text-left">Status</th>
                    <th className="text-right">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {p.rows.map((r) => (
                    <tr key={r.label}>
                      <td className="py-2">{r.label}</td>
                      <td className="text-right tabular-nums">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        ))}
      </div>
    </section>
  );
}
