import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppLayout";
import { RoleForm } from "@/components/app/EmployerForms";
import { submitEmployerRoleFn } from "@/lib/employer-functions";

export const Route = createFileRoute("/employer/roles/new")({
  head: () => ({ meta: [{ title: "Post a role — UK Talent Link" }] }),
  component: NewRole,
});

function NewRole() {
  const router = useRouter();
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Employer portal"
        title="Post a role"
        lede="A consultant reviews every role before the search starts, usually within one working day. You can edit it until then."
      />
      <RoleForm
        submitLabel="Send to UKTL"
        secondary={
          <Link to="/employer" className="min-h-11 inline-flex items-center rounded-full border border-rule px-5 text-[14px]">
            Cancel
          </Link>
        }
        onSubmit={async (v) => {
          const { id } = await submitEmployerRoleFn({ data: v });
          toast.success("Role sent. A consultant will review it, usually within one working day.");
          await router.navigate({ to: "/employer/roles/$id", params: { id } });
        }}
      />
    </div>
  );
}
