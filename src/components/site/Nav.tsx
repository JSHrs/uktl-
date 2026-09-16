import { Link } from "@tanstack/react-router";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between transition-all duration-[450ms] [transition-timing-function:var(--ease-publication)] ${
        scrolled
          ? "py-3.5 bg-paper/80 backdrop-blur-xl backdrop-saturate-150 border-b border-rule"
          : "py-5 bg-transparent border-b border-transparent"
      }`}
      style={{ paddingLeft: "clamp(24px, 5vw, 72px)", paddingRight: "clamp(24px, 5vw, 72px)" }}
    >
      <Link
        to="/"
        className="font-display text-[20px] font-medium tracking-[-0.02em] text-ink"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
      >
        UK Talent <em className="not-italic font-normal text-ink-soft italic">Link</em>
      </Link>

      <ul className="hidden md:flex gap-8 items-center list-none p-0 m-0">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-ink-soft hover:text-ink transition-colors relative group"
              activeProps={{ className: "text-ink" }}
            >
              {l.label}
              <span className="absolute left-0 -bottom-1 h-px w-0 bg-ink transition-[width] duration-300 group-hover:w-full [transition-timing-function:var(--ease-publication)]" />
            </Link>
          </li>
        ))}
        <li>
          <Link
            to="/auth/login"
            className="text-[13px] text-ink-soft hover:text-ink transition-colors"
          >
            Sign in
          </Link>
        </li>
        <li>
          <Link
            to="/app"
            className="text-[13px] px-[18px] py-2 bg-ink text-paper rounded-full transition-all duration-300 hover:opacity-80 [transition-timing-function:var(--ease-publication)]"
          >
            Talent Compass →
          </Link>
        </li>
      </ul>

      <button
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden bg-transparent border-0 p-2 cursor-pointer"
      >
        <span className={`block w-[22px] h-[1.5px] bg-ink my-[5px] transition-all ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
        <span className={`block w-[22px] h-[1.5px] bg-ink my-[5px] transition-all ${open ? "opacity-0" : ""}`} />
        <span className={`block w-[22px] h-[1.5px] bg-ink my-[5px] transition-all ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <ul className="md:hidden flex flex-col gap-5 absolute top-full left-0 right-0 bg-paper p-8 border-b border-rule list-none m-0">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm text-ink-soft"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/app"
              onClick={() => setOpen(false)}
              className="text-sm text-ink"
            >
              Talent Compass →
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}
