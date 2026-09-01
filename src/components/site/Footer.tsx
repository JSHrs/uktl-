import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-paper pt-15 pb-10 border-t border-rule" style={{ paddingTop: 60, paddingBottom: 40 }}>
      <div className="w-full max-w-[1440px] mx-auto" style={{ paddingLeft: "clamp(24px, 5vw, 72px)", paddingRight: "clamp(24px, 5vw, 72px)" }}>
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-20">
          <div
            className="font-display font-light leading-[1] tracking-[-0.03em] max-w-[10ch]"
            style={{ fontSize: "clamp(32px, 5vw, 56px)", fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
          >
            UK Talent <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>Link.</em>
          </div>

          <FooterCol title="Practice">
            <FooterLink to="/services">Consultancy</FooterLink>
            <FooterLink to="/services">Executive search</FooterLink>
            <FooterLink to="/services">Employment law</FooterLink>
            <FooterLink to="/services">GCC recruitment</FooterLink>
          </FooterCol>

          <FooterCol title="Firm">
            <FooterLink to="/approach">Approach</FooterLink>
            <FooterLink to="/sectors">Sectors</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Elsewhere">
            <li><a href="#" className="text-[15px] text-ink-soft hover:text-ink transition-colors">LinkedIn</a></li>
            <li><a href="mailto:info@uktalentlink.co.uk" className="text-[15px] text-ink-soft hover:text-ink transition-colors">Email</a></li>
            <li><a href="tel:+442071892857" className="text-[15px] text-ink-soft hover:text-ink transition-colors">Phone</a></li>
          </FooterCol>
        </div>

        <div className="pt-8 border-t border-rule flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-[11px] text-ink-mute tracking-[0.08em] uppercase">
          <span>© 2026 UK Talent Link Ltd.</span>
          <span>Chancery Lane, London</span>
          <span>Privacy · Terms</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute m-0 mb-5 font-medium">{title}</h5>
      <ul className="list-none p-0 m-0 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-[15px] text-ink-soft hover:text-ink transition-colors">
        {children}
      </Link>
    </li>
  );
}
