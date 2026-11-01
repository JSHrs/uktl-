import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleStatusPill } from "@/components/app/EmployerForms";
import { staffEmployerRolesFn } from "@/lib/employer-functions";
import { AdminHeader, AdminTable, AdminTd, AdminTr } from "../../admin";

const STATUSES = ["submitted", "live", "closed", "withdrawn"] as const;

export const Route = createFileRoute("/admin/employer-roles/")({
  validateSearch: (s): { status?: (typeof STATUSES)[number] } => ({
    status: STATUSES.includes(s.status as (typeof STATUSES)[number]) ? (s.status as (typeof STATUSES)[number]) : undefined,
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ deps }) => staffEmployerRolesFn({ data: { status: deps.status } }),
  component: EmployerRoles,
});

function EmployerRoles() {
  const roles = Route.useLoaderData();
  const { status } = Route.useSearch();
  return (
    <>
      <AdminHeader
        title="Employer roles"
        sub="Roles employers post in their portal. Review and publish each as a mandate, then share anonymised candidates with the employer."
      />
      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2 text-[13px]">
        <Link to="/admin/employer-roles" search={{}} className={`px-3 py-1 rounded-full border ${!status ? "border-ink text-ink" : "border-rule text-ink-soft"}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} to="/admin/employer-roles" search={{ status: s }} className={`px-3 py-1 rounded-full border capitalize ${status === s ? "border-ink text-ink" : "border-rule text-ink-soft"}`}>
            {s}
          </Link>
        ))}
      </nav>
      {roles.length === 0 ? (
        <p className="text-ink-soft text-sm">No employer roles{status ? ` with status "${status}"` : ""} yet.</p>
      ) : (
        <AdminTable head={["Role", "Employer", "Posted", "Shared", "Status"]}>
          {roles.map((r) => (
            <AdminTr key={r.id}>
              <AdminTd>
                <Link to="/admin/employer-roles/$id" params={{ id: r.id }} className="font-medium text-ink hover:underline">
                  {r.title}
                </Link>
                <div className="text-[12px] text-ink-mute">{[r.location, r.sector].filter(Boolean).join(" · ")}</div>
              </AdminTd>
              <AdminTd>
                <div>{r.company_name ?? "No company details"}</div>
                <div className="text-[12px] text-ink-mute">{r.owner_email}</div>
              </AdminTd>
              <AdminTd className="whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("en-GB")}</AdminTd>
              <AdminTd className="tabular-nums">
                {r.shared}
                {r.interested > 0 && <span className="text-accent"> · {r.interested} interested</span>}
              </AdminTd>
              <AdminTd>
                <RoleStatusPill status={r.status} />
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
