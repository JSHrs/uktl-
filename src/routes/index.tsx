import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { SiteLayout, Wrap } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import heroMark from "@/assets/hero-mark.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UK Talent Link — People, law, and the work of hiring well." },
      { name: "description", content: "London-based executive search, HR consultancy, and UK employment law practice. Independent advice, embedded compliance, and a working knowledge of the GCC market." },
      { property: "og:title", content: "UK Talent Link — People, law, and the work of hiring well." },
      { property: "og:description", content: "London-based executive search, HR consultancy, and UK employment law practice. Independent advice, embedded compliance, and a working knowledge of the GCC market." },
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
      <Services />
      <Platform />
      <Approach />
      <Sectors />
      <ContactCTA />
    </SiteLayout>
  );
}

/* ─────────────────── Hero ─────────────────── */

function Hero() {
  const markRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 100);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(reduce);
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
    <section className="relative min-h-[92vh] pt-40 pb-16 md:pt-44 md:pb-20 flex flex-col justify-between overflow-hidden">
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
      <div className="absolute inset-0 z-0 pointer-events-none hero-mesh" />
      <RouteLine animate={entered && !reduceMotion} />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, var(--paper) 0%, transparent 15%, transparent 80%, var(--paper) 100%)" }}
      />

      <Wrap className="relative z-10 flex-1 flex flex-col justify-between">
        <div className="eyebrow-rise font-mono text-[11px] tracking-[0.16em] uppercase text-ink-mute flex items-center gap-3">
          <span className="w-6 h-px bg-current" />
          London · Dubai · Riyadh · Abu Dhabi
        </div>

        <h1
          className="font-display font-light leading-[0.93] tracking-[-0.03em] mt-8 text-ink"
          style={{ fontSize: "clamp(52px, 8.5vw, 140px)", fontVariationSettings: '"opsz" 144, "SOFT" 35' }}
        >
          <span className="title-line"><span style={{ animationDelay: "320ms" }}>People, law,</span></span>
          <span className="title-line"><span style={{ animationDelay: "460ms" }}>and the work</span></span>
          <span className="title-line">
            <span style={{ animationDelay: "600ms" }}>
              of hiring{" "}
              <em className="italic font-light text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 95' }}>
                well.
              </em>
            </span>
          </span>
        </h1>

        <div className="foot-rise grid md:grid-cols-[1fr_auto_1fr] items-end gap-10 mt-20 pt-7 border-t border-rule">
          <p className="m-0 text-[15px] text-ink-soft leading-relaxed max-w-[38ch]">
            An independent HR consultancy, executive search firm, and UK employment law practice. No commissions. No preferred suppliers. Just the right answer.
          </p>
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute flex items-center gap-2 md:justify-self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-mute pulse-dot" />
            Scroll
          </div>
          <div className="flex items-center gap-3 md:justify-end flex-wrap">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 border border-rule text-ink rounded-full hover:border-ink transition-colors"
            >
              Start a conversation
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-80 transition-opacity"
            >
              Upload your CV →
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
    "GCC Recruitment",
    "Workforce Strategy",
    "TUPE & Compliance",
    "Talent Intelligence",
    "Cross-Border Placements",
  ];
  const row = (
    <span className="flex items-center gap-14">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-14">
          {it}
          <span className="w-1 h-1 rounded-full bg-accent inline-block flex-shrink-0" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="border-t border-b border-rule py-[18px] overflow-hidden bg-paper">
      <div
        className="flex gap-14 whitespace-nowrap marquee-track hover:[animation-play-state:paused] font-display font-light text-[17px] text-ink-soft"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70', letterSpacing: "-0.01em" }}
      >
        {row}{row}
      </div>
    </div>
  );
}

/* ─────────────────── Services ─────────────────── */

const SERVICES = [
  {
    num: "01",
    title: "HR Consultancy",
    body: "Fractional HR leadership and embedded advisory for scaling companies. Policy design, restructures, TUPE, investigations, and performance frameworks — delivered by practitioners who stay long enough to see the results.",
    link: "/services",
  },
  {
    num: "02",
    title: "Executive Search",
    body: "Retained search for senior and board-level appointments where the wrong hire is expensive. Mapped markets, discreet approaches, structured assessment — with employment law built in from the first brief.",
    link: "/services",
  },
  {
    num: "03",
    title: "UK Employment Law",
    body: "Contracts, handbooks, settlement agreements, TUPE, and day-to-day advice. Practical answers from specialists who write the documents themselves, not a memo that ends in 'it depends'.",
    link: "/services",
  },
  {
    num: "04",
    title: "GCC Recruitment",
    body: "A London practice with a working knowledge of the Gulf labour market. We connect UK businesses hiring into the region and regional firms seeking the UK talent they actually want — handling mobility, compliance, and cultural fit.",
    link: "/services",
  },
];

