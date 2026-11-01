import { Link, useRouteContext } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader, Section } from "@/components/app/AppLayout";
import { AccountType } from "@/components/app/AccountType";
import { submitEnquiryFn } from "@/lib/functions";

/**
 * The employer's own account page. Employers brief UK Talent Link on roles here;
 * they never see candidate records, CVs or staff tools (shortlists are shared by a
 * consultant). The brief is sent as a real enquiry to the team.
 */
export function EmployerHome() {
  const { session } = useRouteContext({ from: "__root__" });
  const first = session.displayName?.trim().split(/\s+/)[0];
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = (k: string) => String(fd.get(k) ?? "").trim();
    const facts = [
      `Role: ${f("role")}`,
      f("location") ? `Location: ${f("location")}` : "",
      f("service") ? `Service: ${f("service")}` : "",
      f("timing") ? `Timing: ${f("timing")}` : "",
    ].filter(Boolean);
    const message = `${facts.join("\n")}\n\n${f("details")}`;
    setState("sending");
    try {
      await submitEnquiryFn({
        data: {
          name: session.displayName?.trim() || session.email || "Employer account",
          email: session.email ?? "",
          company: f("company") || undefined,
          enquiry_type: "Employer account: hiring brief",
          message,
        },
      });
      setState("sent");
      toast.success("Brief sent. A consultant will reply, usually within one working day.");
    } catch {
      setState("error");
    }
  }

  const input =
    "w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors";
  const label = "block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5";

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Employer account"
        title={first ? `Welcome, ${first}` : "Your employer account"}
        lede="Brief us on a role and a consultant takes it from there: market search across the UK and the Gulf, assessment against your must-haves, and a shortlist with the reasons behind every name."
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="rounded-lg border border-rule p-6 bg-paper" aria-labelledby="brief-title">
          <h2 id="brief-title" className="font-display text-2xl tracking-[-0.02em]">
            Brief us on a role
          </h2>
          {state === "sent" ? (
            <div role="status" className="mt-4 space-y-3">
              <p className="text-ink-soft text-[15px]">
                Thank you. Your brief is with the team and a consultant will reply to {session.email}, usually within one
                working day.
              </p>
              <button type="button" onClick={() => setState("idle")} className="text-[13px] underline">
                Brief us on another role
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="brief-role" className={label}>Role title</label>
                <input id="brief-role" name="role" required maxLength={200} className={input} placeholder="e.g. Commercial Manager" />
              </div>
              <div>
                <label htmlFor="brief-company" className={label}>Organisation</label>
                <input id="brief-company" name="company" maxLength={200} autoComplete="organization" className={input} />
              </div>
              <div>
                <label htmlFor="brief-location" className={label}>Location</label>
                <input id="brief-location" name="location" maxLength={200} className={input} placeholder="e.g. Riyadh, on-site" />
              </div>
              <div>
                <label htmlFor="brief-service" className={label}>Service</label>
                <select id="brief-service" name="service" className={input} defaultValue="Executive search">
                  <option>Executive search</option>
                  <option>HR consultancy</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div>
                <label htmlFor="brief-timing" className={label}>Ideal start</label>
                <input id="brief-timing" name="timing" maxLength={100} className={input} placeholder="e.g. Within three months" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="brief-details" className={label}>What does success look like?</label>
                <textarea
                  id="brief-details"
                  name="details"
                  required
                  rows={5}
                  maxLength={4000}
                  className={input}
                  placeholder="The must-haves, the team, and anything we should know."
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
                {state === "error" ? (
                  <p role="alert" className="text-sm text-bad">
                    We couldn't send your brief just now. Please email info@uktalentlink.co.uk.
                  </p>
                ) : (
                  <p className="text-[12px] text-ink-mute">Sent from {session.email}. We reply within one working day.</p>
                )}
                <button
                  disabled={state === "sending"}
                  className="min-h-11 rounded-full bg-ink text-paper px-6 text-[14px] disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : "Send brief"}
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-rule p-6 bg-paper-deep">
            <h2 className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">What happens next</h2>
            <ol className="mt-4 space-y-4 text-[14px] text-ink-soft">
              <li><b className="text-ink font-medium">1 · A call about the role.</b> A consultant confirms the must-haves, the team and the timing.</li>
              <li><b className="text-ink font-medium">2 · The search.</b> We map the market across the UK and the Gulf and approach people confidentially.</li>
              <li><b className="text-ink font-medium">3 · Your shortlist.</b> Ranked, with the evidence and the gaps for every name, shared by your consultant.</li>
            </ol>
          </section>
          <section className="rounded-lg border border-rule p-6">
            <h2 className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">Talk to us now</h2>
            <p className="mt-3 text-[14px]">
              <a href="tel:+442071892857" className="hover:underline">+44 (0)20 7189 2857</a>
              <br />
              <a href="mailto:info@uktalentlink.co.uk" className="hover:underline">info@uktalentlink.co.uk</a>
            </p>
            <p className="mt-4 text-[13px] text-ink-soft">
              <Link to="/employers" className="underline">Our services</Link> ·{" "}
              <Link to="/approach" className="underline">How we search</Link>
            </p>
          </section>
        </aside>
      </div>

      <Section title="Your privacy and candidates'">
        <p className="text-[14px] text-ink-soft max-w-[68ch]">
          Employer accounts don't give access to candidate records or CVs. Your consultant shares shortlists directly, with
          the candidate's agreement.
        </p>
      </Section>

      <AccountType role="employer" />
    </div>
  );
}
