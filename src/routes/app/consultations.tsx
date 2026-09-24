import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppLayout";
import { ConsultationBooking } from "@/components/app/ConsultationBooking";

export const Route = createFileRoute("/app/consultations")({
  head: () => ({ meta: [{ title: "Consultations — UK Talent Link" }] }),
  component: ConsultationsPage,
});

function ConsultationsPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="My account"
        title="Consultations"
        lede="Book time with a UK Talent Link consultant about your CV, your job matches or a workplace question. Choose a slot that suits you; you can reschedule or cancel here."
      />
      <ConsultationBooking />
    </div>
  );
}
