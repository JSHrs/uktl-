import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/reach")({
  head: () => ({
    meta: [
      { title: "Reach — UK Talent Link" },
      {
        name: "description",
        content:
          "Rooted in London. Working across the Gulf. One firm for both ends of the UK–GCC hiring corridor.",
      },
      { property: "og:title", content: "Reach — UK Talent Link" },
      {
        property: "og:description",
        content:
          "Rooted in London. Working across the Gulf. One firm for both ends of the UK–GCC hiring corridor.",
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
      <PageHero
        eyebrow="03 — Reach"
        title={
          <>
            One firm.{" "}
            <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              Two markets.
            </em>{" "}
            One point of contact.
          </>
        }
        lede="The UK–Gulf hiring corridor is busy, lucrative, and full of firms who only understand one end of it. We work on both."
      />

      <section className="py-16 md:py-24">
        <Wrap>
          <Reveal>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-10 pb-16 border-b border-rule mb-16">
              {[
                { v: "14+", l: "Years combined practice" },
                { v: "6", l: "GCC markets covered" },
                { v: "100%", l: "Retained engagements" },
                { v: "1", l: "Firm. One invoice." },
              ].map((s) => (
                <div key={s.l}>
                  <dt
                    className="font-display font-light tracking-[-0.03em] leading-[1] m-0"
                    style={{ fontSize: "clamp(36px, 4vw, 52px)", fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
                  >
                    {s.v}
                  </dt>
                  <dd className="m-0 mt-2 text-sm text-ink-mute font-mono uppercase tracking-[0.08em]">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal>
            <h3
              className="font-display font-light leading-[1.05] tracking-[-0.02em] max-w-[20ch] mb-12"
              style={{ fontSize: "clamp(26px, 3.4vw, 40px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
            >
              Where we{" "}
              <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                operate.
              </em>
            </h3>
          </Reveal>

          <Reveal stagger>
            <ul className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
              {markets.map((m) => (
                <li key={m.city} className="bg-paper p-8 hover:bg-paper-deep transition-colors">
                  <div className="font-mono text-[11px] text-ink-mute tracking-[0.1em] uppercase">
                    {m.coords}
                  </div>
                  <h4
                    className="font-display font-light text-[34px] tracking-[-0.02em] leading-[1] m-0 mt-3"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
                  >
                    {m.city}
                  </h4>
                  <p className="text-ink-soft text-sm mt-3 m-0">{m.note}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
