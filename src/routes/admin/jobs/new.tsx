import { createFileRoute } from "@tanstack/react-router";
import { JobForm } from "./$id";

export const Route = createFileRoute("/admin/jobs/new")({
  component: NewJobPage,
});

function NewJobPage() {
  return <JobForm mode="create" />;
}
