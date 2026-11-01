import { useState, type FormEvent, type ReactNode } from "react";

/*
 * Forms shared by the employer portal and employer onboarding. They only collect and
 * validate input; the caller decides which server function to send it to.
 */

export const input =
  "w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors";
export const labelCls = "block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5";

export function Field({ id, label, hint, children, wide }: { id: string; label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-ink-mute mt-1">{hint}</p>}
    </div>
  );
}

/** Toggleable chips for a short multi-select. */
export function Chips({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${on ? "bg-ink text-paper border-ink" : "border-rule text-ink-soft hover:border-ink"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Single choice shown as a segmented row. */
export function Segment<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-3.5 py-2 text-[13px] transition-colors ${value === o.value ? "bg-ink text-paper border-ink" : "border-rule text-ink-soft hover:border-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Free-text skills entered as a comma-separated list. */
export function splitSkills(raw: string) {
  return [...new Set(raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean))].slice(0, 30);
}

export const SECTORS = ["Construction & engineering", "Technology & digital", "Energy & infrastructure", "Financial services", "Legal & professional services", "Healthcare & life sciences"];
export const MARKETS = ["United Kingdom", "UAE", "Saudi Arabia", "Qatar", "Oman", "Bahrain", "Kuwait"];
export const SERVICES = ["Executive search", "HR consultancy", "Post roles in the portal"];
export const SENIORITY = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Head of" },
  { value: "executive", label: "Executive" },
] as const;
export type Seniority = (typeof SENIORITY)[number]["value"];

export type RoleFormValue = {
  title: string;
  location: string | null;
  sector: string | null;
  seniority: Seniority | null;
  min_years_experience: number | null;
  salary: string | null;
  description: string | null;
  must_have_skills: string[];
  nice_to_have_skills: string[];
};

export function RoleForm({
  initial,
  submitLabel,
  onSubmit,
  compact,
  secondary,
}: {
  initial?: Partial<RoleFormValue>;
  submitLabel: string;
  onSubmit: (v: RoleFormValue) => Promise<void>;
  compact?: boolean;
  secondary?: ReactNode;
}) {
  const [seniority, setSeniority] = useState<Seniority | null>(initial?.seniority ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = (k: string) => String(fd.get(k) ?? "").trim();
    const years = f("years");
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: f("title"),
        location: f("location") || null,
        sector: f("sector") || null,
        seniority,
        min_years_experience: years ? Number(years) : null,
        salary: f("salary") || null,
        description: f("description") || null,
        must_have_skills: splitSkills(f("must")),
        nice_to_have_skills: splitSkills(f("nice")),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <Field id="role-title" label="Job title" wide>
        <input id="role-title" name="title" required maxLength={200} defaultValue={initial?.title ?? ""} className={input} placeholder="e.g. Senior Financial Analyst" />
      </Field>
      <Field id="role-location" label="Location">
        <input id="role-location" name="location" maxLength={200} defaultValue={initial?.location ?? ""} className={input} placeholder="e.g. Dubai, hybrid" />
      </Field>
      <Field id="role-sector" label="Sector">
        <select id="role-sector" name="sector" defaultValue={initial?.sector ?? ""} className={input}>
          <option value="">Choose a sector</option>
          {SECTORS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <span className={labelCls}>Seniority</span>
        <Segment label="Seniority" options={[...SENIORITY]} value={seniority} onChange={setSeniority} />
      </div>
      <Field id="role-years" label="Minimum years of experience">
        <input id="role-years" name="years" type="number" min={0} max={50} step={1} defaultValue={initial?.min_years_experience ?? ""} className={input} />
      </Field>
      <Field id="role-salary" label="Salary or package" hint="Shown only to UKTL; we discuss it with candidates.">
        <input id="role-salary" name="salary" maxLength={100} defaultValue={initial?.salary ?? ""} className={input} placeholder="e.g. AED 30–35k a month" />
      </Field>
      <Field id="role-must" label="Must-have skills" hint="Separate with commas. A candidate is only marked qualified if they have all of these." wide>
        <input id="role-must" name="must" defaultValue={(initial?.must_have_skills ?? []).join(", ")} className={input} placeholder="e.g. IFRS, Financial modelling" />
      </Field>
      <Field id="role-nice" label="Nice-to-have skills" hint="Separate with commas." wide>
        <input id="role-nice" name="nice" defaultValue={(initial?.nice_to_have_skills ?? []).join(", ")} className={input} placeholder="e.g. Power BI, SAP" />
      </Field>
      {!compact && (
        <Field id="role-description" label="About the role" wide>
          <textarea id="role-description" name="description" rows={6} maxLength={8000} defaultValue={initial?.description ?? ""} className={input} placeholder="The team, what success looks like in the first year, and anything candidates should know." />
        </Field>
      )}
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        {error ? (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          {secondary}
          <button disabled={busy} className="min-h-11 rounded-full bg-ink text-paper px-6 text-[14px] disabled:opacity-60">
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

export type CompanyFormValue = {
  company_name: string;
  job_title: string | null;
  website: string | null;
  headquarters: string | null;
  company_size: "1-50" | "51-250" | "251-1000" | "1000+" | null;
  sectors: string[];
  services: string[];
  hiring_markets: string[];
  hiring_volume: "1-2" | "3-5" | "6-15" | "15+" | null;
};

const SIZES = [
  { value: "1-50", label: "1–50" },
  { value: "51-250", label: "51–250" },
  { value: "251-1000", label: "251–1,000" },
  { value: "1000+", label: "1,000+" },
] as const;
const VOLUMES = [
  { value: "1-2", label: "1–2" },
  { value: "3-5", label: "3–5" },
  { value: "6-15", label: "6–15" },
  { value: "15+", label: "15+" },
] as const;

/** Company details and hiring needs. `part` limits it to one half (used by onboarding steps). */
export function CompanyForm({
  initial,
  submitLabel,
  onSubmit,
  part = "all",
  secondary,
}: {
  initial?: Partial<CompanyFormValue> | null;
  submitLabel: string;
  onSubmit: (v: CompanyFormValue) => Promise<void>;
  part?: "all" | "company" | "needs";
  secondary?: ReactNode;
}) {
  const [size, setSize] = useState<CompanyFormValue["company_size"]>(initial?.company_size ?? null);
  const [volume, setVolume] = useState<CompanyFormValue["hiring_volume"]>(initial?.hiring_volume ?? null);
  const [sectors, setSectors] = useState<string[]>(initial?.sectors ?? []);
  const [services, setServices] = useState<string[]>(initial?.services ?? []);
  const [markets, setMarkets] = useState<string[]>(initial?.hiring_markets ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showCompany = part !== "needs";
  const showNeeds = part !== "company";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = (k: string) => (fd.has(k) ? String(fd.get(k) ?? "").trim() : null);
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        company_name: f("company") ?? initial?.company_name ?? "",
        job_title: (showCompany ? f("job_title") : initial?.job_title) || null,
        website: (showCompany ? f("website") : initial?.website) || null,
        headquarters: (showCompany ? f("hq") : initial?.headquarters) || null,
        company_size: size,
        sectors,
        services,
        hiring_markets: markets,
        hiring_volume: volume,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      {showCompany && (
        <>
          <Field id="co-name" label="Company name" wide>
            <input id="co-name" name="company" required maxLength={200} autoComplete="organization" defaultValue={initial?.company_name ?? ""} className={input} />
          </Field>
          <Field id="co-title" label="Your job title">
            <input id="co-title" name="job_title" maxLength={200} autoComplete="organization-title" defaultValue={initial?.job_title ?? ""} className={input} placeholder="e.g. Head of Talent" />
          </Field>
          <Field id="co-site" label="Website">
            <input id="co-site" name="website" type="url" maxLength={300} defaultValue={initial?.website ?? ""} className={input} placeholder="https://" />
          </Field>
          <Field id="co-hq" label="Headquarters">
            <input id="co-hq" name="hq" maxLength={100} defaultValue={initial?.headquarters ?? ""} className={input} placeholder="e.g. United Arab Emirates" />
          </Field>
          <div>
            <span className={labelCls}>Company size</span>
            <Segment label="Company size" options={[...SIZES]} value={size} onChange={setSize} />
          </div>
          <div className="sm:col-span-2">
            <span className={labelCls}>Sector</span>
            <Chips label="Sector" options={SECTORS} value={sectors} onChange={setSectors} />
          </div>
        </>
      )}
      {showNeeds && (
        <>
          {!showCompany && <input type="hidden" name="company" value={initial?.company_name ?? ""} />}
          <div className="sm:col-span-2">
            <span className={labelCls}>How can we help?</span>
            <Chips label="Services" options={SERVICES} value={services} onChange={setServices} />
          </div>
          <div className="sm:col-span-2">
            <span className={labelCls}>Where you're hiring</span>
            <Chips label="Hiring markets" options={MARKETS} value={markets} onChange={setMarkets} />
          </div>
          <div className="sm:col-span-2">
            <span className={labelCls}>Roles you expect to hire in the next 12 months</span>
            <Segment label="Hiring volume" options={[...VOLUMES]} value={volume} onChange={setVolume} />
          </div>
        </>
      )}
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        {error ? (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          {secondary}
          <button disabled={busy} className="min-h-11 rounded-full bg-ink text-paper px-6 text-[14px] disabled:opacity-60">
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

export const ROLE_STATUS: Record<string, { label: string; tone: string; help: string }> = {
  submitted: { label: "With UKTL for review", tone: "bg-warn-bg text-warn border-warn-bd", help: "A consultant is reviewing the brief. You can still edit it." },
  live: { label: "Live search", tone: "bg-accent-soft text-accent border-accent/25", help: "Your consultant is searching and will share candidates here." },
  closed: { label: "Closed", tone: "bg-paper-deep text-ink-mute border-rule", help: "This search is closed." },
  withdrawn: { label: "Withdrawn", tone: "bg-paper-deep text-ink-mute border-rule", help: "You withdrew this role before it went live." },
};

export function RoleStatusPill({ status }: { status: string }) {
  const s = ROLE_STATUS[status] ?? ROLE_STATUS.closed;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${s.tone}`}>{s.label}</span>;
}
