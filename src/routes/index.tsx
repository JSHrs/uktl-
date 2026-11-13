import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { AudienceSwitch, DemoFrame, DesignPage } from "@/components/site/ds";
import { EmployerEnquiry } from "@/components/site/EmployerEnquiry";
import heroMark from "@/assets/hero-mark.jpg";

/*
 * Landing page, rebuilt from the Claude Design handoff (design/claude-design-2026-11,
 * "UKTL Landing.html"). One page, two audiences: candidate and employer variants
 * are both rendered and <html data-for> shows one (see lib/preferences.ts).
 *
 * Product previews are illustrations and are labelled "Example". They contain no
 * real people or employers; figures in them are not claims about the firm.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UK Talent Link — Recruitment across the UK and the Gulf" },
      {
        name: "description",
        content:
          "UK Talent Link is a recruitment firm placing people across the UK and the Gulf. Candidates get a free CV score, specific tips and matches to the roles we're recruiting for. Employers get a ranked, reasoned shortlist.",
      },
      { property: "og:title", content: "UK Talent Link — Recruitment across the UK and the Gulf" },
      {
        property: "og:description",
        content: "Upload your CV free for a score, tips and matches, or tell us about a role you need to fill.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <DesignPage>
        <Hero />
        <div data-only="candidate">
          <Tour />
          <FreeBand />
          <SectorList />
          <Principles />
          <CandidateStart />
        </div>
        <div data-only="employer">
          <EmployerServices />
          <ShortlistExplainer />
          <SearchTimeline />
          <Commitments />
          <EmployerEnquiry />
        </div>
      </DesignPage>
    </SiteLayout>
  );
}

/* ─────────────────── Hero ─────────────────── */

function Hero() {
  return (
    <header className="hero">
      <div className="hero-mark" style={{ backgroundImage: `url(${heroMark})` }} />
      <div className="hero-mesh" />
      <div className="hero-fade" />
      <div className="wrap hero-in">
        <div className="hero-top">
          <AudienceSwitch />
          <span className="mono">London · Dubai</span>
        </div>

        <div className="hero-main">
          <div>
            <h1 className="disp hero-h1" data-only="candidate">
              <Line>Be seen for</Line>
              <Line>
                what you <em>can do,</em>
              </Line>
              <Line>not the keywords.</Line>
            </h1>
            <h1 className="disp hero-h1" data-only="employer">
              <Line>The right hire,</Line>
              <Line>
                ranked and <em>reasoned,</em>
              </Line>
              <Line>before you meet them.</Line>
            </h1>
          </div>

          <div data-only="candidate">
            <DemoFrame title="CV score" toast="Strong fit: a consultant will be in touch">
              <div className="d-file ap4">
                <span className="ext">PDF</span>
                <div>
                  <b style={{ fontWeight: 500 }}>your-cv.pdf</b>
                  <div className="d-track">
                    <i className="fl4" />
                  </div>
                </div>
                <span className="d-lbl">Uploaded</span>
              </div>
              <div className="d-score ap16">
                <div className="d-big">
                  <small>/100</small>
                </div>
                <div className="d-bars">
                  <Bar label="Contact" pct={96} cls="fl22" />
                  <Bar label="Experience" pct={64} cls="fl22" />
                  <Bar label="Skills" pct={81} cls="fl28" />
                  <Bar label="Education" pct={88} cls="fl28" />
                </div>
              </div>
              <span className="d-lbl ap36">Your matches</span>
              <MatchRow cls="ap44" initials="FA" title="Senior Financial Analyst" where="Finance · Dubai" score={94} />
              <MatchRow cls="ap52" initials="PM" title="Project Manager" where="Construction · London" score={89} />
              <MatchRow cls="ap60" initials="DE" title="Data Engineer" where="Technology · Remote, UK" score={86} />
            </DemoFrame>
          </div>

          <div data-only="employer">
            <DemoFrame title="Ranking" toast="A consultant reviews the shortlist before you see it">
              <div className="d-head ap4">
                <div>
                  <span className="d-lbl">Example mandate · Dubai</span>
                  <h4>Senior Financial Analyst</h4>
                </div>
                <div className="d-cnt">
                  <div className="d-big" />
                  <span className="d-lbl">CVs scored</span>
                </div>
              </div>
              <span className="d-lbl ap22">Ranked shortlist</span>
              <RankRow cls="ap28" rank={1} who="Candidate A" tags="IFRS · Power BI · UAE resident" score={94} qualified />
              <RankRow cls="ap36" rank={2} who="Candidate B" tags="Treasury · FP&A · Dubai" score={91} qualified />
              <RankRow cls="ap44" rank={3} who="Candidate C" tags="Group reporting · London" score={88} qualified />
              <RankRow cls="ap52" rank={4} who="Candidate D" tags="Corporate finance · Riyadh" score={57} />
            </DemoFrame>
          </div>
        </div>

        <div className="hero-foot">
          <p data-only="candidate">
            Upload your CV once. Get an honest score out of 100, the fixes that matter most, and a fit score for every role
            we're recruiting for across the UK and the Gulf. Free, private, and read by real consultants.
          </p>
          <p data-only="employer">
            Tell us the role. We search the UK and the Gulf, score every candidate against your must-haves, and a
            consultant puts forward a shortlist with the evidence and the gaps for each name.
          </p>
          <div className="scroll" aria-hidden="true">
            <i />
            <span className="mono">Scroll</span>
          </div>
          <div className="hero-cta" data-only="candidate">
            <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="btn btn-ink btn-lg">
              Score my CV, free
            </Link>
            <a href="#tour" className="btn btn-lg">
              How it works
            </a>
          </div>
          <div className="hero-cta" data-only="employer">
            <a href="#contact" className="btn btn-ink btn-lg">
              Book a consultation
            </a>
            <Link to="/onboarding" search={{ for: "employer", step: 1 }} className="btn btn-lg">
              Create employer account
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <span className="tl">
      <span>{children}</span>
    </span>
  );
}

