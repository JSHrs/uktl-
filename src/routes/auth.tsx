import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Nav variant="solid" />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Outlet />
      </main>
    </div>
  );
}
