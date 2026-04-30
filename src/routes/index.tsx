import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/site/PublicSite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UK Talent Link — HR Consultancy, Recruitment & Employment Law" },
      {
        name: "description",
        content:
          "London-based HR consultancy and recruitment firm — strategic HR support, executive search, and UK employment law expertise across the UK and Middle East.",
      },
      {
        property: "og:title",
        content: "UK Talent Link — HR Consultancy, Recruitment & Employment Law",
      },
      {
        property: "og:description",
        content:
          "Specialist HR, recruitment, and employment law services for ambitious businesses.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PublicSite,
});
