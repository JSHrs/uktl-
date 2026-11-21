import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { DesignPage, PageHero } from "@/components/site/ds";
import { submitEnquiryFn } from "@/lib/functions";
import { useAudience } from "@/lib/preferences";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UK Talent Link" },
      {
        name: "description",
        content:
          "Questions about a role, your CV or your account? A real person at UK Talent Link replies, usually within one working day. Offices in London and Dubai.",
      },
      { property: "og:title", content: "Contact — UK Talent Link" },
      {
        property: "og:description",
        content: "Questions about a role, your CV or your account? A real person replies, usually within one working day.",
      },
    ],
  }),
  component: ContactPage,
});

const ENQUIRY_TYPES = {
  candidate: [
    "I'm looking for a role",
    "Help with my CV or account",
    "A question about my rights at work",
    "Moving to or from the Gulf",
    "Something else",
  ],
  employer: ["Executive search", "HR consultancy", "My employer account", "Something else"],
} as const;

function ContactPage() {
  return (
    <SiteLayout>
      <DesignPage>
        <PageHero
          eyebrow="Contact"
          title={
            <>
              Talk to a <em>real person.</em>
            </>
          }
          style={{ border: 0, paddingBottom: 40 }}
        />
        <section style={{ paddingBottom: 120 }}>
          <div className="wrap cta" style={{ alignItems: "start" }}>
            <div className="rv">
              <div className="det">
                <a href="mailto:info@uktalentlink.co.uk">
                  <span className="mono">Write</span>
                  <div className="v">info@uktalentlink.co.uk</div>
                </a>
                <a href="tel:+442071892857">
                  <span className="mono">Call</span>
                  <div className="v">+44 (0)20 7189 2857</div>
                </a>
                <div>
                  <span className="mono">London</span>
                  <div className="v">Chancery House, 53–64 Chancery Lane, London WC2A 1QS</div>
                </div>
                <div>
                  <span className="mono">Dubai</span>
                  <div className="v">Level 14, Boulevard Plaza Tower 1, Mohammed Bin Rashid Boulevard, Dubai</div>
                </div>
                <div>
                  <span className="mono">Hours</span>
                  <div className="v">Monday – Friday · 09:00 – 18:00 GMT / GST</div>
                </div>
              </div>
              <div style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--rule)" }}>
                <span className="mono">What to expect</span>
                <ol
                  style={{ listStyle: "none", padding: 0, display: "grid", gap: 14, marginTop: 16, fontSize: 14, color: "var(--ink-soft)" }}
                >
                  <li>01 · We read every message and reply personally, usually within one working day.</li>
                  <li data-only="candidate">
                    02 · Looking for a role? The quickest way to be considered is to{" "}
                    <Link to="/onboarding" search={{ for: "candidate", step: 1 }} style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>
                      upload your CV
                    </Link>
                    .
                  </li>
                  <li data-only="employer">02 · Hiring? Tell us the role and we'll suggest times for a short call.</li>
                  <li>03 · We'll tell you honestly if we're not the right fit, and suggest who is.</li>
                </ol>
              </div>
            </div>
            <ContactForm />
          </div>
        </section>
      </DesignPage>
    </SiteLayout>
  );
}

function ContactForm() {
  const audience = useAudience();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const field = (k: string) => String(fd.get(k) ?? "").trim();
    setState("sending");
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
      setState("sent");
      toast.success("Enquiry sent. We'll reply within one working day.");
    } catch {
      setState("error");
    }
  }

  const box = { padding: 36, borderRadius: 16, background: "var(--paper-deep)", display: "grid", gap: 20 } as const;

  if (state === "sent") {
    return (
      <div className="card rv" style={box} role="status">
        <span className="mono">Message sent</span>
        <h3 className="disp" style={{ fontSize: 32 }}>
          Thank you, we'll be in touch.
        </h3>
        <p className="soft">
          A member of the team will reply personally, usually within one working day. If it's urgent, call{" "}
          <a href="tel:+442071892857">+44 (0)20 7189 2857</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="card rv" style={box} onSubmit={submit}>
      <div>
        <h2 className="disp" style={{ fontSize: 28 }}>
          Send us a message.
        </h2>
        <p className="mute" style={{ fontSize: 13, marginTop: 4 }}>
          We read every message. A real person replies.
        </p>
      </div>
      <div className="cform">
        <label className="field">
          <span>Your name</span>
          <input className="inp" name="name" required maxLength={200} autoComplete="name" />
        </label>
        <label className="field">
          <span>Email address</span>
          <input className="inp" name="email" type="email" required maxLength={320} autoComplete="email" />
        </label>
        {audience === "employer" && (
          <label className="field full">
            <span>Company</span>
            <input className="inp" name="company" maxLength={200} autoComplete="organization" />
          </label>
        )}
        <label className="field full">
          <span>Type of enquiry</span>
          <select className="inp" name="type" key={audience} defaultValue={ENQUIRY_TYPES[audience][0]}>
            {ENQUIRY_TYPES[audience].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field full">
          <span>How can we help?</span>
          <textarea className="inp" name="msg" rows={5} required maxLength={5000} />
        </label>
      </div>
      <div className="form-foot">
        {state === "error" ? (
          <small role="alert" style={{ color: "var(--bad)" }}>
            We couldn't send your message just now. Please email info@uktalentlink.co.uk and we'll pick it up.
          </small>
        ) : (
          <small>We'll reply within one working day.</small>
        )}
        <button className="btn btn-ink btn-lg" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}
