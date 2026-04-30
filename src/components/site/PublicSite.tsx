import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { submitLeadFn, trackEventFn } from "@/lib/server/functions";
import { SERVICE_OPTIONS } from "@/lib/schemas";
import { Spinner } from "@/components/dashboard/primitives";

const SERVICES = [
  {
    icon: "⚖",
    title: "HR Consultancy",
    desc: "Strategic and operational HR support — from people strategies and policy frameworks to day-to-day advisory that keeps your business compliant and your team thriving.",
  },
  {
    icon: "🔍",
    title: "Recruitment Solutions",
    desc: "Precision talent acquisition for UK and Middle East markets. Executive search, contingency recruitment, and full RPO solutions tailored to your sector and culture.",
  },
  {
    icon: "📋",
    title: "UK Employment Law",
    desc: "Navigate the complexity of UK employment legislation with confidence. Tribunal defence, contract drafting, TUPE, redundancy, and regulatory compliance — expertly handled.",
  },
  {
    icon: "🌍",
    title: "Middle East Expansion",
    desc: "Specialist recruitment and HR advisory for businesses expanding into the GCC. Local knowledge, global standards, seamless delivery.",
  },
];

const STATS = [
  { n: "600+", l: "Clients served" },
  { n: "18", l: "Years expertise" },
  { n: "98%", l: "Client retention" },
  { n: "2", l: "Global offices" },
];

const VALUES = [
  { t: "Deep Expertise", d: "Specialists across HR, law, and recruitment — not generalists." },
  { t: "Fiduciary Approach", d: "We act in your interest. No commissions. No conflicts." },
  { t: "Evidence-Led", d: "Every recommendation backed by data and legal rigour." },
  { t: "Global Reach", d: "UK excellence, delivered across the Middle East and beyond." },
];

