import { Link } from "@tanstack/react-router";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-paper border-t border-rule">
      <div
        className="w-full max-w-[1440px] mx-auto"
        style={{ paddingLeft: "clamp(24px, 5vw, 72px)", paddingRight: "clamp(24px, 5vw, 72px)" }}
      >
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-10 pt-14 pb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div
              className="font-display font-light leading-[1] tracking-[-0.03em] max-w-[8ch] mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
            >
              UK Talent{" "}
              <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                Link.
              </em>
            </div>
            <p className="text-[13px] text-ink-mute leading-[1.6] max-w-[28ch]">
              A recruitment firm placing people in roles across the UK and the Gulf. London and Dubai.
            </p>
            <div className="mt-6 flex flex-col gap-1.5">
              <a
                href="mailto:info@uktalentlink.co.uk"
                className="text-[13px] text-ink-mute hover:text-ink transition-colors"
              >
                info@uktalentlink.co.uk
              </a>
              <a
                href="tel:+442071892857"
                className="text-[13px] text-ink-mute hover:text-ink transition-colors"
              >
                +44 (0)20 7189 2857
              </a>
            </div>
          </div>

          <FooterCol title="What we offer">
            <FooterLink to="/services" hash="cv-score">CV score</FooterLink>
            <FooterLink to="/services" hash="cv-tips">CV tips</FooterLink>
            <FooterLink to="/services" hash="matching">Job matching</FooterLink>
            <FooterLink to="/services" hash="workplace-guidance">Workplace guidance</FooterLink>
          </FooterCol>

          <FooterCol title="Firm">
            <FooterLink to="/approach">How it works</FooterLink>
            <FooterLink to="/sectors">Sectors</FooterLink>
            <FooterLink to="/reach">Reach</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Candidates">
            <FooterLink to="/auth/register">Create an account</FooterLink>
            <FooterLink to="/auth/login">Sign in</FooterLink>
            <FooterLink to="/app/upload">Upload your CV</FooterLink>
            <FooterLink to="/app/jobs">Open roles</FooterLink>
          </FooterCol>

          <FooterCol title="Elsewhere">
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
            <li>
              <a
                href="mailto:info@uktalentlink.co.uk"
                className="text-[14px] text-ink-soft hover:text-ink transition-colors"
              >
                Email
              </a>
            </li>
            <li>
              <a
                href="tel:+442071892857"
                className="text-[14px] text-ink-soft hover:text-ink transition-colors"
              >
                Phone
              </a>
            </li>
          </FooterCol>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 pb-8 border-t border-rule flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-[11px] text-ink-mute tracking-[0.07em]">
          <span>© {year} UK Talent Link Ltd. All rights reserved.</span>
          <span className="hidden sm:block">Chancery Lane, London · Boulevard Plaza, Dubai</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-ink transition-colors">Privacy</a>
            <span className="text-rule">·</span>
            <a href="#" className="hover:text-ink transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute m-0 mb-4 font-normal">{title}</h5>
      <ul className="list-none p-0 m-0 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, hash, children }: { to: string; hash?: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} hash={hash} className="text-[14px] text-ink-soft hover:text-ink transition-colors">
        {children}
      </Link>
    </li>
  );
}
