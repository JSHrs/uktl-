import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const links = [
  { to: "/approach", label: "Approach" },
  { to: "/services", label: "Services" },
  { to: "/sectors", label: "Sectors" },
  { to: "/contact", label: "Contact" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const routerState = useRouterState();
  const isApp = routerState.location.pathname.startsWith("/app") || routerState.location.pathname.startsWith("/auth");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (isApp) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between transition-all duration-[400ms] [transition-timing-function:var(--ease-publication)] ${
        scrolled
          ? "py-3 bg-paper/90 backdrop-blur-xl backdrop-saturate-150 border-b border-rule shadow-[0_1px_0_0_var(--color-rule)]"
          : "py-5 bg-transparent border-b border-transparent"
      }`}
      style={{ paddingLeft: "clamp(20px, 4.5vw, 64px)", paddingRight: "clamp(20px, 4.5vw, 64px)" }}
    >
      {/* Wordmark */}
      <Link
        to="/"
        onClick={() => setOpen(false)}
        className="font-display text-[19px] font-medium tracking-[-0.025em] text-ink shrink-0"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
      >
        UK Talent{" "}
        <em className="not-italic font-normal text-ink-soft italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
          Link
        </em>
      </Link>

      {/* Desktop nav */}
      <ul className="hidden md:flex gap-7 items-center list-none p-0 m-0">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-[13px] text-ink-mute hover:text-ink transition-colors relative group"
              activeProps={{ className: "text-[13px] text-ink" }}
            >
              {l.label}
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-ink transition-[width] duration-300 group-hover:w-full [transition-timing-function:var(--ease-publication)]" />
            </Link>
          </li>
        ))}
        <li>
          <div className="w-px h-4 bg-rule mx-1" aria-hidden="true" />
        </li>
        <li>
          <Link
            to="/auth/login"
            className="text-[13px] text-ink-mute hover:text-ink transition-colors"
          >
            Sign in
          </Link>
        </li>
        <li>
          <Link
            to="/app"
            className="text-[13px] px-4 py-2 bg-ink text-paper rounded-full transition-all duration-300 hover:opacity-80 [transition-timing-function:var(--ease-publication)]"
          >
            Talent Compass →
          </Link>
        </li>
      </ul>

      {/* Mobile burger */}
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden bg-transparent border-0 p-2 cursor-pointer -mr-2 flex flex-col justify-center gap-[5px]"
      >
        <span className={`block w-5 h-px bg-ink transition-all duration-300 origin-center ${open ? "translate-y-[6px] rotate-45" : ""}`} />
        <span className={`block w-5 h-px bg-ink transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} />
        <span className={`block w-5 h-px bg-ink transition-all duration-300 origin-center ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-paper z-[99] overflow-y-auto">
          <div className="flex flex-col" style={{ padding: "clamp(20px, 4.5vw, 64px)" }}>
            <ul className="list-none p-0 m-0 border-t border-rule">
              {links.map((l) => (
                <li key={l.to} className="border-b border-rule">
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-5 text-ink"
                    activeProps={{ className: "flex items-center justify-between py-5 text-accent" }}
                  >
                    <span
                      className="font-display font-light tracking-[-0.02em]"
                      style={{ fontSize: "clamp(24px, 5vw, 36px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {l.label}
                    </span>
                    <span className="text-ink-mute text-xl">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3">
              <Link
                to="/app"
                onClick={() => setOpen(false)}
                className="w-full text-center text-[14px] px-6 py-4 bg-ink text-paper rounded-full"
              >
                Open Talent Compass →
              </Link>
              <Link
                to="/auth/login"
                onClick={() => setOpen(false)}
                className="w-full text-center text-[14px] px-6 py-4 border border-rule text-ink-soft rounded-full"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-auto pt-12">
              <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute space-y-1">
                <div>London · Dubai · Riyadh</div>
                <div>info@uktalentlink.co.uk</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
