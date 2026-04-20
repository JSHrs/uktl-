import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/approach")({
  head: () => ({
    meta: [
      { title: "Approach — UK Talent Link" },
      {
        name: "description",
        content:
          "Independent, compliant, confidential. The principles behind how we advise, search, and write the law that holds your team together.",
      },
      { property: "og:title", content: "Approach — UK Talent Link" },
      {
        property: "og:description",
        content:
          "Independent, compliant, confidential. The principles behind how we advise, search, and write the law that holds your team together.",
      },
    ],
  }),
  component: ApproachPage,
});

const principles = [
  {
    idx: "i.",
    title: "We sit on your side of the table.",
    body: "No commissions. No preferred vendors. Just aligned advice — in writing, on the record, and grounded in what we see day to day.",
    tag: "Independent",
  },
  {
    idx: "ii.",
    title: "Employment law is the starting point, not the afterthought.",
    body: "Every recruitment and HR engagement is checked against UK statute and case law before it ships. The mistakes we prevent are the ones you never have to read about.",
    tag: "Compliant",
  },
  {
    idx: "iii.",
    title: "Discretion is the default.",
    body: "Our best work rarely appears on our website. Senior searches, sensitive exits, cross-border restructuring — handled quietly and in one place.",
    tag: "Confidential",
  },
  {
    idx: "iv.",
    title: "Written by humans. Drafted by specialists.",
    body: "Contracts, policies, offer letters and process documents that hold up when you actually need them to — because a real practitioner wrote them.",
    tag: "Expertise",
  },
  {
    idx: "v.",
    title: "We work with a small number of clients at a time.",
    body: "Our model is deliberate. Fewer engagements, deeper relationships, partner-led work. You'll know who's drafting your documents and who's making the calls.",
    tag: "Selective",
  },
];

function ApproachPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="01 — Approach"
        title={
          <>
            A quieter way to{" "}
            <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              build teams.
            </em>
          </>
        }
        lede="Each engagement begins by listening — to your business, your obligations, and the gap between the team you have and the one you need."
      />

      <section className="py-20 md:py-28">
        <Wrap>
          <Reveal stagger>
            <ul className="list-none p-0 m-0">
              {principles.map((it, i) => (
                <li
                  key={i}
                  className={`grid md:grid-cols-[80px_1fr_2fr_auto] gap-x-10 gap-y-3 items-start py-9 border-t border-rule ${
                    i === principles.length - 1 ? "border-b border-rule" : ""
                  }`}
                >
                  <div className="font-mono text-[13px] text-ink-mute pt-2">{it.idx}</div>
                  <h3
                    className="font-display font-light leading-[1.05] tracking-[-0.02em] m-0"
                    style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                  >
                    {it.title}
                  </h3>
                  <p className="m-0 text-ink-soft text-base max-w-[48ch]">{it.body}</p>
                  <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-mute pt-3 whitespace-nowrap">
                    {it.tag}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
