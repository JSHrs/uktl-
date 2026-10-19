import { createFileRoute } from "@tanstack/react-router";
import { SimulationExperience } from "@/components/app/SimulationExperience";

export const Route = createFileRoute("/simulation")({
  validateSearch: (search): { role: "candidate" | "admin" } => ({ role: search.role === "admin" ? "admin" : "candidate" }),
  head: () => ({ meta: [
    { title: "Talent Compass — Candidate & Admin Simulation" },
    { name: "description", content: "Explore the Talent Compass candidate and admin sample workspaces, CV assessment and HR knowledge library." },
    { property: "og:title", content: "Talent Compass — Candidate & Admin Simulation" },
    { property: "og:description", content: "Sample recruitment workspaces with guided setup, example CV assessment and placeholder videos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: SimulationPage,
});
function SimulationPage() { const { role } = Route.useSearch(); return <SimulationExperience initialRole={role} />; }