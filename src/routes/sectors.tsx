import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { Article, CtaStrip, DesignPage, PageHero, Ticks } from "@/components/site/ds";

export const Route = createFileRoute("/sectors")({
  head: () => ({
    meta: [
      { title: "Roles we recruit for — UK Talent Link" },
      { name: "description", content: "The sectors and roles UK Talent Link recruits for across the UK and the Gulf — led by construction, engineering and technology. Upload your CV free to be matched." },
      { property: "og:title", content: "Roles we recruit for — UK Talent Link" },
      { property: "og:description", content: "Construction, engineering, technology and more, across the UK and the Gulf. Upload your CV free to be matched." },
    ],
  }),
  component: SectorsPage,
});

const sectors = [
  {
    num: "01",
    name: "Construction & Engineering",
    sub: "Major projects · Civil engineering · Built environment",
    focus: true,
    body: "From site teams to commercial leadership, construction and engineering is where many of our live roles sit — across UK projects and the large infrastructure programmes in the Gulf. If you've delivered projects, managed contracts or run sites, upload your CV and we'll show you where you fit.",
    roles: ["Quantity Surveyor", "Site Manager", "Project Manager", "Civil / Structural Engineer", "Contracts Director", "Commercial Director"],
    note: "Strong demand for UK- and Ireland-trained professionals on Saudi Vision 2030 and UAE infrastructure projects.",
  },
  {
    num: "02",
    name: "Technology & Digital",
    sub: "Software · Data · Infrastructure · Product",
    focus: true,
    body: "Engineers, data specialists, product people and technology leaders. We recruit for businesses building and scaling software in the UK, and for UK-headquartered companies expanding into the Gulf. Matching is based on your actual skills and experience, not just your job title.",
    roles: ["Software Engineer", "Data Engineer", "DevOps / Platform Engineer", "Product Manager", "Engineering Manager", "CTO / VP Engineering"],
    note: "Roles range from individual contributors to technology leadership.",
  },
  {
    num: "03",
    name: "Energy & Infrastructure",
    sub: "Oil & gas · Renewables · Large-scale project delivery",
    body: "Senior technical and commercial roles on energy and infrastructure projects, particularly across the Gulf, for people who understand large-scale delivery and working across jurisdictions.",
    roles: ["Project Director", "Commercial Manager", "HSE Director", "Contracts Director", "Country Director", "Head of Business Development"],
    note: "Particular experience in UAE, KSA and Oman-based energy roles.",
  },
  {
    num: "04",
    name: "Financial Services",
    sub: "Asset management · Private banking · Insurance · FinTech",
    body: "Finance, compliance and operations roles with regulated wealth managers, insurers and FinTech businesses, for people comfortable working in FCA-supervised environments.",
    roles: ["Finance Director", "Head of Compliance", "Chief Risk Officer", "Investment Manager", "Head of Operations", "Chief Financial Officer"],
    note: "We are not affiliated with any FCA-regulated entity and do not provide financial advice.",
  },
  {
    num: "05",
    name: "Legal & Professional Services",
    sub: "Law firms · Consulting · Accountancy · Advisory",
    body: "Business-services and leadership roles in law firms, consultancies and advisory practices — operations, business development, knowledge management and in-house legal leadership.",
    roles: ["General Counsel", "Head of Legal", "Chief Operating Officer", "Business Development Director", "Head of Knowledge Management", "Managing Partner"],
    note: "We do not place fee-earners into regulated legal roles requiring SRA authorisation.",
  },
  {
    num: "06",
    name: "Healthcare & Life Sciences",
    sub: "Private healthcare · MedTech · Pharmaceutical leadership",
    body: "Non-clinical leadership roles with hospital groups, diagnostics firms and pharmaceutical businesses in the UK and the Gulf, for people who know regulated, reputation-sensitive environments.",
    roles: ["Chief Operating Officer", "Head of Clinical Operations", "Head of Regulatory Affairs", "Commercial Director", "Chief Financial Officer", "Medical Director"],
    note: "We do not place clinical practitioners or any roles requiring GMC, NMC or GPhC registration.",
  },
];

const slug = (name: string) => name.split(" ")[0].toLowerCase();

function SectorsPage() {
  return (
    <SiteLayout>
      <DesignPage>
        <PageHero
          eyebrow="Sectors"
          title={
            <>
              Where we <em>know the market.</em>
            </>
          }
          lede={
            <>
              <span data-only="candidate">
                Most of our live roles are in construction, engineering and technology, across the UK and the Gulf. We also
                recruit for leadership and specialist roles in four more sectors. Upload your CV once and you're matched
                against all of them.
              </span>
              <span data-only="employer">
                We recruit in six sectors across the UK and the Gulf, led by construction, engineering and technology.
              </span>
            </>
          }
        />
        <section className="sec" style={{ paddingTop: 40 }}>
          <div className="wrap">
            {sectors.map((s) => (
              <Article
                key={s.num}
                id={slug(s.name)}
                tag={
                  <>
                    {s.num} {s.focus && <span className="pill good">Most live roles</span>}
                  </>
                }
                title={s.name}
                aside={
                  <p className="mono" style={{ marginTop: 12, textTransform: "none", letterSpacing: ".04em", fontSize: 11 }}>
                    {s.sub}
                  </p>
                }
              >
                <p className="body">{s.body}</p>
                <Ticks label="Typical roles" items={s.roles} />
                {s.note && <p className="aside-note">{s.note}</p>}
                <Link
                  to="/onboarding"
                  search={{ for: "candidate", step: 1 }}
                  className="lnk"
                  data-only="candidate"
                  style={{ display: "inline-block", marginTop: 24, color: "var(--ink)" }}
                >
                  Register to be matched →
                </Link>
                <Link
                  to="/employers"
                  hash="contact"
                  className="lnk"
                  data-only="employer"
                  style={{ display: "inline-block", marginTop: 24, color: "var(--ink)" }}
                >
                  Brief us on a {s.name.split(" ")[0].toLowerCase()} role →
                </Link>
              </Article>
            ))}
          </div>
        </section>
        <div data-only="candidate">
          <CtaStrip
            title="Your sector, your next role."
            body="Upload your CV free and see the roles you match today."
            actions={
              <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="btn btn-ink btn-lg">
                Register free →
              </Link>
            }
          />
        </div>
        <div data-only="employer">
          <CtaStrip
            title="Hiring in one of these sectors?"
            body="Tell us about the role and a consultant will be in touch."
            actions={
              <Link to="/employers" hash="contact" className="btn btn-ink btn-lg">
                Brief us →
              </Link>
            }
          />
        </div>
      </DesignPage>
    </SiteLayout>
  );
}
