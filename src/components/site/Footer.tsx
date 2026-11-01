import { Link, useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./Nav";

/**
 * Four-column footer from the Claude Design handoff: brand, Candidates,
 * Employers, Company, then a legal row. The Candidates column becomes the
 * visitor's own account links once signed in; staff get their tools.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const { session } = useRouteContext({ from: "__root__" });

  return (
    <footer className="bg-paper border-t border-rule">
      <div className="w-full max-w-[1440px] mx-auto" style={{ paddingLeft: "var(--gut)", paddingRight: "var(--gut)" }}>
        <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-8 gap-y-10 pt-16 pb-12">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-[13px] text-ink-mute leading-[1.6] max-w-[32ch]">
              A recruitment firm placing people in roles across the UK and the Gulf. London and Dubai.
            </p>
            <div className="mt-5 flex flex-col gap-1.5 text-[13px] text-ink-mute">
              <a href="mailto:info@uktalentlink.co.uk" className="hover:text-ink transition-colors w-fit">
                info@uktalentlink.co.uk
              </a>
              <a href="tel:+442071892857" className="hover:text-ink transition-colors w-fit">
                +44 (0)20 7189 2857
              </a>
            </div>
          </div>

          {session.isStaff ? (
            <FooterCol title="Staff">
              <FooterLink to="/admin">Staff dashboard</FooterLink>
              <FooterLink to="/app/candidates">Candidates</FooterLink>
              <FooterLink to="/app/jobs">Mandates</FooterLink>
            </FooterCol>
          ) : session.userId ? (
            <FooterCol title="Your account">
              <FooterLink to="/app">Dashboard</FooterLink>
              <FooterLink to="/app/upload">My CV</FooterLink>
              <FooterLink to="/app/discover">Job matches</FooterLink>
              <FooterLink to="/app/consultations">Consultations</FooterLink>
            </FooterCol>
          ) : (
            <FooterCol title="Candidates">
              <FooterLink to="/services">What we offer</FooterLink>
              <FooterLink to="/auth/register">Score my CV</FooterLink>
              <FooterLink to="/app/hr">Workplace guidance</FooterLink>
              <FooterLink to="/approach">How it works</FooterLink>
            </FooterCol>
          )}

          <FooterCol title="Employers">
            <FooterLink to="/approach">How we search</FooterLink>
            <FooterLink to="/contact">Start hiring</FooterLink>
            {!session.userId && <FooterLink to="/auth/register">Employer account</FooterLink>}
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink to="/sectors">Sectors</FooterLink>
            <FooterLink to="/reach">Reach</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <li>
              <a
                href="https://www.linkedin.com/company/uk-talent-link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-ink-soft hover:text-ink transition-colors"
              >
                LinkedIn
              </a>
            </li>
          </FooterCol>
        </div>

        <div className="pt-6 pb-8 border-t border-rule flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-mono text-[11px] text-ink-mute tracking-[0.07em]">
          <span>
            © {year} UK Talent Link Ltd · Chancery Lane, London · Boulevard Plaza, Dubai
          </span>
          <nav aria-label="Legal" className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <Link to="/unsubscribe" search={{ token: "" }} className="hover:text-ink transition-colors">Email preferences</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute m-0 mb-4 font-normal">{title}</h5>
      <ul className="list-none p-0 m-0 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, hash, children }: { to: string; hash?: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} hash={hash} className="text-[14px] text-ink-soft hover:text-ink transition-colors">
        {children}
      </Link>
    </li>
  );
}
