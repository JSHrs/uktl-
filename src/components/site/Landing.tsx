import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { setAudience, useAudience, type Audience } from "@/lib/preferences";

/*
 * Landing page building blocks (November 2026 redesign, styles in styles/landing.css).
 * Everything interactive here is an illustration and is labelled "Example"; the
 * only live data are the two clocks and figures computed from real coordinates.
 */

/* ───────────── Geography (computed, not typed in) ───────────── */

const LONDON = { lat: 51.5074, lon: -0.1278 };
const DUBAI = { lat: 25.2048, lon: 55.2708 };
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance (km) and initial bearing (degrees) from a to b. */
export function greatCircle(a: typeof LONDON, b: typeof LONDON) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  const km = 2 * 6371.0088 * Math.asin(Math.sqrt(h));
  const y = Math.sin(dLon) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLon);
  return { km: Math.round(km), bearing: Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360) };
}
const ROUTE = greatCircle(LONDON, DUBAI);

/* ───────────── Reveal on scroll (never hides what is already on screen) ───────────── */

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("wait");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    root.querySelectorAll<HTMLElement>(".lp-rv").forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add("wait");
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Head({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="lp-head lp-rv">
      <div>
        <div className="lp-mono">{label}</div>
        <h2 className="lp-disp">{title}</h2>
      </div>
      {children && <p>{children}</p>}
    </div>
  );
}

/* ───────────── Hero ───────────── */

function useClock(timeZone: string) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [timeZone]);
  return now;
}

