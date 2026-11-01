import { createFileRoute } from "@tanstack/react-router";
import { EmployerHome } from "@/components/app/EmployerHome";
import { myEmployerProfileFn, myEmployerRolesFn } from "@/lib/employer-functions";

export const Route = createFileRoute("/employer/")({
  loader: async () => {
    const [profile, roles] = await Promise.all([myEmployerProfileFn(), myEmployerRolesFn()]);
    return { profile, roles };
  },
  component: EmployerIndex,
});

function EmployerIndex() {
  const { profile, roles } = Route.useLoaderData();
  return <EmployerHome profile={profile} roles={roles} />;
}