function Bar({ label, pct, cls }: { label: string; pct: number; cls: string }) {
  return (
    <div>
      <span>{label}</span>
      <div className="d-track" style={{ margin: 0 }}>
        <i className={cls} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MatchRow(p: { cls: string; initials: string; title: string; where: string; score: number }) {
  return (
    <div className={`d-row ${p.cls}`}>
      <span className="co">{p.initials}</span>
      <div className="t">
        <b>{p.title}</b>
        <small>{p.where}</small>
      </div>
      <span className="m">{p.score}</span>
    </div>
  );
}

function RankRow(p: { cls: string; rank: number; who: string; tags: string; score: number; qualified?: boolean }) {
  return (
    <div className={`d-row ${p.cls} ${p.qualified ? "top" : ""}`}>
      <span className="rk">{p.rank}</span>
      <span className="av">{p.who.slice(-1)}</span>
      <div className="t">
        <b>
          {p.who} {p.qualified && <span className="d-pill ap60">Qualified</span>}
        </b>
        <small>{p.tags}</small>
      </div>
      <span className="m">{p.score}</span>
    </div>
  );
}

/* ─────────────────── Candidate: account tour ─────────────────── */

const TOUR = [
  {
    n: "01 · Know where you stand",
    title: "A CV score out of 100.",
    body: "Your CV is read the way a recruiter would, and scored section by section (contact details, experience, skills, education, clarity) so you know what's working.",
    link: { to: "/services", hash: "cv-score", label: "About the score" },
    frame: "CV score",
  },
  {
    n: "02 · Make it stronger",
    title: "Specific fixes, not generic advice.",
    body: "Each suggestion is written for your CV and tied to the section it improves. Make the changes, upload again and watch the score move.",
    link: { to: "/services", hash: "cv-tips", label: "About the tips" },
    frame: "Improve",
  },
  {
    n: "03 · Find where you fit",
    title: "Matched to real roles, with reasons.",
    body: "Every role we're recruiting for gets a fit score and the reasons behind it. Tell us which ones interest you with a single swipe.",
    link: { to: "/services", hash: "matching", label: "About matching" },
    frame: "Matches",
  },
  {
    n: "04 · Know your rights",
    title: "Workplace guidance, when you need it.",
    body: "Clear answers on contracts, pay, holiday and dismissal, grounded in ACAS guidance and UK employment law. Book time with a specialist if you need more.",
    link: { to: "/services", hash: "workplace-guidance", label: "About guidance" },
    frame: "HR guidance",
  },
  {
    n: "05 · Talk to a person",
    title: "A consultant when you're a strong fit.",
    body: "Software ranks the matches. People make the call, and get in touch to talk the role through with you.",
    link: { to: "/approach", hash: undefined, label: "How we work" },
    frame: "Messages",
  },
] as const;

function Tour() {
  const [step, setStep] = useState(0);
  const steps = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
        }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="sec" id="tour">
      <div className="wrap">
        <div className="sh rv">
          <div>
            <div className="eyebrow">Inside your account</div>
            <h2 className="disp">
              One upload. <em>Five things</em> working for you.
            </h2>
          </div>
          <p>
            Most applications disappear without a word. Your account tells you where you stand, what to fix and where you
            fit, and it all updates whenever you upload a new version.
          </p>
        </div>
        <div className="tour">
          <div className="tour-steps">
            {TOUR.map((t, i) => (
              <div
                key={t.n}
                data-step={i}
                ref={(el) => {
                  steps.current[i] = el;
                }}
                className={step === i ? "on" : ""}
              >
                <span className="n">{t.n.toUpperCase()}</span>
                <h3 className="disp">{t.title}</h3>
                <p>{t.body}</p>
                <Link to={t.link.to} hash={t.link.hash} className="lnk">
                  {t.link.label} →
                </Link>
              </div>
            ))}
          </div>
          <div className="tour-frame" aria-hidden="true">
            <div className="bar">
              <i />
              <i />
              <i />
              <span>Example · {TOUR[step].frame}</span>
            </div>
            <TourPanel on={step === 0} style={{}}>
              <span className="lbl">your-cv.pdf · scored just now</span>
              <div className="big">
                78<small> / 100</small>
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                <TBar label="Contact details" v={96} />
                <TBar label="Experience" v={64} warn />
                <TBar label="Skills" v={81} />
                <TBar label="Education" v={88} />
                <TBar label="Clarity" v={79} />
              </div>
              <p className="mute" style={{ marginTop: "auto" }}>
                Upload a new version any time and the score updates.
              </p>
            </TourPanel>
            <TourPanel on={step === 1}>
              <span className="lbl">Highest impact first</span>
              <Fix pill="Experience" warn title="Quantify your impact in your current role">
                For example, “Cut month-end close from nine days to six”.
              </Fix>
              <Fix pill="Profile" warn title="Open with a two-line profile">
                Your title, years of experience and the markets you work in.
              </Fix>
              <Fix pill="Skills" title="List your professional qualifications">
                Including part-qualified status and expected completion.
              </Fix>
            </TourPanel>
            <TourPanel on={step === 2}>
              <span className="lbl">Your matches</span>
              <TRow initials="FA" title="Senior Financial Analyst" where="Finance · Dubai" p={94} />
              <TRow initials="FP" title="FP&A Manager" where="Finance · London" p={89} />
              <TRow initials="BP" title="Finance Business Partner" where="Healthcare · Riyadh" p={86} />
              <div className="why" style={{ fontSize: 12, marginTop: 4 }}>
                <div>IFRS and Power BI listed as essential</div>
                <div className="no">Prefers a fully qualified accountant</div>
              </div>
            </TourPanel>
            <TourPanel on={step === 3}>
              <span className="lbl">Can my employer change my shifts?</span>
              <div className="tvid">
                <span>▶</span>
                <em>Your contract sets out the hours you agreed</em>
              </div>
              <span className="lbl" style={{ marginTop: 4 }}>
                Did this answer your question?
              </span>
              <div className="tchips">
                <span>Resolved</span>
                <span className="on">Partly</span>
                <span>Not resolved</span>
              </div>
              <p className="mute" style={{ fontSize: 12 }}>
                General information based on ACAS guidance. Not legal advice.
              </p>
            </TourPanel>
            <TourPanel on={step === 4} style={{ justifyContent: "flex-end" }}>
              <span className="lbl" style={{ alignSelf: "center" }}>
                Today
              </span>
              <div className="bub them">
                Hello, you're a strong fit for a Senior Financial Analyst role in Dubai. Could we talk it through on
                Thursday?<small>YOUR CONSULTANT</small>
              </div>
              <div className="bub me">
                That works. Anything I should prepare?<small>YOU</small>
              </div>
              <div className="bub them">
                I'll send a short brief on the team and the panel beforehand.<small>YOUR CONSULTANT</small>
              </div>
            </TourPanel>
          </div>
        </div>
      </div>
    </section>
  );
}

