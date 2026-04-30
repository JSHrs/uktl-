import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/Shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — UK Talent Link" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
