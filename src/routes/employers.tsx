import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { Article, AudienceBanner, DesignPage, PageHero, SectionHead, Ticks } from "@/components/site/ds";
import { EmployerEnquiry } from "@/components/site/EmployerEnquiry";

/*
 * Public page for employers (the signed-in employer account lives at /employer).
 * From the Claude Design handoff "Employers.html". Fees, guarantees, timescales and
 * the client portal in the mock-up are not confirmed or not built, so they are omitted.
 */
export const Route = createFileRoute("/employers")({
  head: () => ({
    meta: [
      { title: "For employers — UK Talent Link" },
      {
        name: "description",
        content:
          "Executive search and HR consultancy for organisations hiring across the UK and the Gulf. A ranked shortlist, reviewed by a consultant, with the reasons behind every name.",
      },
      { property: "og:title", content: "For employers — UK Talent Link" },
    ],
  }),
  component: Employers,
});

const FAQ = [
  {
    q: "How is Talent Compass different from an ATS filter?",
    a: "An ATS filters people out. Talent Compass scores every CV we hold against your requirements and shows the reasons for each score: the skills that match, the gaps, and whether every must-have is met. A consultant reviews the top of the list before anything reaches you.",
  },
  {
    q: "Do you only recruit for Gulf roles?",
    a: "No. We recruit in the UK and across the Gulf, and many searches cover both, for example UK-trained professionals moving to Dubai or Riyadh, or people returning to the UK.",
  },
  {
    q: "Do candidates pay anything?",
    a: "No. Candidates use UK Talent Link free. Employers pay for recruitment.",
  },
  {
    q: "What happens after I send a request?",
    a: "A consultant reads it and replies personally, usually within one working day, to arrange a call about the role.",
  },
];

function Employers() {
  return (
    <SiteLayout>
      <DesignPage>
        <PageHero
          eyebrow="For employers"
          title={
            <>
              Hire with <em>certainty.</em>
            </>
          }
          lede="Executive search and hands-on HR consultancy for organisations hiring across the UK and the Gulf. A consultant runs your search, and you get a ranked shortlist with the reasons behind every name."
          actions={
            <>
              <a href="#contact" className="btn btn-ink btn-lg">
                Start hiring →
              </a>
              <Link to="/onboarding" search={{ for: "employer", step: 1 }} className="btn btn-lg">
                Create employer account
              </Link>
            </>
          }
          meta={[
            { label: "Markets", value: "UK · Gulf" },
            { label: "Offices", value: "London · Dubai" },
            { label: "Shortlists", value: "Ranked, with reasons" },
          ]}
          note={
            <AudienceBanner
              show="candidate"
              action={
                <Link to="/services" className="lnk" style={{ color: "var(--ink)" }}>
                  See what candidates get →
                </Link>
              }
            >
              You're viewing as a candidate. This page is for employers.
            </AudienceBanner>
          }
        />

        <section className="sec" style={{ paddingTop: 40 }}>
          <div className="wrap">
            <Article
              id="search"
              tag="/ 01 · Executive search"
              title="Senior and specialist hires."
              aside={
                <a href="#contact" className="btn" style={{ marginTop: 28 }}>
                  Discuss a search
                </a>
              }
            >
              <p className="body">
                For roles that shape your organisation. We map the market across the UK and the Gulf, approach people
                confidentially and assess them against your requirements. You receive a ranked shortlist with the evidence
                and the gaps for every name.
              </p>
              <Ticks
                label="What's included"
                items={[
                  "Market map and target list, agreed with you",
                  "Confidential approach and structured assessment",
                  "Ranked shortlist with reasoning",
                  "Referencing, offer and notice support",
                  "Relocation support for UK ↔ Gulf moves",
                  "Check-ins after the start date",
                ]}
              />
              <div className="mini" aria-label="Example shortlist">
                <span className="lbl">Example shortlist · Senior Financial Analyst</span>
                <Rank n={1} who="Candidate A" tags="IFRS · Power BI · UAE resident" p={94} />
                <Rank n={2} who="Candidate B" tags="Treasury · FP&A · Dubai" p={91} />
              </div>
            </Article>

            <Article
              id="hr"
              tag="/ 02 · HR consultancy"
              title="The people side, done properly."
              aside={
                <a href="#contact" className="btn" style={{ marginTop: 28 }}>
                  Talk to a consultant
                </a>
              }
            >
              <p className="body">
                Practical HR support for organisations in the UK and across the Gulf, as a defined project or ongoing
                support.
              </p>
              <Ticks
                label="Service lines"
                items={[
                  "Organisation design and workforce planning",
                  "Policies, handbooks and employment contracts",
                  "Reward, grading and salary benchmarking",
                  "Employee relations casework",
                ]}
              />
            </Article>

            <Article id="ranking" tag="/ 03 · How candidates are ranked" title="Every score shows its working.">
              <p className="body">
                Talent Compass compares each CV with the role's requirements and gives a score out of 100 with the reasons
                behind it. A candidate is marked qualified only with a score of 60 or more and every must-have met.
                Consultants review the ranking before anyone is put forward.
              </p>
              <Ticks
                label="What you see"
                items={[
                  "A ranked list against your requirements",
                  "Matched skills and gaps for each candidate",
                  "Must-haves treated as must-haves",
                  "A consultant's review before introduction",
                ]}
              />
            </Article>
          </div>
        </section>

        <section className="sec deep bt">
          <div className="wrap">
            <SectionHead
              eyebrow="Questions clients ask"
              title={
                <>
                  Before you <em>brief us.</em>
                </>
              }
            />
            <div className="faq rv">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <EmployerEnquiry />
      </DesignPage>
    </SiteLayout>
  );
}

function Rank({ n, who, tags, p }: { n: number; who: string; tags: string; p: number }) {
  return (
    <div className="trow">
      <span className="co">{n}</span>
      <span className="tx">
        <b>{who}</b>
        <small>{tags}</small>
      </span>
      <span className="cring" style={{ "--p": p } as React.CSSProperties}>
        <span>{p}</span>
      </span>
    </div>
  );
}
