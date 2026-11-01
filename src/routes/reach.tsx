import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { CtaStrip, DesignPage, PageHero, SectionHead } from "@/components/site/ds";

export const Route = createFileRoute("/reach")({
  head: () => ({
    meta: [
      { title: "Reach — UK Talent Link" },
      {
        name: "description",
        content:
          "UK roles and Gulf roles from one recruitment firm. One free account opens up opportunities in London and across the GCC.",
      },
      { property: "og:title", content: "Reach — UK Talent Link" },
      {
        property: "og:description",
        content:
          "UK roles and Gulf roles from one recruitment firm. One free account opens up opportunities in both.",
      },
    ],
  }),
  component: ReachPage,
});

const markets = [
  { city: "London", coords: "51.5°N · 0.1°W", note: "Headquarters · Chancery Lane" },
  { city: "Dubai", coords: "25.2°N · 55.2°E", note: "GCC operations" },
  { city: "Abu Dhabi", coords: "24.5°N · 54.4°E", note: "Public & energy sector" },
  { city: "Riyadh", coords: "24.7°N · 46.7°E", note: "Saudi mandates" },
  { city: "Doha", coords: "25.3°N · 51.5°E", note: "Selected engagements" },
  { city: "Manama", coords: "26.2°N · 50.6°E", note: "Financial services" },
];

function ReachPage() {
  return (
    <SiteLayout>
      <DesignPage>
        <PageHero
          eyebrow="Reach"
          title={
            <>
              UK roles. <em>Gulf roles.</em> One team.
            </>
          }
          lede={
            <>
              <span data-only="candidate">
                We recruit for employers in the UK and across the Gulf, so one free account opens up opportunities in both.
                Thinking about a move between them? Our consultants know what it really involves, from relocation to
                contracts under local law.
              </span>
              <span data-only="employer">
                Search across both markets with one firm. We recruit UK-trained professionals for Gulf roles and bring
                people home to the UK, and we flag what a move involves before the offer.
              </span>
            </>
          }
        />
        <section className="sec">
          <div className="wrap">
            <SectionHead
              eyebrow="Where we work"
              title={
                <>
                  Six cities, <em>one team.</em>
                </>
              }
              body="London is our home. The Gulf is where many of the biggest construction, engineering and technology programmes are being delivered, and where UK-trained professionals are in demand."
            />
            <div className="mk rv">
              {markets.map((m) => (
                <div key={m.city}>
                  <span className="mono">{m.coords}</span>
                  <h3 className="disp">{m.city}</h3>
                  <p>{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="sec deep bt">
          <div className="wrap">
            <div className="sh rv">
              <div>
                <div className="eyebrow">Moving between markets</div>
                <h2 className="disp">
                  What a move <em>really involves.</em>
                </h2>
              </div>
              <p>
                <span data-only="candidate">We talk you through it before you commit.</span>
                <span data-only="employer">We plan it with you and the candidate, before the offer.</span>
              </p>
            </div>
            <div className="cards3 rv">
              <div>
                <span className="mono">Visas</span>
                <h4>Right to work</h4>
                <p>
                  Gulf employment visas and UK sponsorship each have their own steps and timelines, including document
                  checks. We raise them early so they don't delay a start date.
                </p>
              </div>
              <div>
                <span className="mono">Pay &amp; tax</span>
                <h4>Total reward</h4>
                <p>
                  Housing, schooling and flight allowances, end-of-service gratuity and UK residence rules all change what
                  a package is worth.
                </p>
              </div>
              <div>
                <span className="mono">Contracts</span>
                <h4>Local law</h4>
                <p>Notice, probation and restrictive covenants work differently under UAE, Saudi and UK law. We flag the differences early.</p>
              </div>
            </div>
          </div>
        </section>
        <div data-only="candidate">
          <CtaStrip
            title="Open to a move?"
            body="Upload your CV free and see UK and Gulf roles you match."
            actions={
              <Link to="/auth/register" search={{ for: "candidate" }} className="btn btn-ink btn-lg">
                Register free →
              </Link>
            }
          />
        </div>
        <div data-only="employer">
          <CtaStrip
            title="Hiring across borders?"
            body="Talk to a consultant about a UK ↔ Gulf search."
            actions={
              <Link to="/employers" hash="contact" className="btn btn-ink btn-lg">
                Start hiring →
              </Link>
            }
          />
        </div>
      </DesignPage>
    </SiteLayout>
  );
}
