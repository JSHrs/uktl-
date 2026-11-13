import { Link } from "@tanstack/react-router";

/**
 * "Sign in | Create account" toggle shared by the sign-in page and step 1 of
 * onboarding, so the header's Sign in and Register links open the matching side.
 */
export function AuthTabs({ active, forType, redirect }: { active: "login" | "register"; forType?: "candidate" | "employer"; redirect?: string }) {
  const base = "flex-1 text-center rounded-full py-2 text-[13px] transition-colors";
  const on = "bg-ink text-paper";
  const off = "text-ink-mute hover:text-ink";
  return (
    <nav aria-label="Account" className="flex gap-1 p-1 mb-8 border border-rule rounded-full">
      <Link
        to="/auth/login"
        search={redirect ? { redirect } : {}}
        aria-current={active === "login" ? "page" : undefined}
        className={`${base} ${active === "login" ? on : off}`}
      >
        Sign in
      </Link>
      <Link
        to="/onboarding"
        search={{ for: forType ?? "candidate", step: 1 }}
        aria-current={active === "register" ? "page" : undefined}
        className={`${base} ${active === "register" ? on : off}`}
      >
        Create account
      </Link>
    </nav>
  );
}