export function Hero() {
  const audience = useAudience();
  const london = useClock("Europe/London");
  const dubai = useClock("Asia/Dubai");
  const doors = useRef<HTMLDivElement | null>(null);
  // The needle rests on the real London → Dubai bearing and leans towards the pointer.
  const [lean, setLean] = useState(0);

  useEffect(() => {
    const el = doors.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      setLean(((e.clientX - r.left) / r.width - 0.5) * 2);
    };
    const leave = () => setLean(0);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const choose = (a: Audience, scroll: boolean) => {
    setAudience(a);
    if (scroll) document.getElementById("lp-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const needle = ROUTE.bearing + lean * 70;

  return (
    <header className="lp-hero">
      <div className="lp-strip">
        <h1 className="lp-h1">UK Talent Link · Recruitment between the UK and the Gulf</h1>
        <div className="lp-live" aria-label="Local time in our two offices">
          <span>
            <i aria-hidden="true" />
            London <b suppressHydrationWarning>{london ?? "--:--"}</b>
          </span>
          <span>
            Dubai <b suppressHydrationWarning>{dubai ?? "--:--"}</b>
          </span>
          <span>
            {ROUTE.km.toLocaleString("en-GB")} km apart
          </span>
        </div>
      </div>

      <div className="lp-doors" ref={doors}>
        <section className="lp-door" data-door="candidate" aria-labelledby="door-candidate" onClick={() => audience !== "candidate" && choose("candidate", false)}>
          <div className="lp-door-top">
            <span className="lp-mono">For candidates</span>
            <button
              type="button"
              className="lp-pick"
              data-set="candidate"
              aria-pressed={audience === "candidate"}
              onClick={(e) => {
                e.stopPropagation();
                choose("candidate", true);
              }}
            >
              <span>I'm looking for work</span>
            </button>
          </div>
          <h2 id="door-candidate" className="lp-disp">
            Be seen for what you <em>can do.</em>
          </h2>
          <div className="lp-door-foot">
            <p>
              Upload your CV once. Get an honest score out of 100, the fixes that matter most, and a fit score for every
              role we're recruiting for. Free, private, and read by real consultants.
            </p>
            <div className="lp-door-acts">
              <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="lp-btn lp-btn-solid" onClick={(e) => e.stopPropagation()}>
                Score my CV, free
              </Link>
            </div>
          </div>
          <div className="lp-compass" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              {Array.from({ length: 24 }, (_, i) => (
                <line key={i} className={`tick ${i % 6 === 0 ? "major" : ""}`} x1="50" y1="4" x2="50" y2={i % 6 === 0 ? 12 : 8} transform={`rotate(${i * 15} 50 50)`} />
              ))}
              <text x="50" y="22" textAnchor="middle">N</text>
              <text x="81" y="52.5" textAnchor="middle">E</text>
              <text x="50" y="84" textAnchor="middle">S</text>
              <text x="19" y="52.5" textAnchor="middle">W</text>
              <g className="lp-needle" style={{ transform: `rotate(${needle}deg)` }}>
                <polygon className="n" points="50,16 54,50 46,50" />
                <polygon className="s" points="50,84 54,50 46,50" />
                <circle cx="50" cy="50" r="2.4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
              </g>
            </svg>
          </div>
        </section>

        <section className="lp-door" data-door="employer" aria-labelledby="door-employer" onClick={() => audience !== "employer" && choose("employer", false)}>
          <div className="lp-door-top">
            <span className="lp-mono">For employers</span>
            <button
              type="button"
              className="lp-pick"
              data-set="employer"
              aria-pressed={audience === "employer"}
              onClick={(e) => {
                e.stopPropagation();
                choose("employer", true);
              }}
            >
              <span>I'm hiring</span>
            </button>
          </div>
          <h2 id="door-employer" className="lp-disp">
            The right hire, ranked and <em>reasoned.</em>
          </h2>
          <div className="lp-door-foot">
            <p>
              Tell us the role. We search the UK and the Gulf, score every candidate against your must-haves, and a
              consultant puts forward a shortlist with the evidence and the gaps for each name.
            </p>
            <div className="lp-door-acts">
              <Link to="/onboarding" search={{ for: "employer", step: 1 }} className="lp-btn lp-btn-solid" onClick={(e) => e.stopPropagation()}>
                Start hiring
              </Link>
              <Link to="/employers" className="lp-btn lp-btn-line" onClick={(e) => e.stopPropagation()}>
                Our services
              </Link>
            </div>
          </div>
        </section>
      </div>
    </header>
  );
}

/* ───────────── Candidate: how a CV is read ───────────── */

const DIMENSIONS = [
  { id: "contact", name: "Contact details", score: 96, look: "Can a recruiter reach you? Name, email, phone and location, easy to find.", note: "Complete and at the top. Nothing to change." },
  { id: "experience", name: "Experience", score: 64, look: "What you did and what changed because of it: scope, results, dates without gaps.", note: "Two roles list duties, not results. Add one measured outcome to each." },
  { id: "skills", name: "Skills", score: 81, look: "The skills the roles ask for, named the way employers name them.", note: "Strong core skills. One qualification is mentioned in passing; list it clearly." },
  { id: "education", name: "Education", score: 88, look: "Degrees, professional qualifications and their status.", note: "Clear. Add the expected completion date for the qualification in progress." },
  { id: "clarity", name: "Clarity and structure", score: 79, look: "Whether the whole document reads cleanly: order, length and consistency.", note: "Two pages and well ordered. Open with a two-line profile." },
] as const;
type DimId = (typeof DIMENSIONS)[number]["id"];

export function AnnotatedCv() {
  const [active, setActive] = useState<DimId>("experience");
  const [touched, setTouched] = useState(false);
  // Until the visitor picks one, step through the dimensions so the page shows what it does.
  useEffect(() => {
    if (touched || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => DIMENSIONS[(DIMENSIONS.findIndex((d) => d.id === a) + 1) % DIMENSIONS.length].id), 3600);
    return () => clearInterval(id);
  }, [touched]);
  const current = DIMENSIONS.find((d) => d.id === active)!;
  const zone = (id: DimId) => `lp-zone ${active === id ? "on" : ""}`;

  return (
    <div className="lp-read">
      <div className="lp-rv">
        <div className="lp-dims" role="group" aria-label="What the CV score looks at">
          {DIMENSIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              className="lp-dim"
              aria-pressed={active === d.id}
              onClick={() => {
                setTouched(true);
                setActive(d.id);
              }}
              onMouseEnter={() => {
                setTouched(true);
                setActive(d.id);
              }}
            >
              <b>{d.name}</b>
              <span className="sc" aria-label={`Example score ${d.score} out of 100`}>
                {d.score}
              </span>
              <span className="det">{d.look}</span>
            </button>
          ))}
        </div>
        <p className="lp-fine">Scores here are from an example CV. Yours are worked out from your own document.</p>
      </div>

      <div className="lp-sheet-wrap lp-rv">
        <div className="lp-sheet" data-active={active} aria-hidden="true">
          <span className="lp-mono lp-sheet-tag">Example CV</span>
          <div className={zone("contact")}>
            <div className="nm">Your name</div>
            <div className="sub">Senior Financial Analyst · London · name@email.com · 07000 000000</div>
          </div>
          <div className={zone("experience")}>
            <h4>Experience</h4>
            <ul>
              <li>Rebuilt the group budgeting model; month-end close cut from nine days to six.</li>
              <li>Responsible for monthly management accounts.</li>
              <li>Prepared variance analysis for the finance director.</li>
            </ul>
          </div>
          <div className={zone("skills")}>
            <h4>Skills</h4>
            <div className="lp-chips">
              {["IFRS", "Financial modelling", "Power BI", "Forecasting", "SAP"].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
          <div className={zone("education")}>
            <h4>Education</h4>
            <ul>
              <li>BSc Accounting and Finance</li>
              <li>Professional qualification, part-qualified</li>
            </ul>
          </div>
        </div>
        <div className="lp-note" role="status">
          <span className="lp-mono">Example feedback · {current.name}</span>
          <br />
          <b>{current.score} / 100.</b> {current.note}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Route: steps that fill in as you scroll ───────────── */

export function RouteSteps({ steps, label }: { steps: readonly (readonly [string, string])[]; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [p, setP] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // 0 when the track enters the lower part of the screen, 1 when it reaches the upper third.
      const start = innerHeight * 0.88;
      const end = innerHeight * 0.38;
      setP(Math.max(0, Math.min(1, (start - r.top) / Math.max(1, start - end + r.height * 0.5))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="lp-route" ref={ref} style={{ "--p": p } as CSSProperties}>
      <span className="lp-route-fill" aria-hidden="true" />
      {steps.map(([title, body], i) => (
        <div key={title} className={`lp-stop ${p >= (i + 0.35) / steps.length ? "on" : ""}`}>
          <div className="lp-mono">
            {label} {i + 1}
          </div>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Sector index ───────────── */

export const SECTORS = [
  { name: "Construction & engineering", focus: true, line: "Where many of our live roles sit, across UK projects and Gulf infrastructure programmes.", roles: ["Quantity Surveyor", "Site Manager", "Project Manager", "Civil / Structural Engineer", "Contracts Director"] },
  { name: "Technology & digital", focus: true, line: "Engineers, data specialists, product people and technology leaders.", roles: ["Software Engineer", "Data Engineer", "DevOps / Platform Engineer", "Product Manager", "CTO / VP Engineering"] },
  { name: "Energy & infrastructure", line: "Senior technical and commercial roles on large-scale projects, particularly across the Gulf.", roles: ["Project Director", "HSE Lead", "Commercial Manager", "Country Director"] },
  { name: "Financial services", line: "Finance, compliance and operations roles in regulated businesses.", roles: ["Finance Director", "Head of Compliance", "Chief Risk Officer", "Investment Manager"] },
  { name: "Legal & professional services", line: "Business-services and leadership roles in law firms and advisory practices.", roles: ["General Counsel", "Head of Legal", "Chief Operating Officer", "Business Development Director"] },
  { name: "Healthcare & life sciences", line: "Non-clinical leadership roles in the UK and the Gulf.", roles: ["Chief Operating Officer", "Head of Clinical Operations", "Head of Regulatory Affairs", "Chief Financial Officer"] },
];

export function SectorIndex({ audience }: { audience: Audience }) {
  const [i, setI] = useState(0);
  const s = SECTORS[i];
  return (
    <div className="lp-index">
      <div className="lp-index-list lp-rv" role="group" aria-label="Sectors">
        {SECTORS.map((x, n) => (
          <button key={x.name} type="button" className="lp-index-row" aria-pressed={i === n} onClick={() => setI(n)} onMouseEnter={() => setI(n)}>
            <b>{x.name}</b>
            {x.focus && <span className="lp-mono">Most live roles</span>}
          </button>
        ))}
      </div>
      <div className="lp-index-pane lp-rv" aria-live="polite">
        <div key={s.name} className="lp-swap">
          <span className="lp-mono">Typical roles</span>
          <h3>{s.name}</h3>
          <p>{s.line}</p>
          <ul>
            {s.roles.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {audience === "employer" ? (
            <Link to="/employers" hash="contact" className="lp-btn lp-btn-line">
              Brief us on a role
            </Link>
          ) : (
            <Link to="/sectors" hash={s.name.split(" ")[0].toLowerCase()} className="lp-btn lp-btn-line">
              About this sector
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Employer: change the brief, watch the shortlist move ───────────── */

const SKILLS = ["IFRS", "Financial modelling", "Power BI", "SAP"] as const;
const POOL = [
  { id: "A", meta: "Manchester · UAE resident", years: 6, skills: ["IFRS", "Financial modelling", "Power BI"] },
  { id: "B", meta: "Dubai · Treasury and FP&A", years: 8, skills: ["IFRS", "Financial modelling"] },
  { id: "C", meta: "London · Group reporting", years: 7, skills: ["IFRS", "SAP"] },
  { id: "D", meta: "Riyadh · Corporate finance", years: 5, skills: ["Financial modelling"] },
  { id: "E", meta: "Birmingham · Reporting analyst", years: 4, skills: ["Power BI", "SAP"] },
];
/** The platform's real threshold: qualified needs this score and every must-have. */
const QUALIFIED_SCORE = 60;

export function RankDemo() {
  const [must, setMust] = useState<string[]>(["IFRS", "Financial modelling"]);
  const [years, setYears] = useState(5);

  const ranked = useMemo(() => {
    const rows = POOL.map((c) => {
      const missing = must.filter((m) => !c.skills.includes(m));
      const skillFit = must.length ? (must.length - missing.length) / must.length : 1;
      // Experience counts in full once a candidate is two years past the minimum.
      const score = Math.round(100 * (0.7 * skillFit + 0.3 * Math.min(1, c.years / (years + 2))));
      return { ...c, missing, score, qualified: score >= QUALIFIED_SCORE && missing.length === 0 };
    });
    const order = [...rows].sort((a, b) => Number(b.qualified) - Number(a.qualified) || b.score - a.score || a.id.localeCompare(b.id));
    return rows.map((r) => ({ ...r, rank: order.findIndex((o) => o.id === r.id) }));
  }, [must, years]);
  const qualified = ranked.filter((r) => r.qualified).length;

  return (
    <div className="lp-rank">
      <div className="lp-brief lp-rv">
        <div>
          <span className="lp-mono">Example brief</span>
          <h3>Senior Financial Analyst, Dubai</h3>
        </div>
        <div>
          <span className="lp-mono">Must-have skills</span>
          <div className="lp-toggles" role="group" aria-label="Must-have skills">
            {SKILLS.map((s) => (
              <button key={s} type="button" className="lp-toggle" aria-pressed={must.includes(s)} onClick={() => setMust((m) => (m.includes(s) ? m.filter((x) => x !== s) : [...m, s]))}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="lp-years" className="lp-mono">
            Minimum years of experience
          </label>
          <div className="lp-years">
            <input id="lp-years" type="range" min={3} max={8} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} />
            <output htmlFor="lp-years">{years}+</output>
          </div>
        </div>
        <p className="lp-fine" style={{ marginTop: 0 }}>
          Try it: switch a must-have on or off, or raise the years. A candidate is only marked qualified with a score of{" "}
          {QUALIFIED_SCORE} or more and every must-have met.
        </p>
      </div>

      <div className="lp-rv">
        <div className="lp-board">
          <div className="lp-board-h">
            <span className="lp-mono">Example shortlist</span>
            <span className="lp-mono" role="status">
              {qualified} of {POOL.length} qualified
            </span>
          </div>
          <div className="lp-board-b" style={{ height: POOL.length * 74 }}>
            {ranked.map((c) => (
              <div key={c.id} className={`lp-cand ${c.qualified ? "q" : ""}`} style={{ transform: `translateY(${c.rank * 74}px)` }}>
                <span className="rk">{c.rank + 1}</span>
                <span className="av">{c.id}</span>
                <div className="tx">
                  <b>
                    Candidate {c.id}
                    {c.qualified ? <span className="lp-tag">Qualified</span> : c.missing.length ? <span className="lp-tag miss">Missing {c.missing[0]}{c.missing.length > 1 ? ` +${c.missing.length - 1}` : ""}</span> : <span className="lp-tag miss">Below {QUALIFIED_SCORE}</span>}
                  </b>
                  <small>
                    {c.meta} · {c.years} yrs · {c.skills.join(", ")}
                  </small>
                </div>
                <span className="scr">{c.score}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="lp-fine">
          A simplified illustration with invented candidates. The real ranking also weighs seniority, location and
          nice-to-haves, and a consultant reviews it before anyone is put forward.
        </p>
      </div>
    </div>
  );
}
