import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — UK Talent Link" },
      {
        name: "description",
        content:
          "HR consultancy, executive search, UK employment law, and Middle East recruitment — four practices, one team.",
      },
      { property: "og:title", content: "Services — UK Talent Link" },
      {
        property: "og:description",
        content:
          "HR consultancy, executive search, UK employment law, and Middle East recruitment — four practices, one team.",
      },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    num: "/ 01",
    eyebrow: "Practice one",
    title: "HR Consultancy in residence.",
    body: "Fractional HR leadership for scaling companies and a second set of eyes for those with a function in place. Policy design, performance frameworks, restructures, investigations, and the quiet strategic work in between.",
    bullets: [
      "Fractional HR Director engagements",
      "Policy & handbook design",
      "Performance and remuneration frameworks",
      "Restructures, redundancies, TUPE",
      "Workplace investigations",
    ],
  },
  {
    num: "/ 02",
    eyebrow: "Practice two",
    title: "Executive search.",
    body: "Retained search for leadership and specialist roles where the wrong hire is expensive. Mapped markets, discreet approaches, structured assessment.",
    bullets: [
      "C-suite and board appointments",
      "Specialist & confidential mandates",
      "Mapped market intelligence",
      "Structured competency assessment",
      "Onboarding & integration support",
    ],
  },
  {
    num: "/ 03",
    eyebrow: "Practice three",
    title: "UK employment law.",
    body: "Contracts, handbooks, TUPE, settlement agreements, and day-to-day advice. Practical answers — not a memo that ends in 'it depends'.",
    bullets: [
      "Contracts of employment & service agreements",
      "Settlement agreements & exit advice",
      "TUPE and business transfers",
      "Disciplinary, grievance & tribunal preparation",
      "Day-to-day in-house support",
    ],
  },
  {
    num: "/ 04",
    eyebrow: "Practice four",
    title: "Recruitment across the Middle East.",
    body: "A London practice with a working knowledge of the GCC labour market. We help UK businesses hire into the region — and regional businesses hire the UK talent they actually want.",
    bullets: [
      "UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman",
      "UK ↔ GCC mobility & visa awareness",
      "Cultural fit & cross-border negotiation",
      "Employer of record introductions",
      "Compliant offer & contract drafting",
    ],
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
        lede="Advisory, recruitment, and employment law sit in the same building — which is why our clients stop juggling three firms and just call us."
      />

      <section className="py-16 md:py-24">
        <Wrap>
          <div className="space-y-px">
            {services.map((s, i) => (
              <Reveal key={i}>
                <article className="grid md:grid-cols-[1fr_2fr] gap-10 lg:gap-20 py-14 md:py-20 border-t border-rule">
                  <div>
                    <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute">
                      {s.num} · {s.eyebrow}
                    </div>
                    <h3
                      className="font-display font-light leading-[1] tracking-[-0.025em] mt-4"
                      style={{ fontSize: "clamp(32px, 4vw, 56px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {s.title}
                    </h3>
                  </div>
                  <div>
                    <p className="text-ink-soft text-[17px] leading-[1.55] m-0 mb-8 max-w-[55ch]">{s.body}</p>
                    <ul className="list-none p-0 m-0 grid sm:grid-cols-2 gap-x-8 gap-y-3">
                      {s.bullets.map((b) => (
                        <li
                          key={b}
                          className="text-[15px] text-ink-soft pl-5 relative before:absolute before:left-0 before:top-[10px] before:w-2 before:h-px before:bg-accent"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
