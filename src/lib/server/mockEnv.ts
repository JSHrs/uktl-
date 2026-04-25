import type { AppEnv } from "./env";

const now = Date.now();

type Row = Record<string, unknown>;

type CandidateRow = Row & {
  id: string;
  created_at: number;
  updated_at: number;
  status: string;
  source_filename: string | null;
  source_r2_key: string | null;
  source_bytes?: number;
};

type MockState = {
  objects: Map<string, { value: ArrayBuffer | string; contentType?: string }>;
  candidates: Map<string, CandidateRow>;
  candidateSkills: Row[];
  candidateExperience: Row[];
  candidateEducation: Row[];
  jobs: Map<string, Row>;
  matches: Map<string, Row>;
};

const state: MockState = {
  objects: new Map(),
  candidates: new Map(),
  candidateSkills: [],
  candidateExperience: [],
  candidateEducation: [],
  jobs: new Map(seedJobs().map((job) => [String(job.id), job])),
  matches: new Map(),
};

let cached: AppEnv | null = null;

export function getMockEnv(): AppEnv {
  if (cached) return cached;

  cached = {
    DB: createMockD1(state),
    CV_BUCKET: createMockR2(state),
    AI: {
      async run() {
        return null;
      },
    },
    PARSE_PROVIDER: "mock",
    PARSE_MODEL: "heuristic-preview",
  };

  return cached;
}

function createMockR2(mock: MockState): R2Bucket {
  return {
    async put(key, value, options) {
      mock.objects.set(key, {
        value: typeof value === "string" || value instanceof ArrayBuffer ? value : "",
        contentType: options?.httpMetadata?.contentType,
      });
    },
    async get(key) {
      const obj = mock.objects.get(key);
      if (!obj) return null;
      return {
        async arrayBuffer() {
          if (obj.value instanceof ArrayBuffer) return obj.value;
          return new TextEncoder().encode(obj.value).buffer;
        },
        async text() {
          if (typeof obj.value === "string") return obj.value;
          return new TextDecoder().decode(obj.value);
        },
      };
    },
    async delete(key) {
      mock.objects.delete(key);
    },
  };
}

function createMockD1(mock: MockState): D1Database {
  return {
    prepare(query) {
      return createStatement(mock, query, []);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]) {
      const results: D1Result<T>[] = [];
      for (const statement of statements) {
        results.push(await statement.run<T>());
      }
      return results;
    },
    async exec() {
      return { count: 0, duration: 0 };
    },
  };
}

function createStatement(
  mock: MockState,
  query: string,
  values: unknown[],
): D1PreparedStatement {
  const normalised = query.replace(/\s+/g, " ").trim().toLowerCase();

  return {
    bind(...nextValues: unknown[]) {
      return createStatement(mock, query, nextValues);
    },
    async first<T = unknown>(colName?: string) {
      const rows = executeRows(mock, normalised, values);
      const first = rows[0] ?? null;
      if (!first || !colName) return first as T | null;
      return (first[colName] ?? null) as T | null;
    },
    async run<T = unknown>() {
      executeMutation(mock, normalised, values);
      return { success: true, results: [] as T[] };
    },
    async all<T = unknown>() {
      return { success: true, results: executeRows(mock, normalised, values) as T[] };
    },
    async raw<T = unknown[]>() {
      return executeRows(mock, normalised, values).map((row) => Object.values(row)) as T[];
    },
  };
}

