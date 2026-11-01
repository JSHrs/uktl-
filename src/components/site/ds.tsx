import { useEffect, useRef, type ReactNode } from "react";
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
