import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppLayout";
import { DataError } from "@/components/app/DataError";

/** Employer portal. Only employer accounts; every server function re-checks this. */
export const Route = createFileRoute("/employer")({
  beforeLoad: ({ context, location }) => {
    if (!context.session.userId) throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    if (context.session.isStaff) throw redirect({ href: "/admin/employer-roles" });
    if (context.session.accountRole !== "employer") throw redirect({ to: "/employers" });
  },
  head: () => ({ meta: [{ title: "Employer portal — UK Talent Link" }, { name: "robots", content: "noindex, nofollow" }] }),
  errorComponent: DataError,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
