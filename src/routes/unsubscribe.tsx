import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { DesignPage } from "@/components/site/ds";
import { unsubscribeCampaignsFn } from "@/lib/campaign-functions";
export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s) => ({
    token: typeof s.token === "string" && /^[0-9a-f]{64}$/.test(s.token) ? s.token : "",
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: Unsubscribe,
});
function Unsubscribe() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function unsubscribe() {
    setState("busy");
    try {
      await unsubscribeCampaignsFn({ data: { token } });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <SiteLayout>
      <DesignPage>
        <section className="wrap" style={{ minHeight: "80vh", display: "grid", justifyItems: "center", alignContent: "center", paddingTop: 180, paddingBottom: 80 }}>
          <div
            className="card"
            style={{ maxWidth: 520, width: "100%", padding: 36, borderRadius: 16, display: "grid", gap: 20 }}
          >
            <div className="eyebrow">Email preferences</div>
            <h1 className="disp" style={{ fontSize: "clamp(32px, 5cqi, 44px)" }}>
              {state === "done" ? (
                <>
                  You're <em>unsubscribed.</em>
                </>
              ) : (
                <>
                  Choose what we <em>send you.</em>
                </>
              )}
            </h1>
            {state === "done" ? (
              <p className="soft" role="status">
                You won't get job updates or campaigns. Appointment emails and individual messages from your consultant
                are separate and still arrive.
              </p>
            ) : token ? (
              <>
                <p className="soft">
                  Stop bulk job updates and campaigns. Appointment emails and individual recruitment messages are
                  separate and are not affected.
                </p>
                <button type="button" className="btn btn-ink btn-lg" disabled={state === "busy"} onClick={unsubscribe}>
                  {state === "busy" ? "Saving…" : "Unsubscribe from job updates"}
                </button>
                {state === "error" && (
                  <p role="alert" style={{ color: "var(--bad)", fontSize: 14 }}>
                    We couldn't save your preference. Please try again.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="soft">
                  To stop job updates, use the unsubscribe link at the foot of any of those emails, or sign in and change
                  your preferences on your account's Messages page.
                </p>
                <Link to="/app/messages" className="btn btn-ink btn-lg">
                  Manage preferences in your account
                </Link>
              </>
            )}
            <Link to="/" className="lnk" style={{ justifySelf: "start" }}>
              Back to the site
            </Link>
          </div>
        </section>
      </DesignPage>
    </SiteLayout>
  );
}
