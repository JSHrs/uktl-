import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { CtaStrip, DesignPage, PageHero, SectionHead } from "@/components/site/ds";

export const Route = createFileRoute("/approach")({
  head: () => ({
    meta: [
      { title: "How it works — UK Talent Link" },
      {
        name: "description",
        content:
          "How UK Talent Link works: a free CV score and honest tips, matching to real roles, and consultants who get in touch when you're a strong fit. For employers: how a search runs.",
      },
      { property: "og:title", content: "How it works — UK Talent Link" },
      {
        property: "og:description",
        content: "A free CV score, honest tips, matching to real roles, and consultants who get in touch when you're a strong fit.",
      },
    ],
  }),
  component: Approach,
});

const CANDIDATE_PRINCIPLES = [
  {
    tag: "Free for candidates",
    title: "You never pay to find work through us.",
    body: "Employers pay for recruitment, so everything we offer candidates is free: your account, your CV score and tips, your job matches, and general guidance on your rights at work. There's no premium tier and nothing to unlock.",
    note: "UK rules stop recruitment agencies charging people for finding them work, and we wouldn't want to anyway.",
  },
  {
    tag: "Honest",
    title: "We tell you where you stand.",
    body: "Most job searches go quiet and you never find out why. Your CV score breaks down how your CV reads across contact details, experience, skills, education, and clarity and structure, and each section comes with specific suggestions you can act on straight away.",
    note: "Upload an improved version whenever you like; your score and matches update with it.",
  },
  {
    tag: "Private",
    title: "Your CV is yours.",
    body: "Your CV is stored privately and accessed only through your account or by authorised UK Talent Link staff. It is never published or sold on, and you can see and edit the profile we build from it.",
    note: "Staff access is restricted to named team members who sign in with two-step verification.",
  },
  {
    tag: "Human",
    title: "Software ranks the matches. People make the call.",
    body: "Matching tells us which roles fit your experience and skills, and shows you the reasons. But consultants review the strongest matches and decide who to speak to. You're a person, not a keyword count.",
    note: "Register interest in the roles you like and it shows up for the consultant working on that role.",
  },
  {
    tag: "Your rights at work",
    title: "Guidance when you need it.",
    body: "Questions about a contract, pay, holiday or dismissal don't wait for a job change. Your account includes clear, practical answers grounded in ACAS guidance and UK employment law, and you can book a consultation if you need more.",
    note: "Guidance for candidates is general information based on ACAS advice and UK law, not legal representation.",
  },
];

const JOURNEY = [
  ["Create your account", "Sign up with your email in a minute. Your account keeps your CV, score, matches and questions in one private place."],
  ["Upload your CV", "PDF, Word or plain text, up to 10 MB. We read it and build a structured profile you can check and correct."],
  ["Improve your score", "See your score out of 100 and specific tips for each section. Upload again whenever you like."],
  ["Choose your roles", "Browse the roles you match, see why, and register interest in the ones you want with a single swipe."],
  ["Speak to a consultant", "When you're a strong fit for a role, a consultant gets in touch to talk it through with you."],
] as const;

const EMPLOYER_STAGES = [
  ["Brief", "The role, the team and what success looks like. We agree the requirements, including the must-haves."],
  ["Map", "A map of the market across the UK and the Gulf, and an agreed target list."],
  ["Approach", "Confidential conversations and structured assessment against your requirements."],
  ["Shortlist", "A ranked shortlist with the evidence and the gaps for every name, reviewed by your consultant."],
  ["Hire", "Offer, notice, relocation and check-ins after the start date."],
] as const;

const EMPLOYER_PRINCIPLES = [
  {
    tag: "Transparent",
    title: "Every score shows its working.",
    body: "You see the evidence and the gaps behind each ranked candidate, not just a name and a CV.",
  },
  {
    tag: "Human",
    title: "A consultant reviews every list.",
    body: "Talent Compass ranks candidates against your requirements. A consultant checks the ranking and speaks to people before anyone is introduced.",
  },
  {
    tag: "Careful with data",
    title: "Candidate data handled properly.",
    body: "Candidate records are private to the candidate and authorised staff, and staff sign in with two-step verification.",
  },
];

