import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — UK Talent Link" },
      { name: "description", content: "HR consultancy, executive search, UK employment law, and Middle East recruitment — four practices, one team. Delivered by practitioners, not account managers." },
      { property: "og:title", content: "Services — UK Talent Link" },
      { property: "og:description", content: "HR consultancy, executive search, UK employment law, and Middle East recruitment — four practices, one team." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    num: "/ 01",
    eyebrow: "Practice one",
    title: "HR Consultancy in residence.",
    body: "Fractional HR leadership and embedded advisory for businesses at every stage. We work alongside your team — not in quarterly review cycles — handling the operational complexity so your people function can focus on the work that matters.",
    whoFor: [
      "Scale-ups professionalising their first HR function",
      "Established businesses needing interim senior HR cover",
      "Companies with an HR team that needs a senior sounding board",
    ],
    bullets: [
      "Fractional HR Director & CHRO engagements",
      "Policy design and employee handbook builds",
      "Performance frameworks and remuneration architecture",
      "Restructures, redundancies, and TUPE transfers",
      "Workplace investigations and disciplinary support",
      "HR audits and compliance reviews",
    ],
    model: "Retained monthly · Project-based · Day rate available",
    anchor: "hr-consultancy",
  },
  {
    num: "/ 02",
    eyebrow: "Practice two",
    title: "Executive search.",
    body: "Retained search for leadership and specialist roles where the wrong hire costs more than the fee. We map markets properly, approach discreetly, and assess rigorously — with employment law review built into every offer stage so nothing unravels after the appointment.",
    whoFor: [
      "Boards making C-suite and director-level appointments",
      "Businesses conducting sensitive or confidential searches",
      "GCC companies seeking UK-qualified senior talent",
    ],
    bullets: [
      "C-suite and board-level appointments",
      "Confidential and successor-planning mandates",
      "Mapped market intelligence and competitor analysis",
      "Structured competency-based assessment",
      "Offer negotiation and contract review",
      "90-day onboarding and integration support",
    ],
    model: "Retained search · Minimum 90-day mandate",
    anchor: "executive-search",
  },
  {
    num: "/ 03",
    eyebrow: "Practice three",
    title: "UK employment law.",
    body: "Contracts, handbooks, settlement agreements, TUPE, disciplinary procedures, and day-to-day advice. Practical answers from practitioners who draft the documents themselves — not a memo that ends in 'it depends'. We advise employers. We don't represent employees.",
    whoFor: [
      "SMEs that need in-house quality advice without in-house cost",
      "Businesses facing tribunal risk or a live dispute",
      "GCC employers making UK hires for the first time",
    ],
    bullets: [
      "Contracts of employment and director service agreements",
      "Employee handbooks and policy suites",
      "Settlement agreements and compromise arrangements",
      "TUPE and business transfer advice",
      "Disciplinary, grievance, and tribunal preparation",
      "IR35 and contractor status reviews",
    ],
    model: "Project-based · Subscription advisory · Hourly available",
    anchor: "employment-law",
  },
  {
    num: "/ 04",
    eyebrow: "Practice four",
    title: "Recruitment across the Middle East.",
    body: "A London practice with a working knowledge of the GCC labour market. We help UK businesses hiring into the region and regional businesses finding the UK talent they actually want — handling the mobility, compliance, and cross-cultural dynamics that trip up firms working with partners who've never done it before.",
    whoFor: [
      "UK firms expanding into the UAE, Saudi Arabia, or Qatar",
      "GCC businesses building UK-based or UK-trained leadership",
      "International organisations staffing regional operations",
    ],
    bullets: [
      "UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, and Oman",
      "UK ↔ GCC professional mobility and visa pathways",
      "Cultural fit assessment and cross-border negotiation",
      "Employer of record introductions where relevant",
      "Compliant offer and contract drafting under local law",
      "Right-to-work and immigration awareness",
    ],
    model: "Retained search · Contingency for specific roles",
    anchor: "gcc-recruitment",
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="02 — Services"
        title={
          <>
            Four practices,{" "}
            <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              one team.
            </em>
          </>
        }
        lede="Advisory, recruitment, and employment law in one practice — which is why our clients stop juggling three firms and just call us. Each service is delivered by the person who specialises in it, not passed to a team you've never met."
      />

      <section className="py-16 md:py-24">
        <Wrap>
          <div className="space-y-0">
            {services.map((s, i) => (
              <Reveal key={i}>
                <article
                  id={s.anchor}
                  className="grid md:grid-cols-[5fr_7fr] gap-10 lg:gap-20 py-16 md:py-24 border-t border-rule"
                >
                  <div className="md:sticky md:top-28 md:self-start">
                    <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">
                      {s.num} · {s.eyebrow}
                    </div>
                    <h2
                      className="font-display font-light leading-[1] tracking-[-0.025em] mt-5"
                      style={{ fontSize: "clamp(28px, 3.5vw, 50px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {s.title}
                    </h2>
                    <div className="mt-8 pt-6 border-t border-rule">
                      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute mb-3">
                        Engagement model
                      </div>
                      <p className="text-[13px] text-ink-soft">{s.model}</p>
                    </div>
                    <div className="mt-5">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-[13px] px-4 py-2 border border-ink bg-ink text-paper rounded-full hover:opacity-80 transition-opacity"
                      >
                        Enquire →
                      </Link>
                    </div>
                  </div>

                  <div>
                    <p className="text-[16px] text-ink-soft leading-[1.65] m-0 mb-8">{s.body}</p>

                    <div className="mb-8">
                      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute mb-4">
                        Who it's for
                      </div>
                      <ul className="list-none p-0 m-0 space-y-2">
                        {s.whoFor.map((w) => (
                          <li key={w} className="text-[14px] text-ink-soft flex items-start gap-3">
                            <span className="mt-2 w-3 h-px bg-accent flex-shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute mb-4">
                        What's included
                      </div>
                      <ul className="list-none p-0 m-0 grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="text-[14px] text-ink-soft pl-5 relative before:absolute before:left-0 before:top-[10px] before:w-2.5 before:h-px before:bg-rule"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* Why all four */}
      <section className="bg-paper-deep py-20 md:py-28 border-t border-rule">
        <Wrap>
          <Reveal>
            <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
              <div>
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                  — Why one firm
                </div>
                <h2
                  className="font-display font-light leading-[1] tracking-[-0.025em]"
                  style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  Everything connected.
                </h2>
              </div>
              <div className="space-y-5">
                <p className="text-[16px] text-ink-soft leading-[1.65]">
                  In most firms, the employment lawyer doesn't talk to the recruiter. The HR advisor doesn't know what the search team is promising. The result is gaps — in advice, in compliance, in the candidate's experience of your business.
                </p>
                <p className="text-[16px] text-ink-soft leading-[1.65]">
                  Here, the practices share the same building and the same client file. The search team knows what the HR engagement found. The employment lawyer reviews every offer before it goes out. When something changes mid-engagement — as it always does — the whole team adapts, not just the individual you called.
                </p>
                <div className="pt-4">
                  <Link
                    to="/contact"
                    className="text-[13px] text-ink-soft hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-0.5"
                  >
                    Talk to us about your situation →
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-rule">
        <Wrap>
          <Reveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3
                  className="font-display font-light leading-[1.1] tracking-[-0.02em] mb-2"
                  style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  Not sure which practice fits your brief?
                </h3>
                <p className="text-[15px] text-ink-soft m-0">Tell us what you're working on. We'll suggest the right starting point.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  Get in touch →
                </Link>
              </div>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
