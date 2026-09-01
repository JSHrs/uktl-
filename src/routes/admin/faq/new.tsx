import { createFileRoute } from "@tanstack/react-router";
import { FaqForm } from "./$id";

export const Route = createFileRoute("/admin/faq/new")({
  component: NewFaqPage,
});

function NewFaqPage() {
  return <FaqForm mode="create" />;
}
