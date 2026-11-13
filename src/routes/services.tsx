import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { Article, AudienceBanner, CtaStrip, DesignPage, PageHero, Ticks } from "@/components/site/ds";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "What we offer — UK Talent Link" },
      {
        name: "description",
        content:
          "Everything UK Talent Link offers candidates is free: a CV score, specific tips to improve it, matching to the roles we're recruiting for, workplace guidance and a consultant when you're a strong fit.",
      },
      { property: "og:title", content: "What we offer — UK Talent Link" },
      {
        property: "og:description",
        content: "A free CV score, improvement tips, matched roles, workplace guidance and a real consultant — all free.",
      },
    ],
  }),
  component: Services,
});

function Services() {
  return (
    <SiteLayout>
      <DesignPage>
        <PageHero
          eyebrow="What we offer"
          title={
            <>
              Everything we offer you is <em>free.</em>
            </>
          }
          lede="Create an account, upload your CV once, and you get all of this: your score, ways to improve it, the roles you match, guidance on your rights at work, and a consultant when you're a strong fit."
          actions={
            <>
              <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="btn btn-ink btn-lg">
                Register free →
              </Link>
              <Link to="/approach" className="btn btn-lg">
                How it works
              </Link>
            </>
          }
          note={
            <AudienceBanner
              show="employer"
              action={
                <Link to="/employers" className="lnk" style={{ color: "var(--ink)" }}>
                  See employer services →
                </Link>
              }
            >
              You're viewing as an employer. This page is for candidates.
            </AudienceBanner>
          }
        />

        <section className="sec" style={{ paddingTop: 40 }}>
          <div className="wrap">
            <Article id="cv-score" tag="/ 01 · Know where you stand" title="A CV score out of 100.">
              <p className="body">
                Your CV is read and scored across the things recruiters look at first. You see the overall score and a
                score for each section, so you know exactly what's working and what isn't.
              </p>
              <Ticks
                label="What you get"
                items={[
                  "Overall score out of 100",
                  "Scores for contact details, experience, skills, education, and clarity",
                  "A structured profile you can check and correct",
                  "Re-upload any time; your score updates",
                ]}
              />
              <div className="mini" aria-label="Example score">
                <span className="lbl">Example score</span>
                <div className="disp" style={{ fontSize: 56, lineHeight: 1 }}>
                  78<small style={{ fontSize: 16, color: "var(--ink-mute)" }}> / 100</small>
                </div>
                <TBar label="Experience" v={64} warn />
                <TBar label="Skills" v={81} />
                <TBar label="Clarity" v={79} />
              </div>
            </Article>

            <Article id="cv-tips" tag="/ 02 · Make it stronger" title="Specific ways to improve your CV.">
              <p className="body">
                Generic advice like “quantify your achievements” doesn't help much. For each section you get practical
                suggestions written for your CV, plus the single change that would make the biggest difference.
              </p>
              <Ticks
                label="What you get"
                items={[
                  "Section-by-section suggestions",
                  "The top priority to fix first",
                  "Re-upload as often as you like",
                  "Your tips stay private to your account",
                ]}
              />
              <div className="mini" aria-label="Example tip">
                <span className="lbl">Example · top priority</span>
                <div className="tfix">
                  <span className="pill warn">Experience</span>
                  <div>
                    <b>Quantify your impact in your current role</b>
                    <p>For example, “Cut month-end close from nine days to six”.</p>
                  </div>
                </div>
              </div>
            </Article>

            <Article id="matching" tag="/ 03 · Find where you fit" title="Matched to the roles we're recruiting for.">
              <p className="body">
                Your CV is matched against every open role we're recruiting for, across the UK and the Gulf. Each match
                comes with a fit score and the reasons behind it: the skills you have, the ones you're missing and how
                your experience lines up.
              </p>
              <Ticks
                label="What you get"
                items={[
                  "A fit score for every open role",
                  "The reasons behind each match",
                  "Register interest with a single swipe",
                  "Matches refresh as new roles come in",
                ]}
              />
              <div className="mini" aria-label="Example matches">
                <span className="lbl">Example matches</span>
                <TRow initials="FA" title="Senior Financial Analyst" where="Finance · Dubai" p={94} />
                <TRow initials="PM" title="Project Manager" where="Construction · London" p={89} />
              </div>
            </Article>

            <Article id="workplace-guidance" tag="/ 04 · Know your rights" title="Guidance on your rights at work.">
              <p className="body">
                Questions about your contract, pay, holiday, a disciplinary or dismissal? Search our library of topics or
                ask a question and get a clear answer grounded in ACAS guidance and UK employment law. If you need more,
                you can book a consultation.
              </p>
              <Ticks
                label="What you get"
                items={[
                  "A library of common workplace topics",
                  "Answers grounded in ACAS guidance and UK law",
                  "Your questions stay private to your account",
                  "Book a consultation when you need more",
                ]}
              />
              <p className="aside-note">This is general information, not legal advice or representation.</p>
            </Article>

            <Article id="consultants" tag="/ 05 · Talk to a person" title="A consultant when you're a strong fit.">
              <p className="body">
                Software does the matching; people make the decisions. Our consultants review the strongest matches for
                each role, and when you're a strong fit they'll get in touch to talk it through: the role, the employer
                and what the move would involve, including relocating to or from the Gulf.
              </p>
              <Ticks
                label="What you get"
                items={[
                  "Consultants review the strongest matches",
                  "A real conversation, not an automated email",
                  "Support with UK ↔ Gulf moves",
                  "Straight answers if a role isn't right for you",
                ]}
              />
            </Article>
          </div>
        </section>

        <CtaStrip
          title="See where you stand today."
          body="Create a free account and upload your CV. It takes a couple of minutes."
          actions={
            <Link to="/onboarding" search={{ for: "candidate", step: 1 }} className="btn btn-ink btn-lg">
              Register free →
            </Link>
          }
        />
      </DesignPage>
    </SiteLayout>
  );
}

function TBar({ label, v, warn }: { label: string; v: number; warn?: boolean }) {
  return (
    <div className="tbar">
      <span>{label}</span>
      <span className="t">
        <i className={warn ? "w" : ""} style={{ width: `${v}%` }} />
      </span>
      <b>{v}</b>
    </div>
  );
}

function TRow({ initials, title, where, p }: { initials: string; title: string; where: string; p: number }) {
  return (
    <div className="trow">
      <span className="co">{initials}</span>
      <span className="tx">
        <b>{title}</b>
        <small>{where}</small>
      </span>
      <span className="cring" style={{ "--p": p } as CSSProperties}>
        <span>{p}</span>
      </span>
    </div>
  );
}
