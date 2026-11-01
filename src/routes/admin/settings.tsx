import { createFileRoute } from "@tanstack/react-router";
import { TwoStepSetting } from "@/components/app/TwoStepSetting";
import { AdminHeader } from "../admin";

/** Staff account settings. Two-step verification is optional (owner decision, 1 Nov 2026). */
export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — UK Talent Link" }] }),
  component: () => (
    <>
      <AdminHeader title="Settings" sub="Your staff account." />
      <div className="max-w-2xl">
        <TwoStepSetting />
      </div>
    </>
  ),
});
