import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, Wrap, PageHero } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/approach")({
  head: () => ({
    meta: [
      { title: "Approach — UK Talent Link" },
      { name: "description", content: "Independent, compliant, confidential. The five principles behind how we advise, search, and write the employment law that holds your team together." },
      { property: "og:title", content: "Approach — UK Talent Link" },
      { property: "og:description", content: "Independent, compliant, confidential. The five principles behind how we advise, search, and write the employment law that holds your team together." },
    ],
  }),
  component: ApproachPage,
});

const principles = [
  {
    idx: "i.",
    tag: "Independent",
    title: "We sit on your side of the table.",
    body: "No commissions. No preferred suppliers. No referral arrangements with law firms, payroll providers, or software vendors. When we recommend a course of action, it's because it's the right one for your business — not because there's a margin attached to it. Our advice is documented, on the record, and tested against what we see in the market every week.",
    detail: "This matters most in executive search. The advice we give about a candidate has no financial upside for us beyond the engagement fee — so we have every reason to tell you the truth.",
  },
  {
    idx: "ii.",
    tag: "Compliant",
    title: "Employment law is the starting point, not the afterthought.",
    body: "Every recruitment engagement, every restructure, every exit is reviewed against current UK statute and case law before it moves. Employment tribunals are expensive — financially and reputationally — and most of the situations that end there were avoidable. The mistakes we prevent are the ones you never have to read about.",
    detail: "We keep a close watch on Employment Appeal Tribunal decisions and statutory guidance changes. If something relevant lands while we're working with you, you hear about it before it becomes your problem.",
  },
  {
    idx: "iii.",
    tag: "Confidential",
    title: "Discretion is the default.",
    body: "Our best work rarely appears on our website. Senior searches where a sitting post-holder doesn't yet know they're being replaced. Sensitive exits where both parties need to move on cleanly. Cross-border restructuring that requires delicacy with a regulator. These engagements happen quietly, in one place, and leave minimal footprint.",
    detail: "We don't publish case studies without explicit client consent. We don't list company names in our credentials unless we're invited to. The people who matter in our industry know us from the work, not from the marketing.",
  },
  {
    idx: "iv.",
    tag: "Expertise",
    title: "Written by humans. Drafted by specialists.",
    body: "Contracts, policies, offer letters, settlement agreements, and handbook documentation that hold up when you actually need them to — because a real practitioner wrote them, not a paralegal following a precedent that hasn't been updated since 2019. We draft. We negotiate. We stand behind our output in writing.",
    detail: "AI assists with research and drafting speed. Lawyers and HR practitioners review every document that leaves our office. The distinction matters, and we're transparent about it.",
  },
  {
    idx: "v.",
    tag: "Selective",
    title: "A small number of clients at a time.",
    body: "Our model is deliberate. Fewer engagements, deeper relationships, partner-led delivery on everything. You'll know who is making the calls, writing the documents, and speaking to the candidates. There's no account management layer between you and the people doing the work.",
    detail: "We typically carry eight to twelve active retained relationships at any time. If we can't take on your brief properly, we'll tell you — and suggest someone who can.",
  },
];

const process = [
  {
    n: "01",
    title: "Discovery call",
    body: "We begin with a 30–45 minute call — structured, not a pitch. We want to understand your business, the nature of the brief, and whether we're the right fit. If we're not, we'll say so.",
  },
  {
    n: "02",
    title: "Scoping & terms",
    body: "For retained search: a written brief, timeline, success criteria, and fee structure agreed before any work begins. For advisory: scope and deliverables confirmed in writing. No surprises.",
  },
  {
    n: "03",
    title: "Active work",
    body: "Search: market mapping, discreet approaches, structured interviews, candidate reporting. Advisory: document drafting, policy review, investigation support, or whatever the brief requires. All partner-led.",
  },
  {
    n: "04",
    title: "Decision support",
    body: "We present options with a clear recommendation. For search: a shortlist with written assessments, not just profiles. For advisory: a decision memo with legal grounding and practical implications.",
  },
  {
    n: "05",
    title: "Completion & follow-through",
    body: "Placement: offer negotiation, employment law review of the contract, onboarding support. Advisory: signed-off documentation, training if required. We're available after completion — not just until the invoice is paid.",
  },
];

function ApproachPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="01 — Approach"
        title={
          <>
            A quieter way to{" "}
            <em className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              build teams.
            </em>
          </>
        }
        lede="Each engagement begins by listening — to your business, your obligations, and the gap between the team you have and the one you need. We ask more questions than most firms at this stage. It's not due diligence theatre — it's how we stay useful."
      />

      {/* Principles */}
      <section className="py-20 md:py-28">
        <Wrap>
          <Reveal>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-10">
              — Five working principles
            </div>
          </Reveal>
          <Reveal stagger>
            <ul className="list-none p-0 m-0">
              {principles.map((it, i) => (
                <li
                  key={i}
                  className={`grid md:grid-cols-[64px_1fr_2fr] gap-x-10 gap-y-4 items-start py-10 border-t border-rule ${i === principles.length - 1 ? "border-b" : ""}`}
                >
                  <div className="font-mono text-[12px] text-ink-mute pt-1.5">{it.idx}</div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-mute mb-3">
                      {it.tag}
                    </div>
                    <h3
                      className="font-display font-light leading-[1.05] tracking-[-0.02em] m-0"
                      style={{ fontSize: "clamp(22px, 3vw, 38px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                    >
                      {it.title}
                    </h3>
                  </div>
                  <div>
                    <p className="m-0 text-[15px] text-ink-soft leading-[1.65] mb-4">{it.body}</p>
                    <p className="m-0 text-[14px] text-ink-mute leading-[1.6] pl-4 border-l-2 border-rule">{it.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </Wrap>
      </section>

      {/* Process */}
      <section className="bg-paper-deep py-20 md:py-28 border-t border-rule">
        <Wrap>
          <Reveal>
            <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-end mb-16">
              <div>
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                  — How an engagement works
                </div>
                <h2
                  className="font-display font-light leading-[1] tracking-[-0.03em]"
                  style={{ fontSize: "clamp(28px, 4vw, 52px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  From first call to completion.
                </h2>
              </div>
              <p className="text-[15px] text-ink-soft leading-[1.65] max-w-[52ch]">
                Whether it's a retained search, an HR advisory engagement, or an employment law matter, every piece of work follows the same structure: clear scope, active delivery, clean completion. No ambiguity about who does what and when.
              </p>
            </div>
          </Reveal>

          <Reveal stagger>
            <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-px bg-rule">
              {process.map((p) => (
                <div key={p.n} className="bg-paper-deep p-7">
                  <div className="font-mono text-[10px] tracking-[0.18em] text-ink-mute mb-5">{p.n}</div>
                  <h4
                    className="font-display font-light leading-tight mb-3"
                    style={{ fontSize: "clamp(18px, 1.8vw, 22px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                  >
                    {p.title}
                  </h4>
                  <p className="text-[13px] text-ink-soft leading-[1.6] m-0">{p.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* Who we work with */}
      <section className="py-20 md:py-28 border-t border-rule">
        <Wrap>
          <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
            <Reveal>
              <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
                — Who we work with
              </div>
              <h2
                className="font-display font-light leading-[1] tracking-[-0.03em]"
                style={{ fontSize: "clamp(28px, 4vw, 52px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                The right fit matters both ways.
              </h2>
            </Reveal>

            <Reveal>
              <div className="space-y-8">
                <p className="text-[16px] text-ink-soft leading-[1.65]">
                  Our clients are typically scaling businesses and established firms who need expert support without the overhead of a large retained search firm or an employment law practice on hourly billing. They value directness, written advice, and a practice that knows their sector.
                </p>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { title: "Scale-ups", body: "Series A to Series C businesses building their first leadership team or professionalising an HR function." },
                    { title: "Established firms", body: "Businesses in regulated sectors — financial services, legal, healthcare — where compliance is non-negotiable." },
                    { title: "GCC operations", body: "Regional companies bringing UK talent in, and UK businesses expanding into the Gulf." },
                  ].map((c) => (
                    <div key={c.title} className="border border-rule rounded-sm p-5">
                      <h4 className="font-display font-light text-lg tracking-[-0.01em] mb-2">{c.title}</h4>
                      <p className="text-[13px] text-ink-soft leading-[1.6] m-0">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-rule">
        <Wrap>
          <Reveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3
                  className="font-display font-light leading-[1.1] tracking-[-0.02em] mb-2"
                  style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
                >
                  Ready to talk through a brief?
                </h3>
                <p className="text-[15px] text-ink-soft m-0">A short call is usually enough to know whether we're the right fit.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  Start a conversation →
                </Link>
              </div>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </SiteLayout>
  );
}
