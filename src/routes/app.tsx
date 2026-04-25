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
  component: AppLayoutRoute,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h1 className="font-display text-3xl mb-4">Talent Compass is offline in preview</h1>
        <p className="text-ink-soft mb-6">
          This workspace requires Cloudflare bindings (D1, R2, AI) that are only
          available in the deployed Worker environment. Run via{" "}
          <code className="font-mono text-sm">wrangler dev</code> to use it locally.
        </p>
        <pre className="text-left font-mono text-xs bg-paper-deep p-4 rounded overflow-auto text-ink-mute">
          {error.message}
        </pre>
      </div>
    </AppShell>
  ),
});

function AppLayoutRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
