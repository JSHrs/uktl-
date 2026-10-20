import type { AppEnv } from "./env";
/** Current operational snapshots; never label these as historical conversion funnels. */
export async function businessAnalytics(env: AppEnv, now = Date.now()) {
  const queries = [
    "SELECT status AS label,count(*) AS count FROM jobs GROUP BY status",
    "SELECT status AS label,count(*) AS count FROM enquiries GROUP BY status",
    "SELECT status AS label,count(*) AS count FROM bookings GROUP BY status",
    "SELECT status AS label,count(*) AS count FROM candidate_messages GROUP BY status",
    "SELECT status AS label,count(*) AS count FROM processing_jobs GROUP BY status",
    "SELECT status AS label,count(*) AS count FROM communication_jobs GROUP BY status",
    "SELECT count(*) AS filled,avg((filled_at-created_at)/86400000.0) AS days FROM jobs WHERE status='filled' AND filled_at>=created_at",
    "SELECT count(*) AS count FROM jobs WHERE status='open' AND created_at<?",
    "SELECT count(*) AS count FROM enquiries WHERE lower(status) IN ('new','pending') AND created_at<?",
  ];
  const results = await env.DB.batch(
    queries.map((q, i) =>
      i >= 7 ? env.DB.prepare(q).bind(now - (i === 7 ? 30 : 2) * 86400000) : env.DB.prepare(q),
    ),
  );
  const rows = (i: number) =>
    ((results[i].results ?? []) as { label: string; count: number }[]).map((r) => ({
      label: r.label,
      count: Number(r.count),
    }));
  const fill = results[6].results?.[0] as { filled: number; days: number | null } | undefined;
  return {
    asOf: now,
    jobs: rows(0),
    enquiries: rows(1),
    bookings: rows(2),
    delivery: rows(3),
    processing: rows(4),
    communications: rows(5),
    filled: Number(fill?.filled ?? 0),
    averageDaysToFill: fill?.days == null ? null : Math.round(Number(fill.days) * 10) / 10,
    ageingJobs: Number((results[7].results?.[0] as { count: number } | undefined)?.count ?? 0),
    overdueEnquiries: Number(
      (results[8].results?.[0] as { count: number } | undefined)?.count ?? 0,
    ),
  };
}
export type BusinessAnalytics = Awaited<ReturnType<typeof businessAnalytics>>;
