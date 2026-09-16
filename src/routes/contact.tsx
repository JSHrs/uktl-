import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, Wrap } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import { toast } from "sonner";
import { submitEnquiryFn } from "@/lib/functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UK Talent Link" },
      { name: "description", content: "Tell us about the people problem in front of you. A real person replies, usually within one working day. Offices in London and Dubai." },
      { property: "og:title", content: "Contact — UK Talent Link" },
      { property: "og:description", content: "Tell us about the people problem in front of you. A real person replies, usually within one working day." },
    ],
  }),
  component: ContactPage,
});

const ENQUIRY_TYPES = [
  "Executive search mandate",
  "HR consultancy",
  "Employment law advice",
  "GCC recruitment",
  "Talent Compass platform",
  "General enquiry",
];

function ContactPage() {
  return (
    <SiteLayout>
      <section className="bg-ink text-paper pt-44 pb-24 md:pt-56 md:pb-40 relative overflow-hidden min-h-screen">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 55% 50% at 85% 20%, oklch(0.285 0.075 263 / 0.25), transparent 70%), radial-gradient(ellipse 40% 40% at 10% 80%, oklch(0.285 0.075 263 / 0.12), transparent 70%)",
          }}
        />

        <Wrap className="relative z-10">
          <Reveal>
            <div className="font-mono text-xs tracking-[0.15em] uppercase text-paper/40 flex items-center gap-3.5">
              <span className="w-7 h-px bg-paper/40" />
              05 — Contact
            </div>
            <h1
              className="font-display font-extralight leading-[0.97] tracking-[-0.035em] mt-7 max-w-[16ch]"
              style={{ fontSize: "clamp(44px, 7vw, 108px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
            >
              Tell us about the people problem{" "}
              <em
                className="italic"
                style={{ color: "oklch(0.765 0.055 263)", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
              >
                in front of you.
              </em>
            </h1>
          </Reveal>

          <div className="grid md:grid-cols-[5fr_6fr] gap-12 md:gap-20 mt-20">
            {/* Left — contact details */}
            <Reveal>
              <div className="flex flex-col gap-0">
                <Detail label="Write" value="info@uktalentlink.co.uk" href="mailto:info@uktalentlink.co.uk" />
                <Detail label="Call" value="+44 (0)20 7189 2857" href="tel:+442071892857" />
                <Detail label="London" value="Chancery House, 53–64 Chancery Lane, London WC2A 1QS" />
                <Detail label="Dubai" value="Level 14, Boulevard Plaza Tower 1, Mohammed Bin Rashid Boulevard, Dubai" />
                <Detail label="Hours" value="Monday – Friday · 09:00 – 18:00 GMT / GST" />
              </div>

              <div className="mt-12 pt-8 border-t border-paper/10">
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-paper/35 mb-5">
                  What to expect
                </div>
                <ol className="list-none p-0 m-0 space-y-4">
                  {[
                    "We read every message and reply personally — no auto-responders, no junior team triage.",
                    "Expect a response within one working day. Usually sooner.",
                    "If the brief warrants a call, we'll suggest times in our first reply.",
                    "We'll tell you honestly if we're not the right fit, and suggest who is.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 text-[14px] text-paper/50">
                      <span className="font-mono text-[10px] text-paper/25 mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            {/* Right — form */}
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
  const content = (
    <div className="py-5 border-t border-paper/10">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-2">{label}</div>
      <div
        className="font-display font-light leading-[1.25] tracking-[-0.01em]"
        style={{ fontSize: "clamp(16px, 1.8vw, 22px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block transition-opacity hover:opacity-70 group">
      {content}
    </a>
  ) : (
    content
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const field = (key: string) => String(fd.get(key) ?? "").trim();
    setError(null);
    setSending(true);
    try {
      await submitEnquiryFn({
        data: {
          name: field("name"),
          email: field("email"),
          company: field("company") || undefined,
          enquiry_type: field("type") || undefined,
          message: field("msg"),
        },
      });
      setSent(true);
      toast.success("Enquiry sent — we'll reply within one working day");
    } catch {
      setError("We couldn't send your message just now. Please email us directly and we'll pick it up.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-paper/5 border border-paper/10 rounded-2xl p-9 flex flex-col gap-4 min-h-[400px] justify-center">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/35">Message sent</div>
        <h3
          className="font-display font-light leading-[1.1] tracking-[-0.02em] m-0"
          style={{ fontSize: "clamp(22px, 2.5vw, 34px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          Thank you — we'll be in touch.
        </h3>
        <p className="text-paper/50 text-[14px] leading-[1.6] m-0">
          A member of our team will read your message and reply personally, usually within one working day. If your matter is urgent, please call us directly.
        </p>
        <a
          href="tel:+442071892857"
          className="mt-4 inline-flex items-center gap-2 text-[13px] text-paper/60 hover:text-paper transition-colors"
        >
          +44 (0)20 7189 2857 →
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-paper/5 border border-paper/10 rounded-2xl p-9 backdrop-blur-sm"
    >
      <h3
        className="font-display font-light leading-[1.1] tracking-[-0.02em] m-0 mb-2"
        style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        A short, quiet form.
      </h3>
      <p className="text-paper/45 text-[13px] m-0 mb-8 leading-[1.5]">
        We read every message. A real person replies.
      </p>

      <div className="space-y-6">
        {[
          { label: "Your name", id: "name", type: "text", required: true },
          { label: "Email address", id: "email", type: "email", required: true },
          { label: "Company or organisation", id: "company", type: "text", required: false },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-2.5">
              {f.label}{f.required && <span className="text-paper/25 ml-1">*</span>}
            </label>
            <input
              id={f.id}
              name={f.id}
              type={f.type}
              required={f.required}
              className="w-full bg-transparent border-0 border-b border-paper/15 py-3 text-[15px] text-paper placeholder:text-paper/20 outline-none focus:border-paper/40 transition-colors"
            />
          </div>
        ))}

        <div>
          <label htmlFor="type" className="block font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-2.5">
            Type of enquiry
          </label>
          <select
            id="type"
            name="type"
            className="w-full bg-transparent border-0 border-b border-paper/15 py-3 text-[15px] text-paper outline-none focus:border-paper/40 transition-colors appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.25)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
          >
            <option value="" className="bg-ink">Select type…</option>
            {ENQUIRY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-ink">{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="msg" className="block font-mono text-[10px] tracking-[0.14em] uppercase text-paper/35 mb-2.5">
            What are you working on? <span className="text-paper/25">*</span>
          </label>
          <textarea
            id="msg"
            name="msg"
            required
            rows={4}
            placeholder="Tell us about the role, the situation, or the problem you're trying to solve. A couple of sentences is enough to get started."
            className="w-full bg-transparent border-0 border-b border-paper/15 py-3 text-[15px] text-paper placeholder:text-paper/20 outline-none focus:border-paper/40 transition-colors resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-8 w-full bg-paper text-ink border-0 px-6 py-4 text-[14px] font-medium tracking-[-0.005em] rounded-full cursor-pointer transition-all duration-300 hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? "Sending…" : "Send enquiry"}
      </button>

      {error ? (
        <p role="alert" className="text-[13px] text-center mt-4 m-0 text-paper/70">
          {error}{" "}
          <a href="mailto:info@uktalentlink.co.uk" className="underline text-paper">
            info@uktalentlink.co.uk
          </a>
        </p>
      ) : (
        <p className="text-paper/25 text-[12px] text-center mt-4 m-0">
          We'll reply to your email within one working day.
        </p>
      )}
    </form>
  );
}
