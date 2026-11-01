import { useEffect, useRef, type ReactNode } from "react";
import type React from "react";
import { setAudience, useAudience, type Audience } from "@/lib/preferences";

/**
 * Helpers for pages built from the Claude Design handoff. Those pages render
 * inside <DesignPage>, which scopes the design classes (src/styles/design.css)
 * under `.ds` and runs the scroll reveal.
 *
 * Reveal: `.rv` content is visible by default (no-JS, thumbnails, tests). Only
 * elements still below the fold after hydration are briefly hidden and fade in
 * when scrolled to, so nothing on screen ever disappears.
 */
export function DesignPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("rv-wait");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    root.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("rv-wait");
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`ds ${className}`}>
      {children}
    </div>
  );
}

const LABELS: Record<Audience, string> = { candidate: "I'm looking for work", employer: "I'm hiring" };

/** The pill switch in page heroes. Styling follows <html data-for>, so it is right before hydration. */
export function AudienceSwitch({ labels = LABELS }: { labels?: Record<Audience, string> }) {
  const audience = useAudience();
  return (
    <div className="aud" role="group" aria-label="Show this page for">
      <span className="aud-thumb" aria-hidden="true" />
      {(["candidate", "employer"] as const).map((a) => (
        <button key={a} type="button" data-set={a} aria-pressed={audience === a} onClick={() => setAudience(a)}>
          {labels[a]}
        </button>
      ))}
    </div>
  );
}

/** Animated product preview frame. Always labelled as an example: it never shows real records. */
export function DemoFrame({ title, children, toast }: { title: string; children: ReactNode; toast?: ReactNode }) {
  return (
    <div className="demo" role="img" aria-label={`Example of ${title} in Talent Compass`}>
      <div className="demo-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>Talent Compass · {title}</span>
        <b>Example</b>
      </div>
      <div className="demo-b pad-b" aria-hidden="true">
        {children}
      </div>
      {toast && (
        <div className="d-toast ap76" aria-hidden="true">
          <i />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Marketing-page building blocks ─────────────── */

/** Page hero (`.phero`): eyebrow, display title, lede, actions, optional meta and a note. */
export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  meta,
  note,
  style,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  meta?: { label: string; value: string }[];
  note?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <header className="phero" style={style}>
      <div className="wrap">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="disp">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {actions && <div className="acts">{actions}</div>}
        {meta && (
          <div className="meta">
            {meta.map((m) => (
              <div key={m.label}>
                <span className="mono">{m.label}</span>
                <b>{m.value}</b>
              </div>
            ))}
          </div>
        )}
        {note}
      </div>
    </header>
  );
}

/** "You're viewing as …" banner shown when the page is for the other audience. */
export function AudienceBanner({ show, children, action }: { show: Audience; children: ReactNode; action: ReactNode }) {
  return (
    <div className="xbanner" data-only={show}>
      <span>{children}</span>
      {action}
    </div>
  );
}

/** Two-column article row (`.art`) with a sticky heading column. */
export function Article({
  id,
  tag,
  title,
  aside,
  children,
}: {
  id?: string;
  tag: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="art rv" id={id}>
      <div className="stick">
        <div className="tag">{tag}</div>
        <h2 className="disp">{title}</h2>
        {aside}
      </div>
      <div>{children}</div>
    </article>
  );
}

export function Ticks({ label, items, one }: { label?: string; items: string[]; one?: boolean }) {
  return (
    <>
      {label && <span className="mono-l">{label}</span>}
      <ul className={`ticks ${one ? "one" : ""}`}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </>
  );
}

/** Closing call-to-action strip on a deep background. */
export function CtaStrip({ title, body, actions }: { title: ReactNode; body: ReactNode; actions: ReactNode }) {
  return (
    <section className="sec deep bt" style={{ padding: "64px 0" }}>
      <div className="wrap cta-strip">
        <div>
          <h3 className="disp">{title}</h3>
          <p>{body}</p>
        </div>
        <div className="acts">{actions}</div>
      </div>
    </section>
  );
}

/** Section heading row (`.sh`): eyebrow + title on the left, a short paragraph on the right. */
export function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: ReactNode; body?: ReactNode }) {
  return (
    <div className="sh rv">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="disp">{title}</h2>
      </div>
      {body && <p>{body}</p>}
    </div>
  );
}
