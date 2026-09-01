import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout, Wrap, SectionHead } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import heroMark from "@/assets/hero-mark.jpg";
import approach01 from "@/assets/approach-01.jpg";
import approach02 from "@/assets/approach-02.jpg";
import approach03 from "@/assets/approach-03.jpg";
import approach04 from "@/assets/approach-04.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UK Talent Link — People, law, and the work of hiring well." },
      {
        name: "description",
        content:
          "London-based HR consultancy, executive search, and UK employment law. Rooted in the UK. Reaching across the Middle East.",
      },
      { property: "og:title", content: "UK Talent Link — People, law, and the work of hiring well." },
      {
        property: "og:description",
        content:
          "London-based HR consultancy, executive search, and UK employment law. Rooted in the UK. Reaching across the Middle East.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <Marquee />
      <Platform />
      <Services />
      <Approach />
      <Pull />
      <Sectors />
      <ContactCTA />
    </SiteLayout>
  );
}

/* ─────────────────── Hero ─────────────────── */

function Hero() {
  const markRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 100);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return () => window.clearTimeout(t);

    let raf = 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = window.requestAnimationFrame(() => {
        const el = markRef.current;
        if (el) {
          const y = window.scrollY;
          const translate = Math.min(y * 0.22, 200);
          const scale = 1 + Math.min(y * 0.0002, 0.07);
          const fade = Math.max(1 - y / 1200, 0.35);
          el.style.transform = `translate3d(0, ${translate}px, 0) scale(${scale})`;
          el.style.setProperty("--mark-fade", String(fade));
        }
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative min-h-screen pt-40 pb-16 md:pt-44 md:pb-20 flex flex-col justify-between overflow-hidden">
      {/* Hero mark — greyscale, vignette masked */}
      <div
        ref={markRef}
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
        style={{
          backgroundImage: `url(${heroMark})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          maskImage: "radial-gradient(ellipse 70% 65% at 68% 42%, black 0%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 68% 42%, black 0%, black 30%, transparent 80%)",
          mixBlendMode: "multiply",
          filter: "grayscale(100%) contrast(1.05)",
          opacity: entered ? `calc(var(--mark-fade, 1) * 0.20)` : 0,
          transition: "opacity 2000ms var(--ease-publication)",
        }}
      />
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none hero-mesh" />
      {/* White vignette top/bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, var(--paper) 0%, transparent 15%, transparent 80%, var(--paper) 100%)" }}
      />

      <Wrap className="relative z-10 flex-1 flex flex-col justify-between">
        {/* Eyebrow */}
        <div className="eyebrow-rise font-mono text-[11px] tracking-[0.16em] uppercase text-ink-mute flex items-center gap-3">
          <span className="w-6 h-px bg-current" />
          London · Dubai · Riyadh · Abu Dhabi
        </div>

        {/* Headline */}
        <h1
          className="font-display font-light leading-[0.93] tracking-[-0.03em] mt-8 text-ink"
          style={{ fontSize: "clamp(52px, 8.5vw, 140px)", fontVariationSettings: '"opsz" 144, "SOFT" 35' }}
        >
          <span className="title-line">
            <span style={{ animationDelay: "320ms" }}>People, law,</span>
          </span>
          <span className="title-line">
            <span style={{ animationDelay: "460ms" }}>and the work</span>
          </span>
          <span className="title-line">
            <span style={{ animationDelay: "600ms" }}>
              of hiring{" "}
              <em className="italic font-light text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
                well.
              </em>
            </span>
          </span>
        </h1>

        {/* Footer row */}
        <div className="foot-rise grid md:grid-cols-[1fr_auto_1fr] items-end gap-10 mt-20 pt-7 border-t border-rule">
          <p className="m-0 text-[15px] text-ink-soft leading-relaxed max-w-[38ch]">
            An independent HR consultancy, executive search firm, and UK employment law practice.
          </p>
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute flex items-center gap-2 md:justify-self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-mute pulse-dot" />
            Scroll
          </div>
          <div className="md:text-right">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-80 transition-opacity"
            >
              Open Talent Compass →
            </Link>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Marquee ─────────────────── */

function Marquee() {
  const items = [
    "HR Consultancy",
    "Executive Search",
    "UK Employment Law",
    "Middle East Recruitment",
    "Workforce Strategy",
    "TUPE & Compliance",
  ];
  const row = (
    <span className="flex items-center gap-16">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-16">
          {it}
          <span className="w-1 h-1 rounded-full bg-accent inline-block" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="border-t border-b border-rule py-5 overflow-hidden bg-paper">
      <div
        className="flex gap-16 whitespace-nowrap marquee-track font-display font-light text-[18px] text-ink-soft"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70', letterSpacing: "-0.01em" }}
      >
        {row}{row}
      </div>
    </div>
  );
}

/* ─────────────────── Platform ─────────────────── */

function Platform() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const steps = [
    { n: "01", title: "Upload", desc: "PDF, DOCX, or plain text. Stored privately in Cloudflare R2 — never publicly accessible.", glyph: "↑" },
    { n: "02", title: "Extract", desc: "Claude reads the document and outputs a structured JSON profile: identity, experience, skills, education.", glyph: "◎" },
    { n: "03", title: "Normalise", desc: "Skill taxonomy collapse. 'ReactJS' and 'React.js' resolve to one canonical entry.", glyph: "≡" },
    { n: "04", title: "Grade", desc: "CV quality scored 0–100 with concrete notes for the consultant.", glyph: "◈" },
    { n: "05", title: "Match", desc: "Candidate ranked against every open mandate. Scores persist and update when mandates change.", glyph: "→" },
  ];

  return (
    <section
      ref={ref}
      className="bg-ink text-paper py-24 md:py-36 lg:py-48 relative overflow-hidden"
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, var(--paper) 0, var(--paper) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, var(--paper) 0, var(--paper) 1px, transparent 1px, transparent 60px)",
        }}
      />

      <Wrap className="relative z-10">
        <Reveal>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/40 mb-5">
            — Talent Compass
          </div>
          <h2
            className="font-display font-light leading-[0.95] tracking-[-0.025em] max-w-[18ch]"
            style={{ fontSize: "clamp(36px, 5vw, 72px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
          >
            One upload.{" "}
            <em className="italic font-light" style={{ color: "oklch(0.765 0.055 263)", fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
              Full intelligence.
            </em>
          </h2>
          <p className="text-paper/55 text-[15px] leading-relaxed max-w-[52ch] mt-5">
            Talent Compass parses a CV end-to-end in under thirty seconds. Every candidate is immediately scored, graded, and ranked — before a consultant opens the file.
          </p>
        </Reveal>

        {/* Pipeline steps */}
        <div className="mt-20 md:mt-24">
          <div className="grid grid-cols-1 md:grid-cols-5 border-t border-paper/10">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`pt-8 pb-0 pr-6 transition-all duration-700 ${active ? "opacity-100" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: active ? `${i * 120}ms` : "0ms" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[10px] text-paper/30 tracking-[0.1em]">{step.n}</span>
                  {i < steps.length - 1 && (
                    <span
                      className="flex-1 h-px bg-paper/10 origin-left pipeline-line hidden md:block"
                      style={active ? { animationPlayState: "running", animationDelay: `${i * 120 + 400}ms` } : {}}
                    />
                  )}
                </div>
                <div
                  className="font-mono text-[22px] text-paper/30 mb-5 leading-none"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {step.glyph}
                </div>
                <div
                  className="font-display font-light text-paper leading-tight mb-3"
                  style={{ fontSize: "clamp(18px, 2vw, 22px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  {step.title}
                </div>
                <p className="text-paper/45 text-[13px] leading-relaxed pr-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Reveal>
          <div className="mt-16 pt-10 border-t border-paper/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-1">Powered by</div>
                <div className="text-[14px] text-paper/55">Anthropic Claude</div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-1">Storage</div>
                <div className="text-[14px] text-paper/55">Cloudflare R2</div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-1">Database</div>
                <div className="text-[14px] text-paper/55">Cloudflare D1</div>
              </div>
            </div>
            <Link
              to="/app/upload"
              className="flex-shrink-0 text-[13px] px-5 py-2.5 border border-paper/20 text-paper rounded-full hover:bg-paper hover:text-ink transition-colors"
            >
              Upload a CV →
            </Link>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Services ─────────────────── */

function Services() {
  return (
    <section className="py-20 md:py-32 lg:py-40 bg-paper-deep">
      <Wrap>
        <Reveal>
          <SectionHead
            number="01 — Services"
            title={
              <>
                Four practices,{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
                  one team.
                </em>
              </>
            }
            lede="We don't refer you out. Advisory, recruitment, and employment law sit in the same building — which is why our clients stop juggling three firms and just call us."
          />
        </Reveal>

        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-12">
            <ServiceCard featured num="/ 01" eyebrow="Practice one" title={<>HR Consultancy <em className="italic" style={{ color: "oklch(0.765 0.055 263)", fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>in residence.</em></>} body="Fractional HR leadership for scaling companies — and a second set of eyes for those with a function in place. Policy design, performance frameworks, restructures, investigations, and the quiet strategic work in between." className="md:col-span-7" />
            <ServiceCard num="/ 02" eyebrow="Practice two" title={<>Executive <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>search.</em></>} body="Retained search for leadership and specialist roles where the wrong hire is expensive. Mapped markets, discreet approaches, structured assessment." className="md:col-span-5" />
            <ServiceCard num="/ 03" eyebrow="Practice three" title={<>UK <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>employment law.</em></>} body={'Contracts, handbooks, TUPE, settlement agreements, and day-to-day advice. Practical answers — not a memo that ends in "it depends".'} className="md:col-span-5" />
            <ServiceCard num="/ 04" eyebrow="Practice four" title={<>Recruitment across the <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>Middle East.</em></>} body="A London practice with a working knowledge of the GCC labour market. We help UK businesses hire into the region — and regional businesses hire the UK talent they actually want." className="md:col-span-7" />
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

function ServiceCard({
  featured,
  num,
  eyebrow,
  title,
  body,
  className = "",
}: {
  featured?: boolean;
  num: string;
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-xl p-8 overflow-hidden min-h-[340px] flex flex-col justify-between border transition-all duration-500 [transition-timing-function:var(--ease-publication)] ${
        featured
          ? "bg-ink text-paper border-ink"
          : "bg-paper border-rule hover:border-ink/40 hover:shadow-[0_24px_48px_-20px_oklch(0.095_0.003_60_/_0.14)]"
      } ${className}`}
    >
      <span
        className={`absolute top-6 right-6 font-mono text-[10px] tracking-[0.12em] ${
          featured ? "text-paper/30" : "text-ink-mute"
        }`}
      >
        {num}
      </span>
      <div className="relative">
        <div
          className={`font-mono text-[10px] tracking-[0.14em] uppercase ${
            featured ? "text-paper/45" : "text-ink-mute"
          }`}
        >
          {eyebrow}
        </div>
        <h3
          className="font-display font-light leading-[1.02] tracking-[-0.02em] mt-5 mb-5 max-w-[15ch]"
          style={{ fontSize: "clamp(24px, 2.8vw, 38px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          {title}
        </h3>
        <p className={`m-0 text-[14.5px] leading-relaxed max-w-[44ch] ${featured ? "text-paper/60" : "text-ink-soft"}`}>
          {body}
        </p>
      </div>
      <Link
        to="/services"
        className="inline-flex items-center gap-2 mt-8 text-[13px] border-b border-current pb-[2px] w-fit transition-[gap] duration-300 hover:gap-3.5 [transition-timing-function:var(--ease-publication)]"
      >
        Explore
        <span>→</span>
      </Link>
    </div>
  );
}

/* ─────────────────── Approach ─────────────────── */

function Approach() {
  const items = [
    {
      idx: "i.",
      title: "We sit on your side of the table.",
      body: "No commissions. No preferred vendors. Just aligned advice — in writing, on the record, and grounded in what we see day to day.",
      tag: "Independent",
      image: approach01,
      caption: "In conference, Chancery Lane.",
    },
    {
      idx: "ii.",
      title: (
        <>Employment law is the{" "}
          <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>starting point</em>
          , not the afterthought.
        </>
      ),
      body: "Every recruitment and HR engagement is checked against UK statute and case law before it ships. The mistakes we prevent are the ones you never have to read about.",
      tag: "Compliant",
      image: approach02,
      caption: "Statute, in the working library.",
    },
    {
      idx: "iii.",
      title: (
        <>Discretion is the{" "}
          <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>default</em>.
        </>
      ),
      body: "Our best work rarely appears on our website. Senior searches, sensitive exits, cross-border restructuring — handled quietly and in one place.",
      tag: "Confidential",
      image: approach03,
      caption: "After hours, WC2.",
    },
    {
      idx: "iv.",
      title: "Written by humans. Drafted by specialists.",
      body: "Contracts, policies, offer letters and process documents that hold up when you actually need them to — because a real practitioner wrote them.",
      tag: "Expertise",
      image: approach04,
      caption: "Drafting, by hand first.",
    },
  ];

  return (
    <section className="py-20 md:py-32 lg:py-40">
      <Wrap>
        <Reveal>
          <SectionHead
            number="02 — Approach"
            title={
              <>
                A quieter way to{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
                  build teams.
                </em>
              </>
            }
            lede="We work with a small number of clients at a time. Each engagement begins by listening — to your business, your obligations, and the gap between the team you have and the one you need."
          />
        </Reveal>

        <div className="border-t border-rule mt-12">
          {items.map((it, i) => {
            const imageLeft = i % 2 === 0;
            return (
              <Reveal key={i}>
                <article
                  className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center py-14 md:py-20 ${
                    i < items.length - 1 ? "border-b border-rule" : ""
                  }`}
                >
                  <figure className={`m-0 col-span-1 md:col-span-5 ${imageLeft ? "md:order-1" : "md:order-2"}`}>
                    <div className="relative overflow-hidden bg-paper-deep aspect-[4/5]">
                      <img
                        src={it.image}
                        alt=""
                        loading="lazy"
                        width={1024}
                        height={1280}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] hover:scale-[1.03] [transition-timing-function:var(--ease-publication)]"
                        style={{ filter: "grayscale(100%) contrast(1.04)" }}
                      />
                    </div>
                    <figcaption className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-mute mt-3.5 flex items-center gap-3">
                      <span className="w-4 h-px bg-current" />
                      {it.caption}
                    </figcaption>
                  </figure>

                  <div className={`col-span-1 md:col-span-7 ${imageLeft ? "md:order-2" : "md:order-1"}`}>
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="font-mono text-[12px] text-ink-mute">{it.idx}</span>
                      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-mute">{it.tag}</span>
                    </div>
                    <h3
                      className="font-display font-light leading-[1.05] tracking-[-0.02em] m-0 max-w-[18ch]"
                      style={{ fontSize: "clamp(26px, 3.2vw, 44px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {it.title}
                    </h3>
                    <p className="m-0 mt-6 text-[15px] text-ink-soft leading-relaxed max-w-[48ch]">{it.body}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Pull ─────────────────── */

function Pull() {
  return (
    <section className="py-20 md:py-28 lg:py-36 bg-paper-deep border-t border-b border-rule">
      <Wrap>
        <Reveal>
          <div className="max-w-[1000px]">
            <blockquote
              className="font-display font-light leading-[1.08] tracking-[-0.022em] m-0 text-ink"
              style={{ fontSize: "clamp(26px, 4vw, 56px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
            >
              "The best HR work is{" "}
              <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>invisible.</em>{" "}
              You don't see the cases that never became cases — only the team that kept growing while nothing went wrong."
            </blockquote>
            <div className="mt-8 flex items-center gap-4 font-mono text-[10px] tracking-[0.12em] uppercase text-ink-mute">
              <span className="w-7 h-px bg-current" />
              From the practice notes, 2025
            </div>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Sectors ─────────────────── */

function Sectors() {
  const sectors = [
    "Financial Services",
    "Professional Services",
    "Technology",
    "Energy & Infrastructure",
    "Healthcare",
    "Consumer & Retail",
  ];
  return (
    <section className="py-20 md:py-32 lg:py-40">
      <Wrap>
        <Reveal>
          <SectionHead
            number="03 — Sectors"
            title={
              <>
                Where the work{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
                  tends to land.
                </em>
              </>
            }
            lede="We're generalist by training and sector-fluent by experience. These are the industries that come back the most — we don't claim every one as a specialism."
          />
        </Reveal>

        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-rule mt-10">
            {sectors.map((s, i) => (
              <div
                key={s}
                className={`py-8 pr-6 border-b border-rule transition-all duration-400 hover:bg-paper-deep hover:pl-4 cursor-default [transition-timing-function:var(--ease-publication)] ${
                  (i + 1) % 3 !== 0 ? "md:border-r" : ""
                }`}
              >
                <div className="font-mono text-[10px] text-ink-mute tracking-[0.12em] mb-3">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h4
                  className="font-display font-normal leading-[1.1] tracking-[-0.02em] m-0"
                  style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
                >
                  {s}
                </h4>
              </div>
            ))}
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Contact CTA ─────────────────── */

function ContactCTA() {
  return (
    <section className="bg-ink text-paper py-24 md:py-36 lg:py-48">
      <Wrap>
        <div className="grid md:grid-cols-[55fr_45fr] gap-16 md:gap-24">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-paper/35 mb-5">
              04 — Contact
            </div>
            <h2
              className="font-display font-light leading-[0.97] tracking-[-0.03em] mb-10"
              style={{ fontSize: "clamp(40px, 6vw, 88px)", fontVariationSettings: '"opsz" 144, "SOFT" 38' }}
            >
              Tell us about the people problem{" "}
              <em className="italic font-light" style={{ color: "oklch(0.765 0.055 263)", fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
                in front of you.
              </em>
            </h2>

            <div className="space-y-0">
              <Detail label="Write" value="info@uktalentlink.co.uk" href="mailto:info@uktalentlink.co.uk" />
              <Detail label="Call" value="+44 (0) 207 189 2857" href="tel:+442071892857" />
              <Detail label="Visit" value="Chancery House, 53–64 Chancery Lane, London WC2A 1QS" />
            </div>
          </div>

          <ContactForm />
        </div>
      </Wrap>
    </section>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="py-5 border-t border-paper/10">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-2">
        {label}
      </div>
      <div
        className="font-display font-light leading-[1.2] tracking-[-0.015em]"
        style={{ fontSize: "clamp(18px, 2vw, 26px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-75 transition-opacity">{inner}</a>
  ) : (
    inner
  );
}

function ContactForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="border border-paper/10 rounded-xl p-8"
    >
      <h3
        className="font-display font-light text-[22px] tracking-[-0.02em] leading-tight m-0 mb-1.5"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        A short, quiet form.
      </h3>
      <p className="text-paper/45 text-[13px] m-0 mb-8">
        A real person replies within one working day.
      </p>

      {[
        { label: "Your name", id: "name", type: "text" },
        { label: "Email", id: "email", type: "email" },
        { label: "Company", id: "company", type: "text" },
      ].map((f) => (
        <div key={f.id} className="mb-6">
          <label htmlFor={f.id} className="block font-mono text-[10px] tracking-[0.12em] uppercase text-paper/35 mb-2">
            {f.label}
          </label>
          <input
            id={f.id}
            type={f.type}
            className="w-full bg-transparent border-0 border-b border-paper/15 py-2.5 text-[15px] text-paper outline-none focus:border-b-[oklch(0.765_0.055_263)] transition-colors placeholder:text-paper/20"
            placeholder="—"
          />
        </div>
      ))}

      <div className="mb-8">
        <label htmlFor="msg" className="block font-mono text-[10px] tracking-[0.12em] uppercase text-paper/35 mb-2">
          What are you working on?
        </label>
        <textarea
          id="msg"
          className="w-full bg-transparent border-0 border-b border-paper/15 py-2.5 text-[15px] text-paper outline-none focus:border-b-[oklch(0.765_0.055_263)] transition-colors resize-y min-h-[72px] placeholder:text-paper/20"
          placeholder="—"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-paper text-ink px-6 py-4 text-[14px] font-medium tracking-[-0.004em] rounded-full cursor-pointer transition-all duration-300 hover:opacity-85 [transition-timing-function:var(--ease-publication)]"
      >
        Send enquiry
      </button>
    </form>
  );
}
