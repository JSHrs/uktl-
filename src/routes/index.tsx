import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { AnnotatedCv, Head, Hero, RankDemo, RouteSteps, SectorIndex, useReveal } from "@/components/site/Landing";
import { EmployerEnquiry } from "@/components/site/EmployerEnquiry";
import { useAudience } from "@/lib/preferences";

/*
 * Landing page (November 2026 redesign; styles in styles/landing.css).
 * One page, two audiences: both versions are rendered and <html data-for> shows
 * one (see lib/preferences.ts). Interactive pieces are labelled examples and
 * contain no real people or employers.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UK Talent Link — Recruitment between the UK and the Gulf" },
      {
        name: "description",
        content:
          "UK Talent Link is a recruitment firm placing people across the UK and the Gulf. Candidates get a free CV score, specific fixes and matches to the roles we're recruiting for. Employers get a ranked, reasoned shortlist.",
      },
      { property: "og:title", content: "UK Talent Link — Recruitment between the UK and the Gulf" },
      {
        property: "og:description",
        content: "Upload your CV free for a score, fixes and matches, or tell us about a role you need to fill.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

const CANDIDATE_STEPS = [
  ["Create your account", "A minute, with your email or Google or Apple. Everything for candidates is free."],
  ["Upload your CV", "PDF, Word or plain text, up to 10 MB. Stored privately, never published."],
  ["Read your score", "Out of 100, section by section, with the fixes that matter most."],
  ["See where you fit", "A fit score for every role we're recruiting for, and the reasons behind it."],
  ["Hear from a consultant", "When you're a strong fit, a real person gets in touch to talk it through."],
] as const;

const EMPLOYER_STEPS = [
  ["Brief", "The role, the team and the must-haves, agreed with a consultant."],
  ["Map", "The market across the UK and the Gulf, and a target list you approve."],
  ["Approach", "Confidential conversations, assessed against your requirements."],
  ["Shortlist", "Ranked, with the evidence and the gaps for every name."],
  ["Hire", "Offer, notice, relocation and check-ins after the start date."],
] as const;

function Index() {
  const ref = useReveal<HTMLDivElement>();
  const audience = useAudience();
  return (
    <SiteLayout>
      <div className="lp" ref={ref}>
        <Hero />
        <div id="lp-start" style={{ scrollMarginTop: 64 }}>
          <div data-only="candidate">
            <section className="lp-sec">
              <div className="lp-wrap">
                <Head
                  label="How your CV is read"
                  title={
                    <>
                      Five things a recruiter looks for. <em>Scored honestly.</em>
                    </>
                  }
                >
                  Most applications go quiet and you never find out why. Pick a line to see what we look at, and the kind
                  of feedback you get back.
                </Head>
                <AnnotatedCv />
              </div>
            </section>

            <section className="lp-sec lp-band">
              <div className="lp-wrap">
                <Head
                  label="From upload to a conversation"
                  title={
                    <>
                      One upload. <em>Five steps.</em>
                    </>
                  }
                >
                  You choose which roles interest you, and you can upload a new version of your CV whenever you like.
                </Head>
                <RouteSteps steps={CANDIDATE_STEPS} label="Step" />
              </div>
            </section>

            <section className="lp-sec">
              <div className="lp-wrap">
                <Head
                  label="Roles we recruit for"
                  title={
                    <>
                      Six sectors, <em>two markets.</em>
                    </>
                  }
                >
                  Upload once and you're matched against every role we're recruiting for, in the UK and across the Gulf.
                </Head>
                <SectorIndex audience="candidate" />
              </div>
            </section>

            <section className="lp-sec">
              <div className="lp-wrap">
                <Head
                  label="What it costs you"
                  title={
                    <>
                      Nothing. <em>Employers pay.</em>
                    </>
                  }
                >
                  There's no premium tier and nothing to unlock. UK rules stop agencies charging you for finding work
                  anyway.
                </Head>
                <div className="lp-ledger lp-rv">
                  <div>
                    <b>£0</b>
                    <h3>Free for candidates</h3>
                    <p>Your account, CV score, fixes, matches and workplace guidance cost you nothing.</p>
                  </div>
                  <div>
                    <b>0–100</b>
                    <h3>Straight feedback</h3>
                    <p>A score for the whole CV and for each section, so you know why applications go quiet.</p>
                  </div>
                  <div>
                    <b>2</b>
                    <h3>Markets from one account</h3>
                    <p>The UK and the Gulf. Your CV stays private: seen only by you and authorised UK Talent Link staff.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="lp-sec lp-close">
              <div className="lp-wrap">
                <div>
                  <span className="lp-mono" style={{ color: "inherit", opacity: 0.6 }}>
                    Start free
                  </span>
                  <h2 className="lp-disp" style={{ marginTop: 14 }}>
                    Your next move starts <em>with one upload.</em>
                  </h2>
                  <p>Create a free account and see what's working, what's holding you back and which roles you fit.</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="lp-btn lp-btn-solid">
                    Create free account
                  </Link>
                  <Link to="/auth/login" className="lp-btn lp-btn-line">
                    Sign in
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div data-only="employer">
            <section className="lp-sec">
              <div className="lp-wrap">
                <Head
                  label="The shortlist, explained"
                  title={
                    <>
                      Change the brief. <em>Watch the shortlist move.</em>
                    </>
                  }
                >
                  Every candidate is scored against your requirements, and must-haves stay must-haves. This is the rule
                  our ranking uses, on an example you can play with.
                </Head>
                <RankDemo />
              </div>
            </section>

            <section className="lp-sec lp-band">
              <div className="lp-wrap">
                <Head
                  label="How a search runs"
                  title={
                    <>
                      From brief to <em>start date.</em>
                    </>
                  }
                >
                  A consultant runs your search end to end, and you see the reasoning at every stage. Timelines are agreed
                  with you at the brief.
                </Head>
                <RouteSteps steps={EMPLOYER_STEPS} label="Stage" />
              </div>
            </section>

            <section className="lp-sec">
              <div className="lp-wrap">
                <Head
                  label="What we do"
                  title={
                    <>
                      Two services. <em>One standard.</em>
                    </>
                  }
                >
                  Executive search for the hires that shape your organisation, and practical HR consultancy for the people
                  side that follows.
                </Head>
                <div className="lp-two lp-rv">
                  <div>
                    <span className="lp-mono">Executive search</span>
                    <h3>Senior and specialist hires.</h3>
                    <p>We map the market, approach people quietly and present a ranked shortlist with the evidence for every name.</p>
                    <ul>
                      <li>Market mapping across the UK and the Gulf</li>
                      <li>Confidential approach and assessment</li>
                      <li>Ranked shortlist with reasoning</li>
                      <li>Offer, relocation and onboarding support</li>
                    </ul>
                  </div>
                  <div>
                    <span className="lp-mono">HR consultancy</span>
                    <h3>The people side, done properly.</h3>
                    <p>Hands-on HR support: structure, policy, reward and the hard conversations.</p>
                    <ul>
                      <li>Organisation design and workforce planning</li>
                      <li>Policies, handbooks and contracts</li>
                      <li>Reward and benchmarking</li>
                      <li>Employee relations casework</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="lp-sec">
              <div className="lp-wrap">
                <Head
                  label="Where we recruit"
                  title={
                    <>
                      Six sectors, <em>two markets.</em>
                    </>
                  }
                >
                  Led by construction, engineering and technology, across the UK and the Gulf.
                </Head>
                <SectorIndex audience="employer" />
              </div>
            </section>

            <div className="ds">
              <EmployerEnquiry />
            </div>
          </div>
        </div>
        {/* Keeps the audience hook subscribed so the door buttons reflect changes made in the header menu. */}
        <span hidden data-audience={audience} />
      </div>
    </SiteLayout>
  );
}
