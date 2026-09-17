import { DataError } from "@/components/app/DataError";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppLayout";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Talent Compass — UK Talent Link" },
      {
        name: "description",
        content:
          "Internal CV parsing and candidate-to-mandate matching workspace.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  errorComponent: DataError,
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