function TourPanel({ on, children, style }: { on: boolean; children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div className={`tp ${on ? "on" : ""}`} style={style}>
      {children}
    </div>
  );
}

function TBar({ label, v, warn }: { label: string; v: number; warn?: boolean }) {
  return (
    <div className="tbar">
      <span>{label}</span>
      <span className="t">
        <i className={warn ? "w" : ""} style={{ width: `${v}%` }} />
      </span>
      <b>{v}</b>
    </div>
  );
}

function Fix({ pill, warn, title, children }: { pill: string; warn?: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className="tfix">
      <span className={`pill ${warn ? "warn" : "good"}`}>{pill}</span>
      <div>
        <b>{title}</b>
        <p>{children}</p>
      </div>
    </div>
  );
}

function TRow({ initials, title, where, p }: { initials: string; title: string; where: string; p: number }) {
  return (
    <div className="trow">
      <span className="co">{initials}</span>
      <span className="tx">
        <b>{title}</b>
        <small>{where}</small>
      </span>
      <span className="cring" style={{ "--p": p } as CSSProperties}>
        <span>{p}</span>
      </span>
    </div>
  );
}

/* ─────────────────── Candidate: free band ─────────────────── */

function FreeBand() {
  return (
    <section className="band sec">
      <div className="grid-bg" />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="sh rv" style={{ marginBottom: 40 }}>
          <div>
            <div className="eyebrow">Free, for good</div>
            <h2 className="disp">
              You never pay to <em>find work</em> through us.
            </h2>
          </div>
          <p>
            Employers pay for recruitment, so everything for candidates is free. There's no premium tier and nothing to
            unlock. UK rules stop agencies charging you for finding work anyway.
          </p>
        </div>
        <div className="facts rv">
          <div>
            <b>£0</b>
            <p>Account, CV score, tips, matches and guidance</p>
          </div>
          <div>
            <b>0–100</b>
            <p>Your CV score, broken down section by section</p>
          </div>
          <div>
            <b>2</b>
            <p>Markets, the UK and the Gulf, from one account</p>
          </div>
          <div>
            <b>10 MB</b>
            <p>PDF, Word or plain text. Stored privately, never public</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Candidate: sectors ─────────────────── */

const SECTORS = [
  { name: "Construction & engineering", roles: "Quantity Surveyor · Site Manager · Project Manager" },
  { name: "Technology & digital", roles: "Software Engineer · Data Engineer · Head of Product" },
  { name: "Energy & infrastructure", roles: "Project Director · HSE Lead · Commercial Manager" },
  { name: "Financial services", roles: "Finance Director · Compliance · Risk" },
  { name: "Legal & professional services", roles: "General Counsel · Head of Legal · COO" },
  { name: "Healthcare & life sciences", roles: "Clinical Operations · Regulatory Affairs · CFO" },
];

function SectorList() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="sh rv">
          <div>
            <div className="eyebrow">Roles we recruit for</div>
            <h2 className="disp">
              Where you'll <em>find us</em> hiring.
            </h2>
          </div>
          <p>Upload once and you're matched against every role we're recruiting for, across all of these sectors.</p>
        </div>
        <div className="slist rv">
          {SECTORS.map((s) => (
            <Link key={s.name} to="/sectors" hash={s.name.split(" ")[0].toLowerCase()}>
              <h3 className="disp">{s.name}</h3>
              <span className="mono" style={{ textAlign: "right" }}>
                {s.roles}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Candidate: principles ─────────────────── */

function Principles() {
  return (
    <section className="sec bt">
      <div className="wrap">
        <div className="sh rv">
          <div>
            <div className="eyebrow">Why UK Talent Link</div>
            <h2 className="disp">
              Recruitment that <em>works for you.</em>
            </h2>
          </div>
          <p>
            We're a recruitment firm, so our job is to put good people in good roles. That starts with telling you
            honestly where you stand.
          </p>
        </div>
        <div className="cmt rv">
          <div>
            <span className="gl">FREE</span>
            <h4>You never pay us a penny.</h4>
            <p>Employers pay for recruitment. Your account, score, matches and workplace guidance cost you nothing.</p>
          </div>
          <div>
            <span className="gl">HONEST</span>
            <h4>Straight feedback, not silence.</h4>
            <p>Your score and tips show how your CV reads to a recruiter, so you're not left guessing why applications go quiet.</p>
          </div>
          <div>
            <span className="gl">PRIVATE</span>
            <h4>Your CV stays yours.</h4>
            <p>Stored privately and seen only through your account or by authorised UK Talent Link staff. Never published or sold on.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Candidate: start ─────────────────── */

function CandidateStart() {
  return (
    <section className="band sec" id="start">
      <div className="grid-bg" />
      <div className="wrap cta" style={{ position: "relative" }}>
        <div className="cta-l rv">
          <div className="eyebrow">Start free</div>
          <h2 className="disp" style={{ marginTop: 20 }}>
            Your next move starts <em>with one upload.</em>
          </h2>
          <p>
            Create a free account, upload your CV and see what's working, what's holding you back and which roles you fit,
            in one place.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
            <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="btn btn-light btn-lg">
              Create free account
            </Link>
            <Link to="/auth/login" className="btn btn-lg">
              Sign in
            </Link>
          </div>
        </div>
        <div className="score-card rv" aria-label="Example score">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="eyebrow">Example score</span>
            <span className="mono">Illustration</span>
          </div>
          <div className="disp" style={{ fontSize: 72, lineHeight: 1 }}>
            78<small style={{ fontSize: 20, color: "var(--b-soft)" }}> / 100</small>
          </div>
          <TBar label="Contact details" v={96} />
          <TBar label="Experience" v={64} />
          <TBar label="Skills" v={81} />
          <TBar label="Education" v={88} />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Employer: services ─────────────────── */

function EmployerServices() {
  return (
    <section className="sec" id="services">
      <div className="wrap">
        <div className="sh rv">
          <div>
            <div className="eyebrow">For employers</div>
            <h2 className="disp">
              Two services. <em>One standard.</em>
            </h2>
          </div>
          <p>
            Executive search for the hires that shape your organisation, and practical HR consultancy for the people side
            that follows, across the UK and the Gulf.
          </p>
        </div>
        <div className="svc rv">
          <div id="search">
            <span className="n">01 · EXECUTIVE SEARCH</span>
            <h3 className="disp">Senior and specialist hires.</h3>
            <p>We map the market, approach people quietly and present a ranked shortlist with the evidence for every name.</p>
            <ul className="ticks one">
              <li>Market mapping across the UK and the Gulf</li>
              <li>Confidential approach and assessment</li>
              <li>Ranked shortlist with reasoning</li>
              <li>Offer, relocation and onboarding support</li>
            </ul>
            <a href="#contact" className="lnk" style={{ color: "var(--ink)", marginTop: "auto" }}>
              Discuss a search →
            </a>
          </div>
          <div id="hr">
            <span className="n">02 · HR CONSULTANCY</span>
            <h3 className="disp">The people side, done properly.</h3>
            <p>Hands-on HR support: structure, policy, reward and the hard conversations.</p>
            <ul className="ticks one">
              <li>Organisation design and workforce planning</li>
              <li>Policies, handbooks and contracts</li>
              <li>Reward and benchmarking</li>
              <li>Employee relations casework</li>
            </ul>
            <a href="#contact" className="lnk" style={{ color: "var(--ink)", marginTop: "auto" }}>
              Discuss HR support →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Employer: shortlist explainer ─────────────────── */

const SHORTLIST = [
  {
    who: "Candidate A",
    meta: "Manchester · 6 yrs · UAE resident",
    score: 94,
    bars: [["Skills", 96], ["Seniority", 92], ["Quals", 70]] as const,
    why: ["Rebuilt a group budgeting model in Power BI", "Already resident in the UAE"],
    gap: "Part-qualified; the brief prefers fully qualified",
  },
  { who: "Candidate B", meta: "Dubai · 8 yrs · Treasury", score: 91, why: ["Eight years in Gulf treasury and FP&A", "Fully qualified"], gap: "Three-month notice period" },
  { who: "Candidate C", meta: "London · 7 yrs · Group reporting", score: 88, why: ["Led an IFRS 17 implementation"], gap: "Would need visa sponsorship" },
  { who: "Candidate D", meta: "Riyadh · 5 yrs · Corporate finance", score: 57, why: ["Strong M&A modelling"], gap: "Misses a must-have: FP&A experience" },
];

function ShortlistExplainer() {
  const [open, setOpen] = useState(0);
  return (
    <section className="sec deep bt">
      <div className="wrap expl">
        <div className="rv">
          <div className="eyebrow">The shortlist, explained</div>
          <h2 className="disp" style={{ fontSize: "clamp(34px,4.4cqi,60px)", marginTop: 16 }}>
            A few names, <em className="ac">not forty.</em>
          </h2>
          <p className="soft" style={{ marginTop: 20, maxWidth: "46ch" }}>
            Talent Compass scores every CV we hold against your brief. A consultant reviews the top of the list, and you
            get the reasons as well as the names.
          </p>
          <ol>
            <li>
              <div>
                <b>Must-haves stay must-haves</b>
                <span>A candidate is only marked qualified with a score of 60 or more and every must-have met.</span>
              </div>
            </li>
            <li>
              <div>
                <b>Every score shows its working</b>
                <span>Strengths and gaps taken from the CV, not a black-box number.</span>
              </div>
            </li>
            <li>
              <div>
                <b>The decision stays yours</b>
                <span>A consultant talks you through the shortlist; you choose who to meet.</span>
              </div>
            </li>
          </ol>
        </div>
        <div className="sl rv">
          <div className="sl-h">
            <div>
              <span className="mono">Example mandate · Dubai</span>
              <br />
              <b>Senior Financial Analyst</b>
            </div>
            <span className="pill good">Example</span>
          </div>
          {SHORTLIST.map((c, i) => (
            <div key={c.who} style={{ display: "contents" }}>
              <button
                type="button"
                className={`sl-r ${c.score >= 60 ? "top" : ""} ${open === i ? "open" : ""}`}
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{ width: "100%", textAlign: "left" }}
              >
                <span className="rk">{i + 1}</span>
                <span className="av">{c.who.slice(-1)}</span>
                <div>
                  <b>{c.who}</b>
                  <small>{c.meta}</small>
                </div>
                <span className="sc">{c.score}</span>
              </button>
              <div className="sl-x">
                {"bars" in c &&
                  c.bars?.map(([l, v]) => <TBar key={l} label={l} v={v} warn={v < 75} />)}
                <div className="why">
                  {c.why.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                  <div className="no">{c.gap}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Employer: how a search runs ─────────────────── */

const STAGES = [
  ["Brief", "A working session on the role, the team and what success looks like in the first year."],
  ["Map", "We chart the market across the UK and the Gulf and agree the target list with you."],
  ["Approach", "Confidential conversations with people who fit, assessed against your requirements."],
  ["Shortlist", "A ranked shortlist with the evidence for every name, reviewed by your consultant."],
  ["Hire", "Offer, notice, relocation and check-ins through the first months."],
] as const;

function SearchTimeline() {
  return (
    <section className="band sec">
      <div className="grid-bg" />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="sh rv">
          <div>
            <div className="eyebrow">How a search runs</div>
            <h2 className="disp">
              From brief to <em>start date.</em>
            </h2>
          </div>
          <p>One consultant runs your search end to end. You see the reasoning at every stage.</p>
        </div>
        <div className="tl rv">
          {STAGES.map(([h, p], i) => (
            <div key={h}>
              <div className="wk">Stage {i + 1}</div>
              <h4>{h}</h4>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Employer: commitments ─────────────────── */

function Commitments() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="sh rv">
          <div>
            <div className="eyebrow">What we commit to</div>
            <h2 className="disp">
              Our side of <em>the bargain.</em>
            </h2>
          </div>
          <p>How every search is run, whatever the role.</p>
        </div>
        <div className="cmt rv">
          <div>
            <span className="gl">I.</span>
            <h4>Reasons, not just names</h4>
            <p>Every shortlisted candidate comes with the evidence and the gaps, so you can defend the decision.</p>
          </div>
          <div>
            <span className="gl">II.</span>
            <h4>A person reviews every list</h4>
            <p>Software ranks candidates. A consultant checks the ranking before anyone reaches you.</p>
          </div>
          <div>
            <span className="gl">III.</span>
            <h4>Candidates never pay</h4>
            <p>Candidates use UK Talent Link free, so the people you meet came to us for the right reasons.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
