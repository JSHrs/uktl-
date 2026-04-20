import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, Wrap } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UK Talent Link" },
      {
        name: "description",
        content:
          "Tell us about the people problem in front of you. A real person replies, usually within one working day.",
      },
      { property: "og:title", content: "Contact — UK Talent Link" },
      {
        property: "og:description",
        content:
          "Tell us about the people problem in front of you. A real person replies, usually within one working day.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <section className="bg-ink text-paper pt-44 pb-24 md:pt-56 md:pb-40 relative overflow-hidden min-h-screen">
        <span className="absolute inset-0 contact-mesh pointer-events-none" />
        <Wrap className="relative z-10">
          <Reveal>
            <div className="font-mono text-xs tracking-[0.15em] uppercase text-paper/50 flex items-center gap-3.5">
              <span className="w-7 h-px bg-paper/50" />
              05 — Contact
            </div>
            <h1
              className="font-display font-extralight leading-[0.98] tracking-[-0.035em] mt-7 max-w-[18ch]"
              style={{ fontSize: "clamp(44px, 7vw, 112px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
            >
              Tell us about the people problem{" "}
              <em
                className="italic"
                style={{ color: "#A9B8E0", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
              >
                in front of you.
              </em>
            </h1>
          </Reveal>

          <div className="grid md:grid-cols-[6fr_5fr] gap-12 md:gap-24 mt-20">
            <Reveal>
              <div className="flex flex-col">
                <Detail label="Write" value="info@uktalentlink.co.uk" href="mailto:info@uktalentlink.co.uk" />
                <Detail label="Call" value="+44 (0) 207 189 2857" href="tel:+442071892857" />
                <Detail
                  label="Visit"
                  value="Chancery House, 53–64 Chancery Lane, London WC2A 1QS"
                />
                <Detail label="Hours" value="Monday – Friday · 09:00 – 18:00 GMT" />
              </div>
            </Reveal>

            <Reveal>
              <ContactForm />
            </Reveal>
          </div>
        </Wrap>
      </section>
    </SiteLayout>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="py-6 border-t border-paper/15 last:border-b">
      <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-paper/50 mb-2.5">
        {label}
      </div>
      <div
        className="font-display font-light leading-[1.2] tracking-[-0.015em]"
        style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block transition-opacity hover:opacity-80">
      {inner}
    </a>
  ) : (
    inner
  );
}

function ContactForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-paper/5 border border-paper/10 rounded-[22px] p-9 backdrop-blur-md"
    >
      <h3
        className="font-display font-light text-[26px] tracking-[-0.02em] leading-[1.1] m-0 mb-2"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        A short, quiet form.
      </h3>
      <p className="text-paper/60 text-sm m-0 mb-7">
        We read every message. A real person replies, usually within one working day.
      </p>

      {[
        { label: "Your name", id: "name", type: "text" },
        { label: "Email", id: "email", type: "email" },
        { label: "Company", id: "company", type: "text" },
      ].map((f) => (
        <div key={f.id} className="mb-5">
          <label htmlFor={f.id} className="block font-mono text-[11px] tracking-[0.1em] uppercase text-paper/50 mb-2">
            {f.label}
          </label>
          <input
            id={f.id}
            type={f.type}
            className="w-full bg-transparent border-0 border-b border-paper/20 py-2.5 font-body text-base text-paper outline-none focus:border-b-[#A9B8E0] transition-colors"
          />
        </div>
      ))}

      <div className="mb-5">
        <label htmlFor="msg" className="block font-mono text-[11px] tracking-[0.1em] uppercase text-paper/50 mb-2">
          What are you working on?
        </label>
        <textarea
          id="msg"
          className="w-full bg-transparent border-0 border-b border-paper/20 py-2.5 font-body text-base text-paper outline-none focus:border-b-[#A9B8E0] transition-colors resize-y min-h-[100px]"
        />
      </div>

      <button
        type="submit"
        className="mt-4 w-full bg-paper text-ink border-0 px-6 py-[18px] font-body text-[15px] font-medium tracking-[-0.005em] rounded-full cursor-pointer transition-all duration-300 hover:bg-[#A9B8E0] hover:-translate-y-px [transition-timing-function:var(--ease-publication)]"
      >
        Send enquiry
      </button>
    </form>
  );
}
