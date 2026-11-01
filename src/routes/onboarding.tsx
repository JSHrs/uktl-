import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CompanyForm, RoleForm } from "@/components/app/EmployerForms";
import { Logo } from "@/components/site/Nav";
import { uploadAndParseCvFn } from "@/lib/functions";
import { myEmployerProfileFn, saveEmployerProfileFn, submitEmployerRoleFn } from "@/lib/employer-functions";
import { setTheme, useTheme } from "@/lib/preferences";
import heroMark from "@/assets/hero-mark.jpg";

/*
 * Guided onboarding from the Claude Design handoff (Onboarding.html).
 *   candidate: account → upload CV → score and next steps
 *   employer:  account → company → needs → first role → portal
 * Every step saves real data through the same server functions as the rest of the
 * app; there is no demo data and nothing is stored only in the browser.
 */
type For = "candidate" | "employer";

const FLOWS: Record<For, { who: string; head: ReactNode; steps: string[] }> = {
  candidate: {
    who: "Candidate · Free account",
    head: (
      <>
        Your CV, scored and <em className="italic text-accent-light">matched.</em>
      </>
    ),
    steps: ["Account", "Upload CV", "Your score"],
  },
  employer: {
    who: "Employer · Client portal",
    head: (
      <>
        Ranked shortlists, <em className="italic text-accent-light">with the reasons.</em>
      </>
    ),
    steps: ["Account", "Company", "Your needs", "First role", "All set"],
  },
};

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s): { for: For; step: number; cv?: string; score?: number } => {
    const f: For = s.for === "employer" ? "employer" : "candidate";
    const max = FLOWS[f].steps.length;
    const n = Number(s.step);
    const score = Number(s.score);
    return {
      for: f,
      step: Number.isInteger(n) && n >= 1 && n <= max ? n : 1,
      // Hand-off from the upload step to the score step (the visitor's own CV).
      cv: typeof s.cv === "string" && /^[\w-]{1,100}$/.test(s.cv) ? s.cv : undefined,
      score: Number.isInteger(score) && score >= 0 && score <= 100 ? score : undefined,
    };
  },
  beforeLoad: ({ context, search }) => {
    const { session } = context;
    if (session.isStaff) throw redirect({ href: "/admin" });
    // Later steps need an account; a signed-in visitor skips the account step.
    // Accounts are created on the shared Sign in | Create account page, then continue here.
    if (!session.userId) throw redirect({ to: "/auth/register", search: { for: search.for } });
    if (session.userId && search.step === 1) throw redirect({ to: "/onboarding", search: { for: search.for, step: 2 } });
    // Each account type only walks its own flow.
    // A signed-in candidate choosing to hire goes through the safe conversion check.
    if (session.userId && search.for === "employer" && session.accountRole !== "employer")
      throw redirect({ href: "/auth/employer-setup?onboarding=1" });
    if (session.userId && search.for === "candidate" && session.accountRole === "employer")
      throw redirect({ to: "/onboarding", search: { for: "employer", step: 2 } });
  },
  loaderDeps: ({ search }) => ({ for: search.for, step: search.step }),
  loader: async ({ deps, context }) => {
    if (deps.for === "employer" && context.session.userId && deps.step > 1 && deps.step < 5) {
      return { profile: await myEmployerProfileFn().catch(() => null) };
    }
    return { profile: null };
  },
  head: () => ({ meta: [{ title: "Get started — UK Talent Link" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});

function Onboarding() {
  const search = Route.useSearch();
  const { profile } = Route.useLoaderData();
  const router = useRouter();
  const flow = FLOWS[search.for];
  const total = flow.steps.length;
  const go = (step: number) => router.navigate({ to: "/onboarding", search: { for: search.for, step } });

  return (
    <div className="min-h-screen bg-paper text-ink md:grid md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
      <Rail flow={flow} step={search.step} onStep={(n) => n < search.step && n > 1 && go(n)} />
      <main className="flex flex-col min-w-0 min-h-screen">
        <TopBar step={search.step} total={total} />
        <div className="h-0.5 bg-rule mx-5 sm:mx-10" aria-hidden="true">
          <i className="block h-full bg-accent transition-[width] duration-500" style={{ width: `${(search.step / total) * 100}%` }} />
        </div>
        <div className="flex-1 flex justify-center px-5 sm:px-10 py-10 sm:py-14">
          <div className="w-full max-w-[620px]" key={`${search.for}-${search.step}`}>
            {search.for === "candidate" ? (
              <CandidateStep
                step={search.step}
                go={go}
                result={search.cv ? { id: search.cv, score: search.score ?? null } : null}
                onUploaded={(r) => router.navigate({ to: "/onboarding", search: { for: "candidate", step: 3, cv: r.id, score: r.score ?? undefined } })}
              />
            ) : (
              <EmployerStep step={search.step} go={go} profile={profile} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Rail({ flow, step, onStep }: { flow: (typeof FLOWS)[For]; step: number; onStep: (n: number) => void }) {
  return (
    <aside className="hidden md:flex relative flex-col gap-10 p-8 bg-[oklch(0.095_0.003_60)] text-[oklch(0.99_0.001_82)] sticky top-0 h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${heroMark})`, filter: "grayscale(1) invert(1)", mixBlendMode: "screen" }}
      />
      <Link to="/" className="relative font-display text-[19px] font-medium tracking-[-0.025em] text-white">
        UK <em className="italic font-normal text-white/70">Talent</em> Link
      </Link>
      <div className="relative">
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/55">{flow.who}</div>
        <h2 className="font-display font-light text-[30px] leading-[1.08] tracking-[-0.02em] mt-2.5">{flow.head}</h2>
      </div>
      <ol className="relative grid gap-0.5">
        {flow.steps.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "on" : "todo";
          return (
            <li key={label}>
              <button
                type="button"
                disabled={state !== "done" || n === 1}
                onClick={() => onStep(n)}
                aria-current={state === "on" ? "step" : undefined}
                className={`flex w-full items-center gap-3.5 py-2.5 text-left text-[14px] ${state === "on" ? "text-white" : state === "done" ? "text-white/75 enabled:hover:text-white" : "text-white/50"}`}
              >
                <i
                  className={`not-italic w-[26px] h-[26px] rounded-full border grid place-items-center font-mono text-[11px] shrink-0 ${
                    state === "on" ? "bg-white text-[oklch(0.095_0.003_60)] border-white" : state === "done" ? "bg-accent-light border-accent-light text-[oklch(0.095_0.003_60)]" : "border-white/25"
                  }`}
                >
                  {state === "done" ? "✓" : n}
                </i>
                {label}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="relative mt-auto grid gap-1 text-[13px] text-white/60">
        <span>Need a hand?</span>
        <Link to="/contact" className="text-white border-b border-white/40 justify-self-start">Talk to a person</Link>
        <a href="tel:+442071892857">+44 (0)20 7189 2857</a>
      </div>
    </aside>
  );
}

function TopBar({ step, total }: { step: number; total: number }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <div className="flex items-center justify-between gap-4 px-5 sm:px-10 py-5">
      <span className="md:hidden">
        <Logo />
      </span>
      <span className="hidden md:inline font-mono text-[11px] tracking-[0.14em] uppercase text-ink-mute">
        Step {step} of {total}
      </span>
      <div className="flex items-center gap-3.5">
        <span className="md:hidden font-mono text-[11px] text-ink-mute">
          {step}/{total}
        </span>
        <button
          type="button"
          onClick={() => setTheme(next)}
          aria-label={`Switch to ${next} mode`}
          className="w-8 h-8 rounded-full border border-rule hover:border-ink grid place-items-center"
        >
          <i className="theme-dot" aria-hidden="true" />
        </button>
        <Link to="/" className="text-[13px] text-ink-mute hover:text-ink border-b border-transparent hover:border-ink">
          Save &amp; exit
        </Link>
      </div>
    </div>
  );
}

function Heading({ title, lede }: { title: ReactNode; lede?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1
        className="font-display font-light tracking-[-0.025em] leading-[1.05] text-ink"
        style={{ fontSize: "clamp(30px, 4vw, 44px)", fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
      >
        {title}
      </h1>
      {lede && <p className="mt-3 text-[15px] text-ink-soft max-w-[56ch]">{lede}</p>}
    </div>
  );
}

/* ───────────── Candidate ───────────── */

type UploadResult = { id: string; score: number | null };

function CandidateStep({
  step,
  go,
  result,
  onUploaded,
}: {
  step: number;
  go: (n: number) => void;
  result: UploadResult | null;
  onUploaded: (r: UploadResult) => void;
}) {
  if (step === 2) return <UploadStep onDone={onUploaded} />;
  return <ScoreStep result={result} />;
}

function UploadStep({ onDone }: { onDone: (r: UploadResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback((f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return setError(`That file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 10 MB.`);
    setError(null);
    setFile(f);
  }, []);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadAndParseCvFn({ data: fd });
      if (r.status === "failed") throw new Error(r.error ?? "We couldn't read that file. Check it and try again.");
      onDone({ id: r.id, score: r.status === "queued" ? null : (r.quality?.score ?? null) });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading title="Add your CV." lede="PDF, Word or plain text, up to 10 MB. It's stored privately and only seen by you and authorised UK Talent Link staff." />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choose(e.dataTransfer.files[0] ?? null);
        }}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${drag ? "border-accent bg-accent-soft" : "border-rule"}`}
      >
        <div className="text-2xl" aria-hidden="true">↑</div>
        <p className="mt-2 text-[15px]">Drop your CV here, or</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 min-h-10 rounded-full border border-rule px-5 text-[14px] hover:border-ink">
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-label="CV file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
        />
      </div>
      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-rule p-3 text-[14px]">
          <span className="rounded bg-accent text-paper px-1.5 py-1 font-mono text-[10px]">{file.name.split(".").pop()?.toUpperCase()}</span>
          <span className="flex-1 truncate">{file.name}</span>
          <span className="text-ink-mute text-[12px]">{(file.size / 1024).toFixed(0)} KB</span>
          <button type="button" onClick={() => setFile(null)} className="text-[13px] underline text-ink-mute">Remove</button>
        </div>
      )}
      {busy && (
        <ul className="mt-4 space-y-1 text-[14px] text-ink-soft" role="status">
          <li>✓ File received</li>
          <li>Reading your experience and skills, then scoring your CV. This can take a minute.</li>
        </ul>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-bad">{error}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link to="/app" className="text-[13px] text-ink-mute underline">Skip for now</Link>
        <button type="button" disabled={!file || busy} onClick={upload} className="min-h-11 rounded-full bg-ink text-paper px-6 text-[14px] disabled:opacity-50">
          {busy ? "Scoring your CV…" : "Upload and score"}
        </button>
      </div>
    </>
  );
}

function ScoreStep({ result }: { result: UploadResult | null }) {
  return (
    <>
      <Heading
        title="You're all set."
        lede={
          result?.score != null
            ? "Your CV is scored and Talent Compass has started matching you to the roles we're recruiting for."
            : result
              ? "Your CV is uploaded and in the queue. Your score and matches appear in your account as soon as it's processed."
              : "Your account is ready. Upload your CV any time to get your score and matches."
        }
      />
      {result?.score != null && (
        <div className="rounded-xl border border-rule p-6 flex items-center gap-6">
          <div className="font-display font-light text-[64px] leading-none tracking-[-0.04em]">
            {result.score}
            <small className="text-[18px] text-ink-mute"> / 100</small>
          </div>
          <p className="text-[14px] text-ink-soft">Your CV score. Open it to see the score for each section and the fixes that matter most.</p>
        </div>
      )}
      <ul className="mt-6 divide-y divide-rule border-y border-rule text-[15px]">
        {result && (
          <li>
            <Link to="/app/candidates/$id" params={{ id: result.id }} className="flex justify-between py-4 hover:text-accent">
              See your score and tips <span aria-hidden="true">→</span>
            </Link>
          </li>
        )}
        <li>
          <Link to="/app/profile" search={{ edit: true }} className="flex justify-between py-4 hover:text-accent">
            Check the profile we built from your CV <span aria-hidden="true">→</span>
          </Link>
        </li>
        <li>
          <Link to="/app/discover" className="flex justify-between py-4 hover:text-accent">
            See the roles you match <span aria-hidden="true">→</span>
          </Link>
        </li>
      </ul>
      <div className="mt-8 flex justify-end">
        <Link to="/app" className="min-h-11 inline-flex items-center rounded-full bg-ink text-paper px-6 text-[14px]">
          Go to your dashboard
        </Link>
      </div>
    </>
  );
}

/* ───────────── Employer ───────────── */

type Profile = Awaited<ReturnType<typeof myEmployerProfileFn>>;

function EmployerStep({ step, go, profile }: { step: number; go: (n: number) => void; profile: Profile }) {
  const back = (n: number) => (
    <button type="button" onClick={() => go(n)} className="min-h-11 rounded-full border border-rule px-5 text-[14px]">
      ← Back
    </button>
  );
  if (step === 2)
    return (
      <>
        <Heading title="About your company." lede="Your consultant uses this to brief candidates once they're interested. It isn't published." />
        <CompanyForm
          part="company"
          initial={profile}
          submitLabel="Continue"
          onSubmit={async (v) => {
            await saveEmployerProfileFn({ data: { ...v, services: profile?.services ?? [], hiring_markets: profile?.hiring_markets ?? [], hiring_volume: profile?.hiring_volume ?? null } });
            go(3);
          }}
        />
      </>
    );
  if (step === 3) {
    if (!profile) {
      return (
        <>
          <Heading title="How can we help?" lede="First, tell us about your company." />
          <button type="button" onClick={() => go(2)} className="min-h-11 rounded-full bg-ink text-paper px-6 text-[14px]">Add company details</button>
        </>
      );
    }
    return (
      <>
        <Heading title="How can we help?" lede="Choose any that apply. Your consultant tailors the search to it." />
        <CompanyForm
          part="needs"
          initial={profile}
          submitLabel="Continue"
          secondary={back(2)}
          onSubmit={async (v) => {
            await saveEmployerProfileFn({ data: v });
            go(4);
          }}
        />
      </>
    );
  }
  if (step === 4)
    return (
      <>
        <Heading title="Post your first role." lede="Just the basics. A consultant reviews it before the search starts, and you can add more detail later." />
        <RoleForm
          compact
          submitLabel="Send to UKTL"
          secondary={
            <Link to="/onboarding" search={{ for: "employer", step: 5 }} className="min-h-11 inline-flex items-center rounded-full border border-rule px-5 text-[14px]">
              Skip for now
            </Link>
          }
          onSubmit={async (v) => {
            await submitEmployerRoleFn({ data: v });
            toast.success("Role sent to UKTL");
            go(5);
          }}
        />
      </>
    );
  return (
    <>
      <Heading title="You're all set." lede="Your client portal is ready. A consultant reviews new roles, usually within one working day, and shares candidates in the portal with the reasons for each." />
      <ul className="divide-y divide-rule border-y border-rule text-[15px]">
        <li>
          <Link to="/employer" className="flex justify-between py-4 hover:text-accent">
            Open your portal <span aria-hidden="true">→</span>
          </Link>
        </li>
        <li>
          <Link to="/employer/roles/new" className="flex justify-between py-4 hover:text-accent">
            Post another role <span aria-hidden="true">→</span>
          </Link>
        </li>
        <li>
          <Link to="/employers" className="flex justify-between py-4 hover:text-accent">
            How we search <span aria-hidden="true">→</span>
          </Link>
        </li>
      </ul>
      <div className="mt-8 flex justify-end">
        <Link to="/employer" className="min-h-11 inline-flex items-center rounded-full bg-ink text-paper px-6 text-[14px]">
          Go to your portal
        </Link>
      </div>
    </>
  );
}