function Services() {
  return (
    <section className="py-20 md:py-32">
      <Wrap>
        <Reveal>
          <div className="flex items-end justify-between gap-8 mb-16">
            <div>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                — What we do
              </div>
              <h2
                className="font-display font-light leading-[1] tracking-[-0.03em] max-w-[16ch]"
                style={{ fontSize: "clamp(36px, 5vw, 68px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                <Words text="Four practices," accent="one team." />
              </h2>
            </div>
            <Link
              to="/services"
              className="hidden md:inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-0.5 shrink-0"
            >
              All services →
            </Link>
          </div>
        </Reveal>

        <Reveal stagger>
          <div className="grid md:grid-cols-2 border-t border-rule">
            {SERVICES.map((s, i) => (
              <Link
                key={s.num}
                to={s.link}
                className={`group relative p-8 md:p-10 border-b border-rule hover:bg-paper-deep transition-colors duration-500 after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-ink after:origin-left after:scale-x-0 after:transition-transform after:duration-700 after:[transition-timing-function:var(--ease-publication)] hover:after:scale-x-100 ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute group-hover:text-accent transition-colors duration-500 mb-6">
                  {s.num}
                </div>
                <h3
                  className="font-display font-light leading-[1.05] tracking-[-0.02em] mb-4 text-ink"
                  style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  {s.title}
                </h3>
                <p className="text-[15px] text-ink-soft leading-[1.6] m-0 max-w-[46ch]">{s.body}</p>
                <div className="mt-6 text-[13px] text-ink-mute group-hover:text-ink transition-colors duration-500">
                  Learn more{" "}
                  <span className="inline-block transition-transform duration-500 [transition-timing-function:var(--ease-publication)] group-hover:translate-x-1.5">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </Wrap>
    </section>
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
    { n: "01", title: "Upload", desc: "PDF, DOCX, or plain text. Stored privately — never accessible publicly.", glyph: "↑" },
    { n: "02", title: "Extract", desc: "Claude reads the document and outputs a full structured profile.", glyph: "◎" },
    { n: "03", title: "Normalise", desc: "Canonical skill taxonomy. 'ReactJS' and 'React.js' resolve to one entry.", glyph: "≡" },
    { n: "04", title: "Grade", desc: "CV quality scored 0–100 with per-section breakdown and improvement notes.", glyph: "◈" },
    { n: "05", title: "Match", desc: "Ranked against every open mandate. Scores update when mandates change.", glyph: "→" },
  ];

  return (
    <section
      ref={ref}
      className="bg-ink text-paper py-24 md:py-40 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, var(--paper) 0, var(--paper) 1px, transparent 1px, transparent 56px), repeating-linear-gradient(90deg, var(--paper) 0, var(--paper) 1px, transparent 1px, transparent 56px)",
        }}
      />

      <Wrap className="relative z-10">
        <Reveal>
          <div className="flex items-start justify-between gap-10 flex-col md:flex-row">
            <div className="md:max-w-[48ch]">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/40 mb-5 flex items-center gap-3">
                <span className="w-6 h-px bg-paper/40" />
                Talent Compass — Intelligence Platform
              </div>
              <h2
                className="font-display font-light leading-[0.95] tracking-[-0.025em]"
                style={{ fontSize: "clamp(36px, 5vw, 72px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                <Words text="One upload." accent="Full intelligence." accentColor="oklch(0.765 0.055 263)" />
              </h2>
              <p className="text-paper/50 text-[15px] leading-relaxed max-w-[48ch] mt-5">
                Upload your CV once. In under a minute it is read, scored with specific tips to improve it, and matched against every role we are recruiting for — and a consultant sees the strongest matches first.
              </p>
            </div>
            <div className="md:shrink-0 md:pt-2">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 border border-paper/20 text-paper/70 rounded-full hover:border-paper/60 hover:text-paper transition-colors"
              >
                Upload your CV →
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="mt-20 md:mt-24">
          <div className="relative h-px bg-paper/10" aria-hidden="true">
            <div
              className="absolute inset-y-0 left-0 w-full bg-paper/50 origin-left"
              style={{
                transform: active ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 1800ms var(--ease-publication) 150ms",
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`pt-8 pr-6 pb-8 transition-all duration-700 [transition-timing-function:var(--ease-publication)] ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${i < steps.length - 1 ? "md:border-r md:border-paper/10" : ""}`}
                style={{ transitionDelay: active ? `${300 + i * 140}ms` : "0ms" }}
              >
                <div className="font-mono text-[10px] text-paper/30 tracking-[0.1em] mb-6">{step.n}</div>
                <div
                  className={`font-mono text-[20px] text-paper/25 mb-5 leading-none transition-all duration-700 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                  style={{ transitionDelay: active ? `${500 + i * 140}ms` : "0ms" }}
                >
                  {step.glyph}
                </div>
                <div
                  className="font-display font-light text-paper leading-tight mb-3"
                  style={{ fontSize: "clamp(18px, 1.8vw, 24px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  {step.title}
                </div>
                <p className="text-[13px] text-paper/45 leading-relaxed m-0">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Approach ─────────────────── */

const PRINCIPLES = [
  {
    tag: "Independent",
    title: "We sit on your side of the table.",
    body: "No commissions. No preferred suppliers. No referral arrangements that compromise the advice. Just the right call — documented, on the record, and grounded in daily market practice.",
  },
  {
    tag: "Compliant",
    title: "Law first, not an afterthought.",
    body: "Every search, every hire, every restructure is reviewed against UK statute and current case law before it moves. The mistakes we prevent are the ones you never read about in a tribunal award.",
  },
  {
    tag: "Selective",
    title: "A small number of clients at a time.",
    body: "Our model is deliberate. Fewer engagements, partner-led delivery, deeper relationships. You'll know who is making the calls and writing the documents — not an account manager managing a team you've never met.",
  },
];

function Approach() {
  return (
    <section className="py-20 md:py-32 border-t border-rule">
      <Wrap>
        <div className="grid md:grid-cols-[2fr_3fr] gap-16 md:gap-24 items-start">
          <Reveal>
            <div className="md:sticky md:top-32">
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                — Approach
              </div>
              <h2
                className="font-display font-light leading-[1] tracking-[-0.03em]"
                style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                <Words text="A quieter way to" accent="build teams." />
              </h2>
              <p className="text-[15px] text-ink-soft mt-6 leading-[1.65] max-w-[38ch]">
                Each engagement begins by listening — to your business, your obligations, and the gap between the team you have and the one you need.
              </p>
              <Link
                to="/approach"
                className="mt-8 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-0.5"
              >
                Read the full approach →
              </Link>
            </div>
          </Reveal>

          <Reveal stagger>
            <div className="space-y-0">
              {PRINCIPLES.map((p, i) => (
                <div
                  key={i}
                  className={`py-9 ${i === 0 ? "border-t border-rule" : ""} border-b border-rule`}
                >
                  <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-mute mb-4">
                    {p.tag}
                  </div>
                  <h3
                    className="font-display font-light leading-[1.1] tracking-[-0.02em] mb-3"
                    style={{ fontSize: "clamp(20px, 2.5vw, 30px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-[15px] text-ink-soft leading-[1.6] m-0 max-w-[52ch]">{p.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Sectors ─────────────────── */

const SECTORS = [
  { name: "Financial Services", roles: "CFO · Finance Director · Head of Compliance · Investment Manager" },
  { name: "Legal & Professional", roles: "General Counsel · Head of Legal · Partner · Managing Associate" },
  { name: "Technology", roles: "CTO · VP Engineering · Head of Product · CISO" },
  { name: "Energy & Infrastructure", roles: "Country Director · Project Director · HSE Lead · Commercial Manager" },
  { name: "Healthcare & Life Sciences", roles: "Medical Director · COO · Head of Clinical Operations · CFO" },
  { name: "Construction", roles: "Contracts Director · Quantity Surveyor · Bid Manager · Site Director" },
];

function Sectors() {
  return (
    <section className="py-20 md:py-32 border-t border-rule">
      <Wrap>
        <Reveal>
          <div className="flex items-end justify-between gap-8 mb-14">
            <div>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                — Sectors
              </div>
              <h2
                className="font-display font-light leading-[1] tracking-[-0.03em] max-w-[18ch]"
                style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                <Words text="Where the work" accent="tends to land." />
              </h2>
            </div>
            <Link
              to="/sectors"
              className="hidden md:inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-0.5 shrink-0"
            >
              All sectors →
            </Link>
          </div>
        </Reveal>

        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-rule">
            {SECTORS.map((s, i) => (
              <div
                key={s.name}
                className={`group py-7 px-0 border-b border-rule ${i % 2 === 0 ? "md:pr-12" : "md:pl-12 md:border-l"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="transition-transform duration-500 [transition-timing-function:var(--ease-publication)] group-hover:translate-x-1.5">
                    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute group-hover:text-accent transition-colors duration-500 mb-2">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3
                      className="font-display font-light leading-[1.1] tracking-[-0.02em] text-ink"
                      style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {s.name}
                    </h3>
                    <p className="text-[13px] text-ink-mute group-hover:text-ink-soft transition-colors duration-500 mt-2">{s.roles}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-ink-mute text-lg opacity-0 -translate-x-2 transition-all duration-500 [transition-timing-function:var(--ease-publication)] group-hover:opacity-100 group-hover:translate-x-0 shrink-0"
                  >
                    →
                  </span>
                </div>
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
    <section className="bg-ink text-paper py-24 md:py-36 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none mesh-drift"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 80% 50%, oklch(0.285 0.075 263 / 0.3), transparent 70%), radial-gradient(ellipse 40% 40% at 15% 60%, oklch(0.285 0.075 263 / 0.15), transparent 70%)",
        }}
      />
      <Wrap className="relative z-10">
        <Reveal>
          <div className="grid md:grid-cols-[3fr_2fr] gap-16 md:gap-24 items-center">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/40 mb-6 flex items-center gap-3">
                <span className="w-6 h-px bg-paper/40" />
                Start a conversation
              </div>
              <h2
                className="font-display font-light leading-[0.97] tracking-[-0.03em]"
                style={{ fontSize: "clamp(40px, 6vw, 96px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                <Words text="Tell us about the people problem" accent="in front of you." accentColor="oklch(0.765 0.055 263)" />
              </h2>
            </div>

            <div className="flex flex-col gap-5">
              <p className="text-paper/55 text-[15px] leading-[1.6]">
                We read every message. A real person replies, usually within one working day. If you need something quickly, call us.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 text-[14px] font-medium px-6 py-3.5 bg-paper text-ink rounded-full hover:bg-accent-light transition-colors"
                >
                  Send an enquiry →
                </Link>
                <a
                  href="tel:+442071892857"
                  className="inline-flex items-center justify-center gap-2 text-[14px] px-6 py-3.5 border border-paper/20 text-paper/70 rounded-full hover:border-paper/60 hover:text-paper transition-colors"
                >
                  +44 (0)20 7189 2857
                </a>
              </div>
              <div className="pt-4 border-t border-paper/10">
                <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-paper/30 mb-2">Office</div>
                <div className="text-[14px] text-paper/50 leading-relaxed">
                  Chancery House, 53–64 Chancery Lane<br />
                  London WC2A 1QS<br />
                  <span className="text-paper/30">Also: Dubai · Abu Dhabi</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}

/* ─────────────────── Motion helpers ─────────────────── */

// Splits a heading into words that rise one by one once the enclosing <Reveal> is in view.
function Words({
  text,
  accent,
  accentColor,
}: {
  text: string;
  accent?: string;
  accentColor?: string;
}) {
  const parts = [
    ...text.split(" ").map((w) => ({ w, accent: false })),
    ...(accent ? accent.split(" ").map((w) => ({ w, accent: true })) : []),
  ];
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          <span className="word" style={{ "--i": i } as CSSProperties}>
            <span
              className={p.accent ? (accentColor ? "italic" : "italic text-accent") : undefined}
              style={
                p.accent
                  ? { color: accentColor, fontVariationSettings: '"opsz" 144, "SOFT" 100' }
                  : undefined
              }
            >
              {p.w}
            </span>
          </span>
          {i < parts.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

// London → Gulf route drawn behind the hero headline, with a traveller moving along it.
const ROUTE_PATH = "M 300 150 C 470 30, 690 120, 820 360";

function RouteLine({ animate }: { animate: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 z-0 w-full h-full pointer-events-none transition-opacity duration-[1500ms] ${animate ? "opacity-100" : "opacity-0"}`}
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="route-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--color-accent)", stopOpacity: 0 }} />
          <stop offset="0.45" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      <path d={ROUTE_PATH} stroke="url(#route-grad)" strokeWidth="1" className="route-path" />
      <g className="route-node" style={{ animationDelay: "1.1s" }}>
        <circle cx="300" cy="150" r="2.5" className="fill-accent" />
        <circle cx="300" cy="150" r="2.5" className="stroke-accent route-ring" strokeWidth="0.75" />
      </g>
      <g className="route-node" style={{ animationDelay: "3.2s" }}>
        <circle cx="820" cy="360" r="2.5" className="fill-accent" />
        <circle cx="820" cy="360" r="2.5" className="stroke-accent route-ring" strokeWidth="0.75" style={{ animationDelay: "1.5s" }} />
      </g>
      {animate && (
        <circle r="2" className="fill-accent">
          <animateMotion
            path={ROUTE_PATH}
            dur="11s"
            begin="3.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.42 0 0.58 1"
          />
        </circle>
      )}
    </svg>
  );
}
