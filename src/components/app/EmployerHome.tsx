import { Link, useRouteContext } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/app/AppLayout";
import { AccountType } from "@/components/app/AccountType";
import { RoleStatusPill } from "@/components/app/EmployerForms";

type Profile = { company_name: string; sectors: string[]; hiring_markets: string[]; services: string[] } | null;
type RoleRow = {
  id: string;
  title: string;
  location: string | null;
  status: string;
  created_at: number;
  shared: number;
  awaiting: number;
};

const day = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The employer's portal home: their roles, candidates awaiting a response, and the
 * company profile. Employers never see candidate records; consultants share
 * anonymised candidates on each role.
 */
export function EmployerHome({ profile, roles }: { profile: Profile; roles: RoleRow[] }) {
  const { session } = useRouteContext({ from: "__root__" });
  const first = session.displayName?.trim().split(/\s+/)[0];
  const live = roles.filter((r) => r.status === "live").length;
  const review = roles.filter((r) => r.status === "submitted").length;
  const awaiting = roles.reduce((n, r) => n + r.awaiting, 0);

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow={profile?.company_name ?? "Employer portal"}
        title={first ? `Welcome, ${first}` : "Your employer portal"}
        lede="Post a role and a consultant takes it from there: a search across the UK and the Gulf, assessment against your must-haves, and candidates shared here with the reasons for each."
        actions={
          <Link to="/employer/roles/new" className="min-h-11 inline-flex items-center rounded-full bg-ink text-paper px-5 text-[14px]">
            Post a role
          </Link>
        }
      />

      {!profile && (
        <div className="mb-8 rounded-lg border border-accent/25 bg-accent-soft p-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-ink">
            <b className="font-medium">Tell us about your company.</b> Your consultant uses it to brief candidates once
            they're interested.
          </p>
          <Link to="/employer/company" className="text-[13px] underline">
            Add company details
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Live searches" value={live} />
        <StatCard label="With UKTL for review" value={review} />
        <StatCard label="Candidates awaiting you" value={awaiting} accent={awaiting > 0} />
      </div>

      <Section
        title="Your roles"
        actions={
          roles.length > 0 && (
            <Link to="/employer/roles/new" className="text-[13px] underline">
              Post another role
            </Link>
          )
        }
      >
        {roles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rule p-8 text-center">
            <h3 className="font-display text-xl">No roles yet</h3>
            <p className="mt-2 text-[14px] text-ink-soft max-w-[52ch] mx-auto">
              Post your first role with the must-haves and a few lines about the team. A consultant reviews it, usually
              within one working day, and starts the search.
            </p>
            <Link to="/employer/roles/new" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink text-paper px-5 text-[14px]">
              Post a role
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-rule border border-rule rounded-lg">
            {roles.map((r) => (
              <li key={r.id}>
                <Link to="/employer/roles/$id" params={{ id: r.id }} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 hover:bg-paper-deep/50">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-ink">{r.title}</div>
                    <div className="text-[12px] text-ink-mute">
                      {[r.location, `Posted ${day(r.created_at)}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className="text-[13px] text-ink-soft tabular-nums">
                    {r.shared} shared{r.awaiting > 0 && <b className="text-accent font-medium"> · {r.awaiting} awaiting you</b>}
                  </span>
                  <RoleStatusPill status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-6 md:grid-cols-2 mt-10">
        <section className="rounded-lg border border-rule p-6 bg-paper-deep">
          <h2 className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">How it works</h2>
          <ol className="mt-4 space-y-3 text-[14px] text-ink-soft">
            <li><b className="text-ink font-medium">1 · Post a role.</b> The must-haves, the team and the timing.</li>
            <li><b className="text-ink font-medium">2 · We review and search.</b> A consultant confirms the brief and searches the UK and the Gulf.</li>
            <li><b className="text-ink font-medium">3 · Candidates appear here.</b> Ranked, with strengths and gaps. Tell us who you'd like to meet.</li>
          </ol>
        </section>
        <section className="rounded-lg border border-rule p-6">
          <h2 className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-mute">Company and contact</h2>
          <p className="mt-3 text-[14px] text-ink-soft">
            {profile ? (
              <>
                <b className="text-ink font-medium">{profile.company_name}</b>
                {profile.hiring_markets.length > 0 && <> · hiring in {profile.hiring_markets.join(", ")}</>}
              </>
            ) : (
              "No company details yet."
            )}
          </p>
          <p className="mt-2 text-[13px]">
            <Link to="/employer/company" className="underline">Edit company details</Link>
          </p>
          <p className="mt-4 text-[14px]">
            <a href="tel:+442071892857" className="hover:underline">+44 (0)20 7189 2857</a> ·{" "}
            <a href="mailto:info@uktalentlink.co.uk" className="hover:underline">info@uktalentlink.co.uk</a>
          </p>
        </section>
      </div>

      <Section title="Candidate privacy">
        <p className="text-[14px] text-ink-soft max-w-[68ch]">
          Candidates are shared anonymously, with a consultant's summary, a match score and the strengths and gaps against
          your must-haves. Names, contact details and CVs are introduced by your consultant, with the candidate's agreement,
          when you'd like to meet someone.
        </p>
      </Section>

      <AccountType role="employer" />
    </div>
  );
}
