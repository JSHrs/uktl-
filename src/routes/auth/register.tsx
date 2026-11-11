import { AuthTabs } from "@/components/app/AuthTabs";
import { SocialSignIn } from "@/components/app/SocialSignIn";
import { useState } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { registrationDestination } from "@/lib/account-role";
import { candidateRegisterFn } from "@/lib/functions";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { useAudience, type Audience } from "@/lib/preferences";

export const Route = createFileRoute("/auth/register")({
  validateSearch: (search): { staff?: boolean; for?: "candidate" | "employer" } => ({
    staff: search.staff === true || search.staff === "true" ? true : undefined,
    for: search.for === "employer" || search.for === "candidate" ? search.for : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.session.userId) throw redirect({ href: registrationDestination(context.session, search.staff) });
  },
  head: () => ({ meta: [{ title: "Create your account — UK Talent Link" }, { name: "description", content: "Create a free UK Talent Link account." }, { property: "og:title", content: "Create your account — UK Talent Link" }, { property: "og:description", content: "Join UK Talent Link and build your career profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { staff, for: requestedType } = Route.useSearch();
  const router = useRouter();
  const audience = useAudience();
  // An explicit ?for= wins; otherwise follow the site's "I'm viewing as" choice.
  const [accountType, setAccountType] = useState<Audience>(requestedType ?? audience);
  const [touched, setTouched] = useState(false);
  const type: Audience = staff ? "candidate" : touched || requestedType ? accountType : audience;
  const employer = type === "employer";
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setLoading(true);
    try {
      const result = await candidateRegisterFn({ data: { email: form.email, password: form.password, name: form.name, staffIntent: !!staff, accountType: type } });
      if (result.needsConfirmation) {
        setSuccess(true);
      } else {
        // Navigate first: the root route re-reads the session on navigation. Invalidating
        // here would re-run this page's "already signed in" guard and send a new
        // candidate to the dashboard before the guided set-up (found in live testing).
        await router.navigate({
          href: staff ? "/staff" : `/onboarding?for=${result.accountType === "employer" ? "employer" : "candidate"}&step=2`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="w-14 h-14 rounded-full border border-rule flex items-center justify-center mx-auto mb-6">
          <span className="text-ink text-lg">✓</span>
        </div>
        <h2 className="font-display font-light text-2xl tracking-[-0.02em] mb-3">Check your email</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          We've sent a confirmation link to <strong className="text-ink">{form.email}</strong>.
          Click the link to activate your account.
        </p>
        <Link
          to="/auth/login"
          className="inline-block mt-6 text-sm text-ink underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      {!staff && <AuthTabs active="register" forType={type} />}
      <div className="mb-8 text-center">
        {staff && (
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute mb-3">— UK Talent Link staff</div>
        )}
        <h1
          className="font-display font-light tracking-[-0.025em]"
          style={{ fontSize: "clamp(28px, 4vw, 36px)", fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {staff ? "Create a staff account" : employer ? "Create your employer account" : "Create your account"}
        </h1>
        <p className="text-sm text-ink-soft mt-2">
          {staff
            ? "Create your account first. Your administrator must approve staff access before you can use the admin workspace; security verification is required."
            : employer
              ? "Then brief us on the role you need to fill. A consultant replies, usually within one working day."
              : "Then upload your CV — we'll score it and match you to the roles we're recruiting for."}
        </p>
      </div>

      {!staff && (
        <div role="group" aria-label="Account type" className="grid grid-cols-2 gap-1 p-1 mb-6 border border-rule rounded-full">
          {(["candidate", "employer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => {
                setTouched(true);
                setAccountType(t);
              }}
              className={`rounded-full py-2 text-[13px] transition-colors ${type === t ? "bg-ink text-paper" : "text-ink-mute hover:text-ink"}`}
            >
              {t === "candidate" ? "I'm looking for work" : "I'm hiring"}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-soft my-4">Before creating an account, read <Link to="/privacy" className="underline">how your information is used</Link> and <Link to="/terms" className="underline">the terms of use</Link>.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Full name
          </label>
          <input id="register-name"
            type="text"
            value={form.name}
            onChange={set("name")}
            required
            autoFocus
            autoComplete="name"
            placeholder="Jane Smith"
            className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Email
          </label>
          <input id="register-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Password <span className="normal-case tracking-normal font-sans text-[11px]">(min {MIN_PASSWORD_LENGTH} chars)</span>
          </label>
          <input id="register-password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div>
          <label htmlFor="register-confirm" className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink-mute mb-1.5">
            Confirm password
          </label>
          <input id="register-confirm"
            type="password"
            value={form.confirm}
            onChange={set("confirm")}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full border border-rule rounded-md px-4 py-3 text-sm bg-paper text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-ink text-paper text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-[11px] text-ink-mute text-center leading-relaxed">
          By registering you agree to our terms. Your data is used solely to match you with employment opportunities.
        </p>
      </form>

      {!staff && <SocialSignIn mode="register" redirect={employer ? "/auth/employer-setup?onboarding=1" : "/onboarding?for=candidate&step=2"} />}
      {staff && (
        <div className="mt-6 text-center text-sm text-ink-mute">
          Already have an account?{" "}
          <Link to="/admin/login" className="text-ink underline">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
