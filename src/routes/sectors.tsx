import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/sectors")({
  head: () => ({
    meta: [
      { title: "Sectors — UK Talent Link" },
      { name: "description", content: "Generalist by training, sector-fluent by experience. Executive search, HR advisory, and employment law across financial services, technology, energy, healthcare, legal, and construction." },
      { property: "og:title", content: "Sectors — UK Talent Link" },
      { property: "og:description", content: "Generalist by training, sector-fluent by experience. The industries we work in most." },
    ],
  }),
  component: SectorsPage,
});

const sectors = [
  {
    num: "01",
    name: "Financial Services",
    sub: "Asset management · Private banking · Insurance · FinTech",
    body: "Our longest-serving practice area. We work with regulated wealth managers, insurers, and FinTech scale-ups — helping them find senior finance and compliance talent who can operate in FCA-supervised environments and stand up to regulatory scrutiny.",
    roles: [
      "Chief Financial Officer",
      "Finance Director",
      "Head of Compliance",
      "Chief Risk Officer",
      "Investment Manager",
      "Head of Operations",
    ],
    note: "We are not affiliated with any FCA-regulated entity and do not provide financial advice.",
  },
  {
    num: "02",
    name: "Legal & Professional Services",
    sub: "Law firms · Consulting · Accountancy · Advisory",
    body: "From mid-size law firms professionalising their business services function to Big 4 alumni building boutique advisory practices, we understand the operating dynamics of professional services — billing structures, lockstep culture, non-compete constraints, and all.",
    roles: [
      "General Counsel",
      "Head of Legal",
      "Managing Partner",
      "Chief Operating Officer",
      "Business Development Director",
      "Head of Knowledge Management",
    ],
    note: "We do not place fee-earners into regulated legal roles requiring SRA authorisation.",
  },
  {
    num: "03",
    name: "Technology & Digital",
    sub: "SaaS · Infrastructure · AI · Late-stage startups",
    body: "Technology leadership moves fast and the talent pool is genuinely global. We work with scaling SaaS businesses, infrastructure firms, and AI companies that need senior hires who can operate in ambiguity and build while they run — particularly for GCC expansion and UK-headquartered international operations.",
    roles: [
      "Chief Technology Officer",
      "VP Engineering",
      "Head of Product",
      "Chief Information Security Officer",
      "Chief Data Officer",
      "Engineering Director",
    ],
    note: "Strong track record in post-Series B technology firms entering the GCC market.",
  },
  {
    num: "04",
    name: "Energy & Infrastructure",
    sub: "Oil & gas · Renewables · Large-scale project delivery",
    body: "One of our strongest sectors for GCC placements. Energy and infrastructure projects across the Gulf require senior professionals who understand both the technical and commercial dimensions of large-scale delivery — and who can operate across multiple jurisdictions without losing sight of compliance.",
    roles: [
      "Country Director",
      "Project Director",
      "Commercial Manager",
      "HSE Director",
      "Contracts Director",
      "Head of Business Development",
    ],
    note: "Particular experience in UAE, KSA, and Oman-based energy mandates.",
  },
  {
    num: "05",
    name: "Healthcare & Life Sciences",
    sub: "Private healthcare · MedTech · Pharmaceutical leadership",
    body: "Private healthcare providers and life sciences companies need senior leaders who understand regulated environments, clinical governance, and the commercial pressures of a sector where reputation is everything. We work with hospital groups, diagnostic firms, and pharmaceutical businesses across the UK and GCC.",
    roles: [
      "Medical Director",
      "Chief Operating Officer",
      "Head of Clinical Operations",
      "Chief Financial Officer",
      "Head of Regulatory Affairs",
      "Commercial Director",
    ],
    note: "We do not place clinical practitioners or any roles requiring GMC, NMC, or GPhC registration.",
  },
  {
    num: "06",
    name: "Construction & Engineering",
    sub: "Major projects · Civil engineering · Built environment",
    body: "Construction and engineering mandates in the GCC are among the most active search areas we work in. Regional infrastructure programmes require experienced project leadership — people who have delivered before at scale, understand contract risk, and can manage multi-national teams under pressure.",
    roles: [
      "Contracts Director",
      "Senior Quantity Surveyor",
      "Bid Manager",
      "Site Director",
      "Commercial Director",
      "Project Manager",
    ],
    note: "Strong pipeline from the UK and Ireland into Saudi Vision 2030 and UAE infrastructure projects.",
  },
];

function SectorsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="04 — Sectors"
        title={
          <>
            Where the work{" "}
            <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              tends to land.
            </em>
          </>
        }
        lede="We're generalist by training and sector-fluent by experience. We work in six industries because we've earned the right to — through completed mandates, ongoing retainers, and relationships that started with a search and didn't end when it was filled."
      />

      {/* Sector deep-dives */}
      <section className="py-16 md:py-24">
        <Wrap>
          <div className="space-y-0">
            {sectors.map((s, i) => (
              <Reveal key={s.num}>
                <article className="grid md:grid-cols-[3fr_5fr] gap-10 lg:gap-20 py-14 md:py-20 border-t border-rule">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.18em] text-ink-mute mb-5">
                      {s.num}
                    </div>
                    <h2
                      className="font-display font-light leading-[1] tracking-[-0.025em] mb-3"
                      style={{ fontSize: "clamp(24px, 3vw, 42px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {s.name}
                    </h2>
                    <div className="font-mono text-[11px] text-ink-mute tracking-[0.06em] leading-[1.7]">
                      {s.sub}
                    </div>

                    <div className="mt-8">
                      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute mb-3">
                        Roles we place
                      </div>
                      <ul className="list-none p-0 m-0 space-y-1.5">
                        {s.roles.map((r) => (
                          <li key={r} className="text-[14px] text-ink-soft flex items-center gap-2.5">
                            <span className="w-2 h-px bg-accent flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-8">
                    <div>
                      <p className="text-[16px] text-ink-soft leading-[1.65] m-0 mb-6">{s.body}</p>
                      <p className="text-[13px] text-ink-mute leading-[1.6] m-0 pl-4 border-l-2 border-rule">{s.note}</p>
                    </div>
                    <div>
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-0.5"
                      >
                        Enquire about this sector →
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* Cross-sector note */}
      <section className="bg-paper-deep py-16 md:py-20 border-t border-rule">
        <Wrap>
          <Reveal>
            <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
              <div>
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                  — A note on scope
                </div>
                <h3
                  className="font-display font-light leading-[1] tracking-[-0.025em]"
                  style={{ fontSize: "clamp(24px, 3vw, 40px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  We don't claim every sector.
                </h3>
              </div>
              <div className="space-y-5">
                <p className="text-[15px] text-ink-soft leading-[1.65]">
                  The industries above are the ones we work in most — where we have genuine market knowledge, established relationships, and a track record of completed mandates. We're not generalists who will take any brief.
                </p>
                <p className="text-[15px] text-ink-soft leading-[1.65]">
                  If your sector isn't listed and you think we might be the right fit, the honest answer is: tell us about the brief. Some of our strongest mandates have been outside our usual lanes — because the client's situation, not the sector, is what makes a search successful.
                </p>
                <Link
                  to="/contact"
                  className="text-[13px] text-ink-soft hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-0.5 inline-block"
                >
                  Discuss a brief outside these sectors →
                </Link>
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
                  Have a mandate in one of these sectors?
                </h3>
                <p className="text-[15px] text-ink-soft m-0">Send us the brief and we'll confirm whether we can take it on within 24 hours.</p>
              </div>
              <Link
                to="/contact"
                className="text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
              >
                Submit a brief →
              </Link>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
