import type { ReactNode } from "react";
import { SiteLayout } from "./Layout";
import { DesignPage, PageHero } from "./ds";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * Shared layout for the privacy and terms pages (Claude Design "Privacy.html"):
 * page hero, a sticky contents list and readable sections. Wording stays in the
 * route files and is not changed by the redesign.
 */
export function LegalPage({ eyebrow, title, lede, sections }: { eyebrow: string; title: string; lede: ReactNode; sections: LegalSection[] }) {
  return (
    <SiteLayout>
      <DesignPage>
        <PageHero eyebrow={eyebrow} title={title} lede={lede} />
        <div className="wrap legal">
          <nav aria-label="On this page">
            <span className="mono" style={{ marginBottom: 8 }}>
              On this page
            </span>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
          <div>
            {sections.map((s) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: 120 }}>
                <h2 className="disp">{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </DesignPage>
    </SiteLayout>
  );
}