export function PublicSite() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formStarted, setFormStarted] = useState(false);

  useEffect(() => {
    void trackEventFn({ data: { type: "page_view", page: "/" } });
  }, []);

  const onFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      void trackEventFn({ data: { type: "form_start", page: "/" } });
    }
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const submit = async () => {
    if (!form.name || !form.email || !form.service) {
      setError("Please fill in name, email, and service.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitLeadFn({
        data: {
          name: form.name,
          company: form.company || null,
          email: form.email,
          phone: form.phone || null,
          service: form.service,
          message: form.message || null,
        },
      });
      void trackEventFn({ data: { type: "form_submit", page: "/" } });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "var(--cream)" }}>
      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(13,27,42,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(184,151,90,0.15)",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: 1200,
            padding: "0 32px",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "var(--gold)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="font-serif"
                style={{ color: "var(--navy)", fontWeight: 700, fontSize: 14 }}
              >
                UK
              </span>
            </div>
            <span
              style={{
                color: "white",
                fontWeight: 500,
                fontSize: 16,
                letterSpacing: "0.02em",
              }}
            >
              UK Talent Link
            </span>
          </a>

          <div className="hidden md:flex" style={{ gap: 36, alignItems: "center" }}>
            <button
              onClick={() => scrollTo("services-section")}
              style={navLink}
            >
              Services
            </button>
            <button onClick={() => scrollTo("about-section")} style={navLink}>
              About
            </button>
            <Link to="/login" style={navLink}>
              Admin
            </Link>
            <button
              onClick={() => scrollTo("contact-section")}
              style={{
                background: "var(--gold)",
                color: "var(--navy)",
                padding: "9px 22px",
                borderRadius: 3,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.04em",
                border: "none",
                cursor: "pointer",
              }}
            >
              Get Consultation
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          minHeight: "100vh",
          background: "var(--navy)",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          paddingTop: 68,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(184,151,90,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "15%",
            right: "8%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "1px solid rgba(184,151,90,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "22%",
            right: "12%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "1px solid rgba(184,151,90,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "5%",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "1px solid rgba(184,151,90,0.06)",
          }}
        />

        <div
          className="anim-fadeup mx-auto"
          style={{ maxWidth: 1200, padding: "80px 32px", width: "100%" }}
        >
          <div style={{ maxWidth: 680 }}>
            <p
              style={{
                color: "var(--gold)",
                fontSize: 12,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 24,
                fontWeight: 500,
              }}
            >
              London · UK & Middle East
            </p>
            <h1
              className="font-serif"
              style={{
                fontSize: "clamp(44px, 7vw, 80px)",
                fontWeight: 300,
                color: "white",
                lineHeight: 1.05,
                marginBottom: 28,
              }}
            >
              Your Trusted Partner
              <br />
              <em style={{ color: "var(--gold-2)", fontStyle: "italic" }}>
                for People &amp; Law
              </em>
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 17,
                lineHeight: 1.75,
                maxWidth: 520,
                marginBottom: 44,
              }}
            >
              HR consultancy, precision recruitment, and UK employment law expertise — delivered by specialists who understand your business.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button
                onClick={() => scrollTo("contact-section")}
                style={{
                  background: "var(--gold)",
                  color: "var(--navy)",
                  padding: "15px 36px",
                  borderRadius: 3,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Book a Free Consultation
              </button>
              <button
                onClick={() => scrollTo("services-section")}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  padding: "15px 36px",
                  borderRadius: 3,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.15)",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                Explore Services →
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(255,255,255,0.04)",
            borderTop: "1px solid rgba(184,151,90,0.12)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="mx-auto"
            style={{
              maxWidth: 1200,
              padding: "0 32px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.n}
                style={{
                  padding: "22px 0",
                  textAlign: "center",
                  borderRight: "1px solid rgba(184,151,90,0.1)",
                }}
              >
                <div
                  className="font-serif"
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "var(--gold-2)",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    marginTop: 4,
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services-section"
        style={{ padding: "100px 32px", background: "var(--cream)" }}
      >
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div style={{ marginBottom: 60 }}>
            <p
              style={{
                color: "var(--gold)",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              What We Offer
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 400,
                color: "var(--navy)",
                lineHeight: 1.15,
                maxWidth: 520,
              }}
            >
              A complete suite of people &amp; legal services
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 2,
            }}
          >
            {SERVICES.map((s, i) => (
              <div
                key={s.title}
                style={{
                  background: i % 2 === 0 ? "var(--navy)" : "white",
                  padding: "44px 36px",
                  transition: "transform 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 20 }}>{s.icon}</div>
                <h3
                  className="font-serif"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: i % 2 === 0 ? "var(--gold-2)" : "var(--navy)",
                    marginBottom: 14,
                    lineHeight: 1.2,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color:
                      i % 2 === 0 ? "rgba(255,255,255,0.55)" : "var(--slate)",
                    fontSize: 14,
                    lineHeight: 1.75,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about-section"
        style={{ background: "var(--navy-2)", padding: "80px 32px" }}
      >
        <div
          className="mx-auto grid gap-20 items-center"
          style={{
            maxWidth: 1200,
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          }}
        >
          <div>
            <p
              style={{
                color: "var(--gold)",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              Who We Are
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 300,
                color: "white",
                lineHeight: 1.2,
                marginBottom: 24,
              }}
            >
              More than consultants —
              <br />
              <em style={{ color: "var(--gold-2)" }}>strategic partners</em>
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 15,
                lineHeight: 1.8,
                marginBottom: 16,
              }}
            >
              Rooted in London with reach across the UK and the Middle East, we combine deep sector knowledge with genuine care for the businesses we serve.
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 15,
                lineHeight: 1.8,
              }}
            >
              From scaling startups to global enterprises — every engagement is approached with the same precision and commitment to your outcomes.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            {VALUES.map((c) => (
              <div
                key={c.t}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(184,151,90,0.1)",
                  padding: "28px 24px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: "var(--gold)",
                    marginBottom: 16,
                  }}
                />
                <h4
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 8,
                  }}
                >
                  {c.t}
                </h4>
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    lineHeight: 1.65,
                  }}
                >
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact-section"
        style={{ padding: "100px 32px", background: "var(--cream-2)" }}
      >
        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p
              style={{
                color: "var(--gold)",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              Get in Touch
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 400,
                color: "var(--navy)",
                lineHeight: 1.15,
              }}
            >
              Book your free consultation
            </h2>
            <p
              style={{ color: "var(--slate)", fontSize: 15, marginTop: 16 }}
            >
              We respond within one business day. No sales pressure.
            </p>
          </div>

          {submitted ? (
            <div
              className="anim-fadein"
              style={{
                background: "var(--navy)",
                padding: "52px",
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "rgba(184,151,90,0.15)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 24,
                  color: "var(--gold-2)",
                }}
              >
                ✓
              </div>
              <h3
                className="font-serif"
                style={{
                  fontSize: 26,
                  color: "white",
                  fontWeight: 400,
                  marginBottom: 12,
                }}
              >
                Enquiry received
              </h3>
              <p
                style={{ color: "rgba(255,255,255,0.55)", fontSize: 15 }}
              >
                Thank you, {form.name.split(" ")[0]}. A member of our team will be in touch shortly.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "white",
                padding: "48px",
                borderRadius: 4,
                boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                {[
                  { k: "name", l: "Full Name *", p: "Your name" },
                  { k: "company", l: "Company", p: "Company name" },
                  { k: "email", l: "Email Address *", p: "your@email.com" },
                  { k: "phone", l: "Phone", p: "07xxx xxx xxx" },
                ].map((f) => (
                  <div key={f.k}>
                    <label style={fieldLabel}>{f.l}</label>
                    <input
                      value={form[f.k as keyof typeof form] as string}
                      onChange={(e) =>
                        setForm({ ...form, [f.k]: e.target.value })
                      }
                      onFocus={onFormFocus}
                      placeholder={f.p}
                      style={fieldInput}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={fieldLabel}>Service Required *</label>
                <select
                  value={form.service}
                  onChange={(e) =>
                    setForm({ ...form, service: e.target.value })
                  }
                  onFocus={onFormFocus}
                  style={{
                    ...fieldInput,
                    color: form.service ? "var(--ink)" : "var(--muted-c)",
                    appearance: "none",
                  }}
                >
                  <option value="">Select a service</option>
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={fieldLabel}>Tell us about your needs</label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  onFocus={onFormFocus}
                  rows={4}
                  placeholder="Brief description of your situation..."
                  style={{ ...fieldInput, resize: "vertical" }}
                />
              </div>
              {error && (
                <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>
                  {error}
                </p>
              )}
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  marginTop: 28,
                  width: "100%",
                  background: "var(--navy)",
                  color: "white",
                  padding: "15px",
                  borderRadius: 3,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  border: "none",
                  cursor: submitting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: submitting ? 0.85 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Spinner size={14} /> Submitting…
                  </>
                ) : (
                  "Submit Enquiry →"
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "var(--navy)",
          padding: "52px 32px",
          borderTop: "1px solid rgba(184,151,90,0.1)",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: 1200,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--gold)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  className="font-serif"
                  style={{ color: "var(--navy)", fontWeight: 700, fontSize: 12 }}
                >
                  UK
                </span>
              </div>
              <span style={{ color: "white", fontWeight: 500 }}>
                UK Talent Link
              </span>
            </div>
            <p
              style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}
            >
              Chancery House, 53–64 Chancery Lane, London WC2A 1QS
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              info@uktalentlink.co.uk · 0207 189 2857
            </p>
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            © 2026 UK Talent Link. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

const navLink: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  fontSize: 13,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  letterSpacing: "0.08em",
  color: "var(--slate)",
  marginBottom: 8,
  fontWeight: 500,
  textTransform: "uppercase",
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 3,
  fontSize: 14,
  background: "var(--cream)",
  color: "var(--ink)",
  fontFamily: "inherit",
};
