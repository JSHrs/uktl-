import { Link } from "@tanstack/react-router";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
/** Fictional samples stay separate from all recruitment records. */
export function CvSimulation() {
  return <section className="max-w-[720px] my-8 border-y border-rule py-6">
    <div className="flex gap-3 items-center"><FileText className="text-accent" /><h2 className="font-display text-2xl">Prebuilt CV assessment</h2></div>
    <p className="my-3 text-sm text-ink-soft">Sample CV, quality score and improvement report. No upload required; no real recruitment data changes.</p>
    <Button asChild variant="outline"><Link to="/simulation" search={{ role: "candidate", view: "cv" }}>Open sample assessment <ArrowRight /></Link></Button>
  </section>;
}
