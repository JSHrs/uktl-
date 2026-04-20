import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/sectors")({
  head: () => ({
    meta: [
      { title: "Sectors — UK Talent Link" },
      {
        name: "description",
        content:
          "Generalist by training, sector-fluent by experience. The industries that come back the most.",
      },
      { property: "og:title", content: "Sectors — UK Talent Link" },
      {
        property: "og:description",
        content:
          "Generalist by training, sector-fluent by experience. The industries that come back the most.",
      },
    ],
  }),
  component: SectorsPage,
});

const sectors = [
  { name: "Financial Services", note: "Asset management, banking, insurance, fintech." },
  { name: "Professional Services", note: "Law firms, consulting, accountancy, advisory." },
  { name: "Technology", note: "Scaling SaaS, infrastructure, AI, late-stage startups." },
  { name: "Energy & Infrastructure", note: "Oil & gas, renewables, large-scale projects." },
  { name: "Healthcare", note: "Private healthcare, medtech, pharmaceutical leadership." },
  { name: "Consumer & Retail", note: "Premium retail, hospitality, consumer brands." },
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
        lede="We're generalist by training and sector-fluent by experience. We don't claim every industry as a specialism."
      />

      <section className="py-16 md:py-24">
        <Wrap>
          <Reveal stagger>
            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-rule">
              {sectors.map((s, i) => (
                <article
                  key={s.name}
                  className={`p-10 md:p-14 border-b border-rule ${
                    i % 2 === 0 ? "md:border-r" : ""
                  } hover:bg-paper-deep transition-colors group`}
                >
                  <div className="font-mono text-[11px] text-ink-mute tracking-[0.1em]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3
                    className="font-display font-light leading-[1] tracking-[-0.025em] mt-4 mb-4"
                    style={{ fontSize: "clamp(28px, 3.2vw, 44px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                  >
                    {s.name}
                  </h3>
                  <p className="m-0 text-ink-soft text-[16px] max-w-[42ch]">{s.note}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