function executeMutation(mock: MockState, query: string, values: unknown[]): void {
  if (query.startsWith("insert into candidates")) {
    const [id, createdAt, updatedAt, filename, r2Key, sizeBytes] = values;
    mock.candidates.set(String(id), {
      id: String(id),
      created_at: Number(createdAt),
      updated_at: Number(updatedAt),
      status: "uploaded",
      source_filename: String(filename),
      source_r2_key: String(r2Key),
      source_bytes: Number(sizeBytes),
      name: null,
      email: null,
      phone: null,
      location: null,
      headline: null,
      summary: null,
      total_years_experience: null,
      seniority: null,
      work_authorization: null,
      quality_score: null,
      quality_notes: "[]",
      links: "{}",
      raw_profile: null,
      parse_error: null,
    });
    return;
  }

  if (query.startsWith("update candidates set status='parsing'")) {
    const [updatedAt, id] = values;
    const candidate = mock.candidates.get(String(id));
    if (candidate) {
      candidate.status = "parsing";
      candidate.updated_at = Number(updatedAt);
    }
    return;
  }

  if (query.startsWith("update candidates set status='failed'")) {
    const [error, updatedAt, id] = values;
    const candidate = mock.candidates.get(String(id));
    if (candidate) {
      candidate.status = "failed";
      candidate.parse_error = String(error);
      candidate.updated_at = Number(updatedAt);
    }
    return;
  }

  if (query.startsWith("update candidates set status='parsed'")) {
    const [
      updatedAt,
      name,
      email,
      phone,
      location,
      headline,
      summary,
      totalYearsExperience,
      seniority,
      workAuthorization,
      qualityScore,
      qualityNotes,
      links,
      rawProfile,
      id,
    ] = values;
    const candidate = mock.candidates.get(String(id));
    if (candidate) {
      Object.assign(candidate, {
        status: "parsed",
        updated_at: Number(updatedAt),
        name,
        email,
        phone,
        location,
        headline,
        summary,
        total_years_experience: totalYearsExperience,
        seniority,
        work_authorization: workAuthorization,
        quality_score: qualityScore,
        quality_notes: qualityNotes,
        links,
        raw_profile: rawProfile,
        parse_error: null,
      });
    }
    return;
  }

  if (query.startsWith("delete from candidate_skills")) {
    const [candidateId] = values;
    mock.candidateSkills = mock.candidateSkills.filter(
      (row) => row.candidate_id !== candidateId,
    );
    return;
  }

  if (query.startsWith("delete from candidate_experience")) {
    const [candidateId] = values;
    mock.candidateExperience = mock.candidateExperience.filter(
      (row) => row.candidate_id !== candidateId,
    );
    return;
  }

  if (query.startsWith("delete from candidate_education")) {
    const [candidateId] = values;
    mock.candidateEducation = mock.candidateEducation.filter(
      (row) => row.candidate_id !== candidateId,
    );
    return;
  }

  if (query.startsWith("insert into candidate_skills")) {
    const [candidateId, skill, skillRaw, yearsExperience] = values;
    mock.candidateSkills.push({ candidate_id: candidateId, skill, skill_raw: skillRaw, years_experience: yearsExperience });
    return;
  }

  if (query.startsWith("insert into candidate_experience")) {
    const [id, candidateId, company, title, startDate, endDate, isCurrent, location, description, sortOrder] = values;
    mock.candidateExperience.push({ id, candidate_id: candidateId, company, title, start_date: startDate, end_date: endDate, is_current: isCurrent, location, description, sort_order: sortOrder });
    return;
  }

  if (query.startsWith("insert into candidate_education")) {
    const [id, candidateId, institution, degree, field, startYear, endYear] = values;
    mock.candidateEducation.push({ id, candidate_id: candidateId, institution, degree, field, start_year: startYear, end_year: endYear });
    return;
  }

  if (query.startsWith("insert into matches")) {
    const [candidateId, jobId, score, skillsOverlap, experienceFit, seniorityFit, locationFit, matchedSkills, missingSkills, reasoning, computedAt] = values;
    mock.matches.set(`${candidateId}:${jobId}`, {
      candidate_id: candidateId,
      job_id: jobId,
      score,
      skills_overlap: skillsOverlap,
      experience_fit: experienceFit,
      seniority_fit: seniorityFit,
      location_fit: locationFit,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      reasoning,
      computed_at: computedAt,
    });
  }
}

function executeRows(mock: MockState, query: string, values: unknown[]): Row[] {
  if (query.includes("from candidates where id=?")) {
    const candidate = mock.candidates.get(String(values[0]));
    return candidate ? [candidate] : [];
  }

  if (query.includes("from candidate_skills where candidate_id=?")) {
    return mock.candidateSkills.filter((row) => row.candidate_id === values[0]);
  }

  if (query.includes("from candidate_experience where candidate_id=?")) {
    return mock.candidateExperience
      .filter((row) => row.candidate_id === values[0])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  }

  if (query.includes("from candidate_education where candidate_id=?")) {
    return mock.candidateEducation.filter((row) => row.candidate_id === values[0]);
  }

  if (query.includes("from candidates") && query.includes("order by created_at desc")) {
    const limit = Number(values[0] ?? 50);
    return Array.from(mock.candidates.values())
      .sort((a, b) => Number(b.created_at) - Number(a.created_at))
      .slice(0, limit);
  }

  if (query.includes("from jobs where status='open'")) {
    return Array.from(mock.jobs.values())
      .filter((row) => row.status === "open")
      .sort((a, b) => Number(b.created_at) - Number(a.created_at));
  }

  if (query.includes("from jobs where id=?")) {
    const job = mock.jobs.get(String(values[0]));
    return job ? [job] : [];
  }

  if (query.includes("from matches m join jobs j") && query.includes("where m.candidate_id=?")) {
    return Array.from(mock.matches.values())
      .filter((match) => match.candidate_id === values[0])
      .sort((a, b) => Number(b.score) - Number(a.score))
      .map((match) => {
        const job = mock.jobs.get(String(match.job_id)) ?? {};
        return {
          ...match,
          j_title: job.title,
          j_company: job.company,
          j_location: job.location,
          j_sector: job.sector,
          j_seniority: job.seniority,
          j_min_years: job.min_years_experience,
          j_description: job.description,
          j_must: job.must_have_skills,
          j_nice: job.nice_to_have_skills,
          j_status: job.status,
          j_created: job.created_at,
        };
      });
  }

  if (query.includes("from matches m join candidates c") && query.includes("where m.job_id=?")) {
    return Array.from(mock.matches.values())
      .filter((match) => match.job_id === values[0])
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 50)
      .map((match) => {
        const candidate = mock.candidates.get(String(match.candidate_id)) ?? {};
        return {
          ...match,
          c_name: candidate.name,
          c_headline: candidate.headline,
        };
      });
  }

  if (query.includes("select raw_profile from candidates where id=?")) {
    const candidate = mock.candidates.get(String(values[0]));
    return candidate ? [{ raw_profile: candidate.raw_profile ?? null }] : [];
  }

  return [];
}