function Approach() {
  return (
    <SiteLayout>
      <DesignPage>
        <div data-only="candidate">
          <PageHero
            eyebrow="How it works"
            title={
              <>
                Recruitment that <em>works for you.</em>
              </>
            }
            lede="Our job is to put good people in good roles. That means understanding what you want, being honest about where you fit, and staying with you until you're in the right job."
            actions={
              <Link to="/auth/register" search={{ for: "candidate" }} className="btn btn-ink btn-lg">
                Register free →
              </Link>
            }
          />
          <section className="sec">
            <div className="wrap">
              <div className="eyebrow rv" style={{ marginBottom: 24 }}>
                What you can expect from us
              </div>
              <Principles items={CANDIDATE_PRINCIPLES} />
            </div>
          </section>
          <section className="sec deep bt">
            <div className="wrap">
              <SectionHead
                eyebrow="Your journey"
                title={
                  <>
                    From upload to <em>first conversation.</em>
                  </>
                }
                body="Five steps, all free. You choose which roles you're interested in, and you can update your CV whenever you like."
              />
              <div className="jg rv">
                {JOURNEY.map(([h, p], i) => (
                  <div key={h}>
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <h4>{h}</h4>
                    <p>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <CtaStrip
            title="Ready to see where you stand?"
            body="Upload your CV free and get your score today."
            actions={
              <Link to="/auth/register" search={{ for: "candidate" }} className="btn btn-ink btn-lg">
                Register free →
              </Link>
            }
          />
        </div>

        <div data-only="employer">
          <PageHero
            eyebrow="How we search"
            title={
              <>
                A search you can <em>see into.</em>
              </>
            }
            lede="From the first brief to the start date, a consultant runs your search, and you see the reasoning at every stage."
            actions={
              <>
                <Link to="/employers" hash="contact" className="btn btn-ink btn-lg">
                  Start hiring →
                </Link>
                <Link to="/employers" className="btn btn-lg">
                  Our services
                </Link>
              </>
            }
          />
          <section className="band sec">
            <div className="grid-bg" />
            <div className="wrap" style={{ position: "relative" }}>
              <SectionHead
                eyebrow="How a search runs"
                title={
                  <>
                    From brief to <em>start date.</em>
                  </>
                }
                body="Timelines vary with seniority and market; we agree them with you at the brief."
              />
              <div className="tl rv">
                {EMPLOYER_STAGES.map(([h, p], i) => (
                  <div key={h}>
                    <div className="wk">Stage {i + 1}</div>
                    <h4>{h}</h4>
                    <p>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="sec">
            <div className="wrap">
              <div className="eyebrow rv" style={{ marginBottom: 24 }}>
                How we work with clients
              </div>
              <Principles items={EMPLOYER_PRINCIPLES} />
            </div>
          </section>
          <CtaStrip
            title="Have a role in mind?"
            body="Tell us about it and a consultant will reply, usually within one working day."
            actions={
              <Link to="/employers" hash="contact" className="btn btn-ink btn-lg">
                Book a consultation →
              </Link>
            }
          />
        </div>
      </DesignPage>
    </SiteLayout>
  );
}

const ROMAN = ["i.", "ii.", "iii.", "iv.", "v."];

function Principles({ items }: { items: { tag: string; title: string; body: string; note?: string }[] }) {
  return (
    <div className="rv">
      {items.map((p, i) => (
        <div
          key={p.title}
          className="art principle"
          style={i === items.length - 1 ? { borderBottom: "1px solid var(--rule)" } : undefined}
        >
          <span className="mono">{ROMAN[i]}</span>
          <div>
            <div className="tag">{p.tag}</div>
            <h3 className="disp" style={{ fontSize: "clamp(22px,2.6cqi,34px)" }}>
              {p.title}
            </h3>
          </div>
          <div>
            <p className="body">{p.body}</p>
            {p.note && <p className="aside-note">{p.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
