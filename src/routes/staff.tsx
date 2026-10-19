import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { accountDestination } from "@/lib/account-role";
import { signOutFn } from "@/lib/functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/staff")({
  beforeLoad: ({ context }) => {
    const { session } = context;
    if (!session.userId) throw redirect({ to: "/admin/login" });
    if (session.staffRole || session.isStaff) throw redirect({ href: accountDestination(session) });
  },
  head: () => ({
    meta: [
      { title: "Staff workspace — UK Talent Link" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StaffWorkspace,
});
function StaffWorkspace() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    setBusy(true);
    setMessage("");
    try {
      await router.invalidate();
      setMessage("Access checked. Membership approval is still required.");
    } catch {
      setMessage("Unable to check access. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-paper text-ink md:flex">
      <aside className="w-full md:w-60 shrink-0 border-b md:border-r border-rule p-6">
        <Link to="/" className="font-semibold">
          UK Talent Link
        </Link>
        <p className="mt-6 text-sm font-medium">Staff dashboard</p>
        <p className="mt-2 text-sm text-ink-soft break-words">{session.email}</p>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {session.displayName
              ? `Welcome, ${session.displayName.trim().split(/\s+/)[0]}`
              : "Welcome to your staff workspace"}
          </h1>
          <p className="mt-3 text-ink-soft">
            Your account is created. Complete the remaining steps to access recruitment tools.
          </p>
          <ol className="mt-8 space-y-4">
            {[
              ["Account created", "You can sign in with your existing credentials."],
              [
                "Membership approval required",
                "The account owner must approve your consultant or administrator membership.",
              ],
              [
                "Authenticator verification",
                "Once approved, complete MFA to open your staff dashboard.",
              ],
            ].map(([title, body], i) => (
              <li key={title} className="border border-rule rounded-xl p-5">
                <h2 className="font-semibold">
                  {i + 1}. {title}
                </h2>
                <p className="mt-2 text-sm text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={busy} onClick={refresh}>
              {busy ? "Checking access…" : "Check staff access"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/simulation" search={{ role: "admin" }}>
                Explore staff sample
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await signOutFn();
                await router.navigate({ to: "/admin/login" });
                await router.invalidate();
              }}
            >
              Sign out
            </Button>
          </div>
          {message && (
            <p role="status" className="mt-4 text-sm">
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