function seedJobs(): Row[] {
  return [
    {
      id: "job_cfo_fin_london",
      created_at: now,
      title: "Chief Financial Officer",
      company: "Private UK Wealth Manager",
      location: "London",
      sector: "Financial Services",
      seniority: "executive",
      min_years_experience: 15,
      description: "Retained search for CFO of a private UK wealth manager.",
      must_have_skills: JSON.stringify(["finance leadership", "fca regulation", "board reporting", "financial planning"]),
      nice_to_have_skills: JSON.stringify(["wealth management", "treasury", "investor relations", "mergers and acquisitions"]),
      status: "open",
    },
    {
      id: "job_hrd_tech_london",
      created_at: now - 1,
      title: "HR Director",
      company: "Series C FinTech",
      location: "London",
      sector: "Technology",
      seniority: "director",
      min_years_experience: 10,
      description: "Scale-up HRD covering TUPE integration, UK employment law, remuneration, and org design.",
      must_have_skills: JSON.stringify(["human resources", "employment law", "tupe", "organisational design", "remuneration"]),
      nice_to_have_skills: JSON.stringify(["fintech", "scale-up experience", "equity design"]),
      status: "open",
    },
    {
      id: "job_ged_energy_riyadh",
      created_at: now - 2,
      title: "General Counsel — Energy",
      company: "Saudi Energy Major",
      location: "Riyadh",
      sector: "Energy",
      seniority: "executive",
      min_years_experience: 18,
      description: "GC for upstream and midstream operations.",
      must_have_skills: JSON.stringify(["corporate law", "energy sector", "contract negotiation", "regulatory affairs"]),
      nice_to_have_skills: JSON.stringify(["arabic", "ksa experience", "upstream oil and gas"]),
      status: "open",
    },
    {
      id: "job_head_digital_dubai",
      created_at: now - 3,
      title: "Head of Digital Health",
      company: "GCC Health Platform",
      location: "Dubai",
      sector: "Healthcare",
      seniority: "senior",
      min_years_experience: 8,
      description: "Own the digital product line for a regional health platform.",
      must_have_skills: JSON.stringify(["product management", "healthcare", "digital transformation", "team leadership"]),
      nice_to_have_skills: JSON.stringify(["gcc experience", "telemedicine", "data analytics"]),
      status: "open",
    },
    {
      id: "job_partner_consultancy_doha",
      created_at: now - 4,
      title: "Partner — Strategy Consulting",
      company: "Boutique Consultancy",
      location: "Doha",
      sector: "Professional Services",
      seniority: "executive",
      min_years_experience: 14,
      description: "Client-facing partner with a book of business in GCC public sector or banking.",
      must_have_skills: JSON.stringify(["strategy consulting", "client management", "business development", "financial services"]),
      nice_to_have_skills: JSON.stringify(["public sector", "gcc", "arabic"]),
      status: "open",
    },
    {
      id: "job_head_retail_abudhabi",
      created_at: now - 5,
      title: "Head of Retail Operations",
      company: "Regional Consumer Group",
      location: "Abu Dhabi",
      sector: "Consumer & Retail",
      seniority: "senior",
      min_years_experience: 10,
      description: "Operational leadership across 120 retail outlets in the UAE.",
      must_have_skills: JSON.stringify(["retail operations", "p&l management", "supply chain", "team leadership"]),
      nice_to_have_skills: JSON.stringify(["uae experience", "franchising", "luxury retail"]),
      status: "open",
    },
  ];
}
