import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout, Wrap, SectionHead } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import heroMark from "@/assets/hero-mark.jpg";

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
      <Approach />
      <Services />
      <Reach />
      <Pull />
      <Sectors />
      <ContactCTA />
    </SiteLayout>
  );
}

function Hero() {
  const markRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Fade-in on mount
    const t = window.setTimeout(() => setEntered(true), 120);

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
          // Slow parallax drift + gentle scale; clamp so it stays subtle
          const translate = Math.min(y * 0.18, 160);
          const scale = 1 + Math.min(y * 0.00018, 0.06);
          // Soften opacity slightly as it leaves the viewport
          const fade = Math.max(1 - y / 1200, 0.55);
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
    <section className="relative min-h-screen pt-44 pb-20 md:pt-44 md:pb-20 flex flex-col justify-between overflow-hidden">
      {/* Cartographic mark — subtle background art with parallax + fade-in */}
      <div
        ref={markRef}
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
        style={{
          backgroundImage: `url(${heroMark})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
          maskImage:
            "radial-gradient(ellipse 75% 70% at 70% 45%, black 0%, black 35%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 70% at 70% 45%, black 0%, black 35%, transparent 85%)",
          mixBlendMode: "multiply",
          opacity: entered ? `calc(var(--mark-fade, 1) * 0.26)` : 0,
          transition: "opacity 1800ms var(--ease-publication)",
        }}
      />
      {/* Soft mesh tint over the mark */}
      <div className="absolute inset-0 z-0 pointer-events-none hero-mesh" />
      {/* Paper wash to keep type crisp */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, var(--paper) 0%, transparent 18%, transparent 78%, var(--paper) 100%)",
        }}
      />
      <Wrap className="relative z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="eyebrow-rise font-mono text-xs tracking-[0.12em] uppercase text-ink-mute flex items-center gap-3.5">
            <span className="w-7 h-px bg-ink-mute" />
            London · Dubai · Riyadh · Abu Dhabi
          </div>

          <h1
            className="font-display font-light leading-[0.95] tracking-[-0.035em] mt-7 text-ink"
            style={{ fontSize: "clamp(48px, 9vw, 148px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
          >
            <span className="title-line">
              <span style={{ animationDelay: "350ms" }}>People, law,</span>
            </span>
            <span className="title-line">
              <span style={{ animationDelay: "480ms" }}>and the work</span>
            </span>
            <span className="title-line">
              <span
                style={{ animationDelay: "610ms" }}
              >
                of hiring{" "}
                <em
                  className="italic font-light text-accent"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
                >
                  well.
                </em>
              </span>
            </span>
          </h1>
        </div>

        <div className="foot-rise grid md:grid-cols-[1fr_auto_1fr] items-end gap-12 mt-20 pt-8 border-t border-rule">
          <p className="max-w-[380px] m-0 text-ink-soft text-base">
            An independent HR consultancy, executive search firm, and UK employment law practice — built for companies that take the people decision seriously.
          </p>
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute flex items-center gap-2.5 md:justify-self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            Scroll
          </div>
          <div className="md:text-right font-mono text-xs tracking-[0.08em] uppercase text-ink-mute">
            Est. London — WC2A
          </div>
        </div>
      </Wrap>
    </section>
  );
}

function Marquee() {
  const items = [
    "HR Consultancy",
    "Executive Search",
    "UK Employment Law",
    "Middle East Recruitment",
    "Workforce Strategy",
    "Compliance & TUPE",
  ];
  const row = (
    <span className="flex items-center gap-20">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-20">
          {it}
          <span className="text-accent">·</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className="border-t border-b border-rule py-6 overflow-hidden bg-paper">
      <div
        className="flex gap-20 whitespace-nowrap marquee-track font-display italic font-light text-ink-soft text-[22px]"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
      >
        {row}
        {row}
      </div>
    </div>
  );
}

function Approach() {
  const items = [
    {
      idx: "i.",
      title: "We sit on your side of the table.",
      body: "No commissions. No preferred vendors. Just aligned advice — in writing, on the record, and grounded in what we see day to day.",
      tag: "Independent",
    },
    {
      idx: "ii.",
      title: (
        <>
          Employment law is the <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>starting point</em>, not the afterthought.
        </>
      ),
      body: "Every recruitment and HR engagement is checked against UK statute and case law before it ships. The mistakes we prevent are the ones you never have to read about.",
      tag: "Compliant",
    },
    {
      idx: "iii.",
      title: (
        <>
          Discretion is the <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>default</em>.
        </>
      ),
      body: "Our best work rarely appears on our website. Senior searches, sensitive exits, cross-border restructuring — handled quietly and in one place.",
      tag: "Confidential",
    },
    {
      idx: "iv.",
      title: "Written by humans. Drafted by specialists.",
      body: "Contracts, policies, offer letters and process documents that hold up when you actually need them to — because a real practitioner wrote them.",
      tag: "Expertise",
    },
  ];

  return (
    <section className="py-20 md:py-32 lg:py-40">
      <Wrap>
        <Reveal>
          <SectionHead
            number="01 — Approach"
            title={
              <>
                A quieter way to{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                  build teams.
                </em>
              </>
            }
            lede="We work with a small number of clients at a time. Each engagement begins by listening — to your business, your obligations, and the gap between the team you have and the one you need."
          />
        </Reveal>

        <Reveal stagger>
          <ul className="list-none p-0 m-0">
            {items.map((it, i) => (
              <li
                key={i}
                className={`grid md:grid-cols-[80px_1fr_2fr_auto] gap-x-10 gap-y-3 items-start py-9 border-t border-rule ${
                  i === items.length - 1 ? "border-b border-rule" : ""
                } transition-[padding] duration-400 hover:px-3 [transition-timing-function:var(--ease-publication)]`}
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
  );
}

function Services() {
  return (
    <section className="py-20 md:py-32 lg:py-40 bg-paper-deep">
      <Wrap>
        <Reveal>
          <SectionHead
            number="02 — Services"
            title={
              <>
                Four practices,{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                  one team.
                </em>
              </>
            }
            lede="We don't refer you out. Advisory, recruitment, and employment law sit in the same building — which is why our clients stop juggling three firms and just call us."
          />
        </Reveal>

        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <ServiceCard featured num="/ 01" eyebrow="Practice one" title={<>HR Consultancy <em className="italic" style={{ color: "#A9B8E0", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>in residence.</em></>} body="Fractional HR leadership for scaling companies and a second set of eyes for those with a function in place. Policy design, performance frameworks, restructures, investigations, and the quiet strategic work in between." className="md:col-span-7" />
            <ServiceCard num="/ 02" eyebrow="Practice two" title={<>Executive <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>search.</em></>} body="Retained search for leadership and specialist roles where the wrong hire is expensive. Mapped markets, discreet approaches, structured assessment." className="md:col-span-5" />
            <ServiceCard num="/ 03" eyebrow="Practice three" title={<>UK <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>employment law.</em></>} body={'Contracts, handbooks, TUPE, settlement agreements, and day-to-day advice. Practical answers — not a memo that ends in "it depends".'} className="md:col-span-5" />
            <ServiceCard num="/ 04" eyebrow="Practice four" title={<>Recruitment across the <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>Middle East.</em></>} body="A London practice with a working knowledge of the GCC labour market. We help UK businesses hire into the region — and regional businesses hire the UK talent they actually want." className="md:col-span-7" />
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
      className={`relative rounded-[22px] p-9 overflow-hidden min-h-[380px] flex flex-col justify-between border transition-all duration-600 hover:-translate-y-1 ${
        featured
          ? "bg-ink text-paper border-ink min-h-[460px]"
          : "bg-paper border-rule hover:border-ink hover:shadow-[0_30px_60px_-30px_rgba(17,17,16,0.18)]"
      } ${className} [transition-timing-function:var(--ease-publication)]`}
    >
      {featured && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 80% 10%, rgba(169,184,224,0.15), transparent 50%)" }}
        />
      )}
      <span
        className={`absolute top-7 right-8 font-mono text-[11px] tracking-[0.1em] ${
          featured ? "text-paper/40" : "text-ink-mute"
        }`}
      >
        {num}
      </span>
      <div className="relative">
        <div
          className={`font-mono text-[11px] tracking-[0.12em] uppercase ${
            featured ? "text-paper/55" : "text-ink-mute"
          }`}
        >
          {eyebrow}
        </div>
        <h3
          className="font-display font-light leading-[1.02] tracking-[-0.02em] mt-4 mb-4 max-w-[14ch]"
          style={{ fontSize: "clamp(28px, 3.2vw, 42px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          {title}
        </h3>
        <p className={`m-0 text-[15.5px] leading-[1.55] max-w-[42ch] ${featured ? "text-paper/70" : "text-ink-soft"}`}>
          {body}
        </p>
      </div>
      <Link
        to="/services"
        className="relative inline-flex items-center gap-2.5 mt-7 text-sm border-b border-current pb-[3px] w-fit transition-[gap] duration-250 hover:gap-4 [transition-timing-function:var(--ease-publication)]"
      >
        Explore →
      </Link>
    </div>
  );
}

function Reach() {
  return (
    <section className="py-20 md:py-32 lg:py-40">
      <Wrap>
        <Reveal>
          <SectionHead
            number="03 — Reach"
            title={
              <>
                Rooted in London. Working across the{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                  Gulf.
                </em>
              </>
            }
            lede="Most of our clients want one firm that understands both sides of the corridor between the UK and the Middle East. That's what we're built to be."
          />
        </Reveal>

        <Reveal>
          <div className="grid md:grid-cols-[5fr_7fr] gap-12 lg:gap-24 items-center">
            <div className="rounded-[18px] bg-paper border border-rule relative overflow-hidden aspect-[5/4]">
              <ReachSvg />
            </div>
            <div>
              <div className="font-mono text-xs tracking-[0.15em] uppercase text-ink-mute">Geography</div>
              <h3
                className="font-display font-light leading-[1] tracking-[-0.025em] mt-4 mb-6 max-w-[16ch]"
                style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
              >
                One firm.{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                  Two markets.
                </em>{" "}
                One point of contact.
              </h3>
              <p className="text-ink-soft text-[17px] leading-[1.55] max-w-[50ch] m-0 mb-8">
                The UK–Gulf hiring corridor is busy, lucrative, and full of firms who only understand one end of it. We work on both — with practitioners in London and a working network across the UAE, Saudi Arabia, and the wider GCC.
              </p>
              <dl className="grid grid-cols-2 gap-x-12 gap-y-8 pt-8 border-t border-rule m-0">
                <Stat value={<>14<em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>+</em></>} label="Years combined practice" />
                <Stat value="6" label="GCC markets covered" />
                <Stat value="100%" label="Retained engagements" />
                <Stat value="1" label="Firm. One invoice." />
              </dl>
            </div>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <dt
        className="font-display font-light tracking-[-0.03em] leading-[1] m-0"
        style={{ fontSize: "clamp(36px, 4vw, 52px)", fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
      >
        {value}
      </dt>
      <dd className="m-0 mt-2 text-sm text-ink-mute font-mono uppercase tracking-[0.08em]">{label}</dd>
    </div>
  );
}

function ReachSvg() {
  return (
    <svg viewBox="0 0 500 400" className="w-full h-full">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-rule" />
        </pattern>
      </defs>
      <rect width="500" height="400" fill="url(#grid)" />

      {/* connecting arc */}
      <path
        d="M 110 150 Q 250 60 380 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 4"
        className="text-accent"
      />

      {/* London */}
      <circle cx="110" cy="150" r="6" className="fill-accent" />
      <circle cx="110" cy="150" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-accent opacity-50" />
      <text x="125" y="148" className="fill-ink font-mono text-[10px]" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
        LONDON
      </text>
      <text x="125" y="162" className="fill-ink-mute font-mono" style={{ fontSize: 9 }}>
        51.5°N · 0.1°W
      </text>

      {/* Dubai / Abu Dhabi */}
      <circle cx="380" cy="200" r="6" className="fill-accent" />
      <circle cx="380" cy="200" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-accent opacity-50" />
      <text x="270" y="198" className="fill-ink font-mono" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
        DUBAI · ABU DHABI
      </text>
      <text x="296" y="212" className="fill-ink-mute font-mono" style={{ fontSize: 9 }}>
        25.2°N · 55.2°E
      </text>

      {/* legend */}
      <text x="20" y="380" className="fill-ink-mute font-mono" style={{ fontSize: 9, letterSpacing: "0.15em" }}>
        FIG. 001 — REACH
      </text>
      <text x="420" y="380" className="fill-ink-mute font-mono" style={{ fontSize: 9, letterSpacing: "0.15em" }}>
        SCALE NONE
      </text>
    </svg>
  );
}

function Pull() {
  return (
    <section className="py-20 md:py-32 lg:py-36 bg-paper-deep">
      <Wrap>
        <Reveal>
          <div className="max-w-[1100px] mx-auto">
            <blockquote
              className="font-display font-light leading-[1.1] tracking-[-0.025em] m-0 text-ink"
              style={{ fontSize: "clamp(28px, 4.2vw, 60px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
            >
              "The best HR work is{" "}
              <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                invisible.
              </em>{" "}
              You don't see the cases that never became cases — only the team that kept growing while nothing went wrong."
            </blockquote>
            <div className="mt-10 flex items-center gap-4 font-mono text-xs tracking-[0.1em] uppercase text-ink-mute">
              <span className="w-8 h-px bg-ink-mute" />
              From the practice notes, 2025
            </div>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

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
            number="04 — Sectors"
            title={
              <>
                Where the work{" "}
                <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                  tends to land.
                </em>
              </>
            }
            lede="We're generalist by training and sector-fluent by experience. These are the industries that come back the most — we don't claim every one as a specialism."
          />
        </Reveal>

        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-rule">
            {sectors.map((s, i) => (
              <div
                key={s}
                className={`py-9 pr-7 border-b border-rule ${
                  (i + 1) % 3 !== 0 ? "md:border-r border-rule" : ""
                } transition-all duration-400 hover:bg-paper-deep hover:pl-4 cursor-default [transition-timing-function:var(--ease-publication)]`}
              >
                <div className="font-mono text-[11px] text-ink-mute tracking-[0.1em]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h4
                  className="font-display font-normal leading-[1.1] tracking-[-0.02em] mt-3 m-0 text-[26px]"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
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

function ContactCTA() {
  return (
    <section className="bg-ink text-paper py-24 md:py-36 lg:py-48 relative overflow-hidden">
      <span className="absolute inset-0 contact-mesh pointer-events-none" />
      <Wrap className="relative z-10">
        <div className="grid md:grid-cols-[6fr_5fr] gap-12 md:gap-24">
          <div>
            <div className="font-mono text-xs tracking-[0.15em] uppercase text-paper/50">
              05 — Contact
            </div>
            <h2
              className="font-display font-extralight leading-[0.98] tracking-[-0.035em] mt-4 mb-8"
              style={{ fontSize: "clamp(44px, 6.5vw, 96px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
            >
              Tell us about the people problem{" "}
              <em
                className="italic"
                style={{ color: "#A9B8E0", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
              >
                in front of you.
              </em>
            </h2>

            <div className="flex flex-col gap-7 mt-10">
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
    <div className="py-6 border-t border-paper/15 last:border-b">
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-paper/50 mb-2.5">
        {label}
      </div>
      <div
        className="font-display font-light leading-[1.2] tracking-[-0.015em] inline-flex items-center gap-3 transition-[gap] duration-300"
        style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block group hover:[&>div>div]:gap-5">
      {inner}
    </a>
  ) : (
    inner
  );
}

function ContactForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-paper/5 border border-paper/10 rounded-[22px] p-9 backdrop-blur-md"
    >
      <h3
        className="font-display font-light text-[26px] tracking-[-0.02em] leading-[1.1] m-0 mb-2"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        A short, quiet form.
      </h3>
      <p className="text-paper/60 text-sm m-0 mb-7">
        We read every message. A real person replies, usually within one working day.
      </p>

      {[
        { label: "Your name", id: "name", type: "text" },
        { label: "Email", id: "email", type: "email" },
        { label: "Company", id: "company", type: "text" },
      ].map((f) => (
        <div key={f.id} className="mb-5">
          <label htmlFor={f.id} className="block font-mono text-[11px] tracking-[0.1em] uppercase text-paper/50 mb-2">
            {f.label}
          </label>
          <input
            id={f.id}
            type={f.type}
            className="w-full bg-transparent border-0 border-b border-paper/20 py-2.5 font-body text-base text-paper outline-none focus:border-b-[#A9B8E0] transition-colors"
          />
        </div>
      ))}

      <div className="mb-5">
        <label htmlFor="msg" className="block font-mono text-[11px] tracking-[0.1em] uppercase text-paper/50 mb-2">
          What are you working on?
        </label>
        <textarea
          id="msg"
          className="w-full bg-transparent border-0 border-b border-paper/20 py-2.5 font-body text-base text-paper outline-none focus:border-b-[#A9B8E0] transition-colors resize-y min-h-[80px]"
        />
      </div>

      <button
        type="submit"
        className="mt-4 w-full bg-paper text-ink border-0 px-6 py-[18px] font-body text-[15px] font-medium tracking-[-0.005em] rounded-full cursor-pointer transition-all duration-300 hover:bg-[#A9B8E0] hover:-translate-y-px [transition-timing-function:var(--ease-publication)]"
      >
        Send enquiry
      </button>
    </form>
  );
}
