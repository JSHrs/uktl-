import type { AppEnv } from "./env";

export async function syncReedJobs(env: AppEnv, data: { keywords: string; sector: "construction" | "technology"; resultsToTake: number }) {
    if (!env.REED_API_KEY) throw new Error("REED_API_KEY not configured");

    // Reed API uses HTTP Basic Auth: API key as username, password blank
    const auth = btoa(`${env.REED_API_KEY}:`);
    const params = new URLSearchParams({
      keywords: data.keywords || (data.sector === "construction" ? "construction engineering" : "software technology"),
      locationName: "United Kingdom",
      resultsToTake: String(data.resultsToTake),
      fullTime: "true",
    });

    const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Reed API error: ${res.status}`);

    const body = (await res.json()) as { results?: ReedJob[] };
    const reedJobs = body.results ?? [];

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const rj of reedJobs) {
      const existing = await env.DB.prepare(`SELECT id FROM jobs WHERE source_id=?`)
        .bind(String(rj.jobId))
        .first<{ id: string }>();
      if (existing) { skipped++; continue; }

      const id = "job_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const now = Date.now();
      await env.DB.prepare(
        `INSERT INTO jobs (id, created_at, title, company, location, sector, description, must_have_skills, nice_to_have_skills, status, source, source_id, source_url, posted_date, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'reed', ?, ?, ?, ?)`,
      ).bind(
        id, now,
        rj.jobTitle, rj.employerName ?? null,
        rj.locationName ?? null, data.sector,
        rj.jobDescription ?? null,
        JSON.stringify([]), JSON.stringify([]),
        String(rj.jobId),
        rj.jobUrl ?? null,
        rj.date ?? null,
        rj.expirationDate ?? null,
      ).run().then((result) => {
        if (result.success) inserted++;
        else failed++;
      }).catch(() => { failed++; });
    }

    return { inserted, skipped, failed, total: reedJobs.length };
}

type ReedJob = {
  jobId: number;
  jobTitle: string;
  employerName?: string;
  locationName?: string;
  jobDescription?: string;
  jobUrl?: string;
  date?: string;
  expirationDate?: string;
};

