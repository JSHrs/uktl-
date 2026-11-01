import { Link, useRouter, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { signOutFn } from "@/lib/functions";
import { setAudience, setTheme, useAudience, useTheme, type Audience } from "@/lib/preferences";

type NavLink = { to: "/services" | "/employers" | "/approach" | "/sectors" | "/reach" | "/contact"; label: string };

/** Per-audience navigation from the Claude Design handoff. */
const LINKS: Record<Audience, NavLink[]> = {
  candidate: [
    { to: "/services", label: "What we offer" },
    { to: "/approach", label: "How it works" },
    { to: "/sectors", label: "Sectors" },
    { to: "/reach", label: "Reach" },
    { to: "/contact", label: "Contact" },
  ],
  employer: [
    { to: "/employers", label: "Services" },
    { to: "/approach", label: "How we search" },
    { to: "/sectors", label: "Sectors" },
    { to: "/reach", label: "Reach" },
    { to: "/contact", label: "Contact" },
  ],
};

const AUDIENCES: Audience[] = ["candidate", "employer"];
const AUDIENCE_LABEL: Record<Audience, string> = { candidate: "Candidate", employer: "Employer" };

/**
 * The one header for the public site, the candidate area and the sign-in pages:
 * an ink audience bar ("I'm viewing as Candidate | Employer") above the nav.
 * `overlay` floats over page heroes and turns solid after 30px of scroll;
 * `solid` is a sticky bar for the sign-in pages. Signed-in visitors get their
 * account (or the staff dashboard) instead of the sign-up call to action.
 */
export function Nav({ variant = "overlay" }: { variant?: "overlay" | "solid" }) {
  const { session } = useRouteContext({ from: "__root__" });
  const router = useRouter();
  const audience = useAudience();
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const signedIn = !!session.userId;
  const isStaff = session.isStaff;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setOpen(false);
    await signOutFn();
    toast("Signed out");
    await router.navigate({ to: "/" });
    await router.invalidate();
  }

  const solid = variant === "solid" || scrolled || open;
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className={`${variant === "solid" ? "sticky" : "fixed"} top-0 left-0 right-0 z-[100]`}>
      {/* Audience bar */}
      <div
        className="flex items-center justify-between gap-4 bg-ink text-paper text-[12px] py-1.5"
        style={{ paddingLeft: "var(--gut)", paddingRight: "var(--gut)" }}
      >
        <div className="flex items-center gap-1" role="group" aria-label="Show the site for">
          <span className="hidden sm:inline font-mono text-[10px] tracking-[0.14em] uppercase opacity-60 mr-2">
            I'm viewing as
          </span>
          {AUDIENCES.map((a) => (
            <button
              key={a}
              type="button"
              data-set={a}
              aria-pressed={audience === a}
              onClick={() => setAudience(a)}
              className="ubar-btn"
            >
              {AUDIENCE_LABEL[a]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[18px] font-mono text-[10px] tracking-[0.12em] uppercase opacity-70">
          <a href="tel:+442071892857" className="hidden sm:inline hover:opacity-100 hover:text-paper">
            +44 (0)20 7189 2857
          </a>
          <span>London · Dubai</span>
        </div>
      </div>

      <nav
        aria-label="Main"
        className={`flex items-center justify-between gap-6 border-b transition-[padding,background-color,border-color] duration-[400ms] [transition-timing-function:var(--ease)] ${
          solid
            ? open
              ? "py-2.5 bg-paper border-rule"
              : "py-2.5 bg-paper/90 backdrop-blur-xl backdrop-saturate-150 border-rule"
            : "py-4 bg-transparent border-transparent"
        }`}
        style={{ paddingLeft: "var(--gut)", paddingRight: "var(--gut)" }}
      >
        <Logo onClick={() => setOpen(false)} />

        <ul className="hidden min-[901px]:flex gap-7 items-center list-none p-0 m-0">
          {AUDIENCES.flatMap((a) => LINKS[a].map((l) => ({ ...l, a }))).map((l) => (
            <li key={`${l.a}${l.to}`} data-only={l.a}>
              <Link
                to={l.to}
                className="nav-link text-[13px] text-ink-mute hover:text-ink transition-colors"
                activeProps={{ className: "text-ink" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 sm:gap-5">
          <ThemeButton theme={nextTheme} />
          <span className="hidden min-[901px]:block w-px h-4 bg-rule" aria-hidden="true" />
          {signedIn ? (
            <>
              <button
                type="button"
                onClick={signOut}
                className="hidden min-[901px]:inline text-[13px] text-ink-mute hover:text-ink transition-colors"
              >
                Sign out
              </button>
              <Link
                to={isStaff ? "/admin" : session.accountRole === "employer" ? "/employer" : "/app"}
                title={session.email ?? undefined}
                className="hidden min-[561px]:inline-flex btn-ink-sm"
              >
                {isStaff ? "Staff dashboard" : "My account"}
              </Link>
            </>
          ) : (
            <>
              <span className="hidden min-[901px]:inline text-[13px] text-ink-mute">
                <Link to="/auth/login" data-only="candidate" className="hover:text-ink transition-colors">
                  Sign in
                </Link>
                <Link to="/auth/login" data-only="employer" className="hover:text-ink transition-colors">
                  Client sign in
                </Link>
              </span>
              <span className="hidden min-[561px]:inline-flex">
                <Link to="/onboarding" search={{ for: "candidate", step: 1 }} data-only="candidate" className="btn-ink-sm">
                  Register free
                </Link>
                <Link to="/onboarding" search={{ for: "employer", step: 1 }} data-only="employer" className="btn-ink-sm">
                  Start hiring
                </Link>
              </span>
            </>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
            className="min-[901px]:hidden p-2 -mr-2 flex flex-col justify-center gap-[5px]"
          >
            <span className={`block w-5 h-px bg-ink transition-transform duration-300 ${open ? "translate-y-[3px] rotate-45" : ""}`} />
            <span className={`block w-5 h-px bg-ink transition-transform duration-300 ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </button>
        </div>
        {open && (
          <div
            id="site-menu"
            className="min-[901px]:hidden fixed inset-0 -z-10 bg-paper overflow-y-auto"
          >
            <div className="min-h-full flex flex-col pt-[112px] pb-10" style={{ paddingLeft: "var(--gut)", paddingRight: "var(--gut)" }}>
              <ul className="menu-in list-none p-0 m-0">
                {AUDIENCES.flatMap((a) => LINKS[a].map((l) => ({ ...l, a }))).map((l) => (
                  <li key={`${l.a}${l.to}`} data-only={l.a} className="border-b border-rule">
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="block py-2 font-display font-light tracking-[-0.02em] text-ink"
                      activeProps={{ className: "text-accent" }}
                      style={{ fontSize: "clamp(28px, 8vw, 36px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-10 grid gap-2.5">
                <div className="aud-switch justify-self-start mb-2" role="group" aria-label="Show the site for">
                  <span className="aud-thumb" aria-hidden="true" />
                  {AUDIENCES.map((a) => (
                    <button key={a} type="button" data-set={a} aria-pressed={audience === a} onClick={() => setAudience(a)}>
                      {AUDIENCE_LABEL[a]}
                    </button>
                  ))}
                </div>
                {signedIn ? (
                  <>
                    <Link to={isStaff ? "/admin" : session.accountRole === "employer" ? "/employer" : "/app"} onClick={() => setOpen(false)} className="btn-ink-lg">
                      {isStaff ? "Staff dashboard" : "My account"}
                    </Link>
                    <button type="button" onClick={signOut} className="btn-line-lg">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/onboarding" search={{ for: "candidate", step: 1 }} data-only="candidate" onClick={() => setOpen(false)} className="btn-ink-lg">
                      Register free
                    </Link>
                    <Link to="/onboarding" search={{ for: "employer", step: 1 }} data-only="employer" onClick={() => setOpen(false)} className="btn-ink-lg">
                      Start hiring
                    </Link>
                    <Link to="/auth/login" onClick={() => setOpen(false)} className="btn-line-lg">
                      Sign in
                    </Link>
                  </>
                )}
                <a
                  href="mailto:info@uktalentlink.co.uk"
                  className="mt-4 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute"
                >
                  info@uktalentlink.co.uk
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

    </header>
  );
}

export function Logo({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={`font-display text-[19px] font-medium tracking-[-0.025em] text-ink shrink-0 whitespace-nowrap ${className}`}
      style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
    >
      UK{" "}
      <em className="italic font-normal text-ink-soft" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
        Talent
      </em>{" "}
      Link
    </Link>
  );
}

function ThemeButton({ theme }: { theme: "light" | "dark" }) {
  return (
    <button
      type="button"
      onClick={() => setTheme(theme)}
      aria-label={`Switch to ${theme} mode`}
      title={`Switch to ${theme} mode`}
      className="w-8 h-8 rounded-full border border-rule hover:border-ink grid place-items-center transition-colors duration-300 shrink-0"
    >
      <i className="theme-dot" aria-hidden="true" />
    </button>
  );
}
