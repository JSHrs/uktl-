import { TwoStepSetting } from "@/components/app/TwoStepSetting";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppLayout";
import { CompanyForm } from "@/components/app/EmployerForms";
import { myEmployerProfileFn, saveEmployerProfileFn } from "@/lib/employer-functions";

export const Route = createFileRoute("/employer/company")({
  loader: () => myEmployerProfileFn(),
  head: () => ({ meta: [{ title: "Company and settings — UK Talent Link" }] }),
  component: Company,
});

function Company() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Employer portal"
        title="Company and settings"
        lede="Your consultant uses these to brief candidates once they're interested. They aren't published."
      />
      <CompanyForm
        initial={profile}
        submitLabel="Save company details"
        secondary={
          <Link to="/employer" className="min-h-11 inline-flex items-center rounded-full border border-rule px-5 text-[14px]">
            Cancel
          </Link>
        }
        onSubmit={async (v) => {
          await saveEmployerProfileFn({ data: v });
          toast.success("Company details saved");
          await router.navigate({ to: "/employer" });
        }}
      />
      <TwoStepSetting />
    </div>
  );
}
