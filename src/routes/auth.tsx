import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-[18px] font-medium tracking-[-0.02em] text-ink"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
        >
          UK Talent <em className="not-italic font-normal text-ink-soft italic">Link</em>
        </Link>
        <Link
          to="/"
          className="text-sm text-ink-mute hover:text-ink transition-colors"
        >
          ← Back to site
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Outlet />
      </main>
      <footer className="border-t border-rule px-6 py-4 text-center">
        <p className="font-mono text-[11px] text-ink-mute tracking-[0.08em]">
          UK TALENT LINK · TALENT COMPASS PLATFORM
        </p>
      </footer>
    </div>
  );
}
