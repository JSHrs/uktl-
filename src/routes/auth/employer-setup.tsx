import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { claimEmployerAccountFn } from "@/lib/account-functions";

/**
 * Landing point after an employer signs up with Google or Apple. The server only
 * turns a brand-new account (no account type chosen, no CVs) into an employer
 * account, so an existing candidate is never converted by accident.
 */
export const Route = createFileRoute("/auth/employer-setup")({
  // ?onboarding=1 continues the guided set-up instead of opening the portal.
  validateSearch: (s): { onboarding?: boolean } => ({ onboarding: s.onboarding === 1 || s.onboarding === "1" || s.onboarding === true ? true : undefined }),
  beforeLoad: ({ context, search }) => {
    if (!context.session.userId) throw redirect({ to: "/onboarding", search: { for: "employer", step: 1 } });
    if (context.session.isStaff) throw redirect({ href: "/admin" });
    if (context.session.accountRole === "employer") throw redirect({ href: search.onboarding ? "/onboarding?for=employer&step=2" : "/employer" });
  },
  head: () => ({ meta: [{ title: "Setting up your account — UK Talent Link" }] }),
  component: EmployerSetup,
});

function EmployerSetup() {
  const router = useRouter();
  const { onboarding } = Route.useSearch();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    claimEmployerAccountFn()
      .then(async (result) => {
        if (cancelled) return;
        if (result.role === "employer") {
          await router.invalidate();
          await router.navigate({ href: onboarding ? "/onboarding?for=employer&step=2" : "/employer" });
          return;
        }
        setMessage(
          result.reason === "has_cv"
            ? "This sign-in is already a candidate account with a CV, so we've kept it as a candidate account. To hire with us, create a separate employer account with your work email, or contact the team."
            : "This sign-in already has a candidate account, so we've kept it as it is. To hire with us, create a separate employer account with your work email, or contact the team.",
        );
      })
      .catch(() => !cancelled && setMessage("We couldn't finish setting up your employer account. Please try again or contact the team."));
    return () => {
      cancelled = true;
    };
  }, [router, onboarding]);

  return (
    <div className="w-full max-w-[420px] text-center" role="status">
      <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute mb-3">— Employers</div>
      <h1 className="font-display font-light tracking-[-0.025em] text-[32px]">
        {message ? "Your account type" : "Setting up your employer account…"}
      </h1>
      {message && (
        <>
          <p className="text-sm text-ink-soft mt-4 leading-relaxed">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/app" className="text-[13px] px-5 py-2.5 rounded-full border border-rule hover:border-ink">
              Go to my account
            </Link>
            <Link to="/employers" hash="contact" className="text-[13px] px-5 py-2.5 rounded-full bg-ink text-paper">
              Contact the team
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
