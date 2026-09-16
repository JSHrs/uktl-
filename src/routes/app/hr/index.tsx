import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppLayout";

export const Route = createFileRoute("/app/hr/")({
  component: HrIndexPage,
});

const CATEGORIES = [
  { value: "", label: "All topics" },
  { value: "dismissal", label: "Dismissal" },
  { value: "contracts", label: "Contracts & Employment Status" },
  { value: "discrimination", label: "Discrimination & Harassment" },
  { value: "pay", label: "Pay & Wages" },
  { value: "redundancy", label: "Redundancy" },
  { value: "holiday", label: "Holiday & Leave" },
  { value: "working-time", label: "Working Hours" },
  { value: "leave", label: "Maternity & Parental Leave" },
  { value: "whistleblowing", label: "Whistleblowing" },
  { value: "settlement", label: "Settlement Agreements" },
];

function HrIndexPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    navigate({
      to: "/app/hr/answer",
      search: { q: question.trim(), category: category || undefined },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="HR & Employment Law"
        title={
          <>
            Ask a{" "}
            <em className="not-italic italic font-normal text-ink-soft">
              workplace question
            </em>
          </>
        }
        lede="Get instant guidance on UK employment law — dismissal, contracts, pay, discrimination, redundancy, and more. Backed by ACAS guidance."
        actions={
          <Link
            to="/app/hr/library"
            className="text-[13px] px-[18px] py-2.5 border border-rule rounded-full hover:border-ink transition-colors"
          >
            Browse video library
          </Link>
        }
      />

      {/* Legal disclaimer */}
      <div className="max-w-[720px] mb-8 border border-rule bg-paper-deep/60 rounded-md px-5 py-3.5 flex gap-3 items-start">
        <span className="text-ink-mute mt-0.5 flex-shrink-0 font-mono text-xs">ℹ</span>
        <p className="text-sm text-ink-mute leading-relaxed">
          <strong className="font-medium text-ink-soft">Information, not legal advice.</strong>{" "}
          This platform provides general employment law information grounded in ACAS guidance. It
          does not constitute legal advice. For your specific circumstances, consult a qualified
          employment solicitor.
        </p>
      </div>

      <form onSubmit={onSubmit} className="max-w-[720px]">
        {/* Question input */}
        <label htmlFor="question" className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute block mb-2">
          Your question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="e.g. My employer wants to change my contract hours — do I have to agree?"
          className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute resize-none focus:outline-none focus:border-ink transition-colors"
        />

        {/* Category selector */}
        <label htmlFor="category" className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute block mt-5 mb-2">
          Topic area <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-rule rounded-md px-4 py-2.5 text-sm bg-paper text-ink focus:outline-none focus:border-ink transition-colors appearance-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs text-ink-mute max-w-[46ch]">
            We'll find the closest FAQ video first. If that doesn't resolve your query, AI
            guidance is provided as a follow-up.
          </p>
          <button
            type="submit"
            disabled={!question.trim()}
            className="flex-shrink-0 text-[13px] px-5 py-2.5 border border-ink bg-ink text-paper rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Find answer
          </button>
        </div>
      </form>

      {/* Topic quick-links */}
      <section className="mt-14 max-w-[720px]">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-5">
          — Browse by topic
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.slice(1).map((c) => (
            <Link
              key={c.value}
              to="/app/hr/answer"
              search={{ q: c.label, category: c.value }}
              className="border border-rule rounded-md px-4 py-3 text-sm text-ink-soft hover:border-ink hover:text-ink transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
