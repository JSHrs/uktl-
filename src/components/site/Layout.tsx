import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full max-w-[1440px] mx-auto ${className}`}
      style={{ paddingLeft: "clamp(24px, 5vw, 72px)", paddingRight: "clamp(24px, 5vw, 72px)" }}
    >
      {children}
    </div>
  );
}

export function SectionHead({
  number,
  title,
  lede,
}: {
  number: string;
  title: ReactNode;
  lede: ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-end mb-16 md:mb-24">
      <div>
        <div className="font-mono text-xs tracking-[0.15em] uppercase text-ink-mute">— {number}</div>
        <h2
          className="font-display font-light leading-[1] tracking-[-0.025em] mt-4 max-w-[14ch]"
          style={{ fontSize: "clamp(36px, 5.5vw, 80px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-[19px] text-ink-soft leading-[1.5] max-w-[52ch] tracking-[-0.005em]">
        {lede}
      </p>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <section className="relative pt-44 pb-20 md:pt-56 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none hero-mesh" />
      <Wrap className="relative z-10">
        <div className="font-mono text-xs tracking-[0.12em] uppercase text-ink-mute flex items-center gap-3.5">
          <span className="w-7 h-px bg-ink-mute" />
          {eyebrow}
        </div>
        <h1
          className="font-display font-light leading-[0.98] tracking-[-0.035em] mt-7 max-w-[18ch]"
          style={{ fontSize: "clamp(44px, 7vw, 112px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          {title}
        </h1>
        {lede && (
          <p className="text-[19px] md:text-[21px] text-ink-soft leading-[1.5] max-w-[58ch] mt-10">
            {lede}
          </p>
        )}
      </Wrap>
    </section>
  );
}
