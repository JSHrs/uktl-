import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { submitEnquiryFn } from "@/lib/functions";


/** Employer consultation request (band section, id="contact"). Sends a real enquiry. */
export function EmployerEnquiry({ lede = "A call with a consultant about what you need. There's no obligation. Prefer to talk now?" }: { lede?: string }) {
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
          enquiry_type: `Employer: ${field("service")}`,
          message: field("message"),
        },
      });
      setState("sent");
      toast.success("Request sent. We'll reply within one working day.");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="band sec" id="contact">
      <div className="grid-bg" />
      <div className="wrap cta" style={{ position: "relative" }}>
        <div className="cta-l rv">
          <div className="eyebrow">Book a consultation</div>
          <h2 className="disp" style={{ marginTop: 20 }}>
            Tell us about <em>the role.</em>
          </h2>
          <p>{lede}</p>
          <div className="cta-meta">
            <a href="tel:+442071892857">+44 (0)20 7189 2857</a>
            <a href="mailto:info@uktalentlink.co.uk">info@uktalentlink.co.uk</a>
          </div>
        </div>
        {state === "sent" ? (
          <div className="rv" role="status">
            <div className="eyebrow">Request sent</div>
            <h3 className="disp" style={{ fontSize: "clamp(26px,3cqi,40px)", marginTop: 16 }}>
              Thank you, we'll be in touch.
            </h3>
            <p style={{ marginTop: 16 }}>A consultant will reply personally, usually within one working day.</p>
          </div>
        ) : (
          <form className="cform rv" onSubmit={submit}>
            <label className="field">
              <span>Name</span>
              <input className="inp" name="name" required maxLength={200} autoComplete="name" placeholder="Your name" />
            </label>
            <label className="field">
              <span>Company</span>
              <input className="inp" name="company" maxLength={200} autoComplete="organization" placeholder="Organisation" />
            </label>
            <label className="field">
              <span>Work email</span>
              <input className="inp" name="email" type="email" required maxLength={320} autoComplete="email" placeholder="name@company.com" />
            </label>
            <label className="field">
              <span>Service</span>
              <select className="inp" name="service" defaultValue="Executive search">
                <option>Executive search</option>
                <option>HR consultancy</option>
                <option>Not sure yet</option>
              </select>
            </label>
            <label className="field full">
              <span>The role or challenge</span>
              <textarea className="inp" name="message" rows={4} required maxLength={5000} placeholder="A few lines is plenty" />
            </label>
            <div className="full form-foot">
              {state === "error" ? (
                <small className="form-msg err" role="alert">
                  We couldn't send that just now. Please email info@uktalentlink.co.uk.
                </small>
              ) : (
                <small>We reply within one working day.</small>
              )}
              <button className="btn btn-light btn-lg" disabled={state === "sending"}>
                {state === "sending" ? "Sending…" : "Request a call"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
