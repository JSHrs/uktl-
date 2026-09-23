import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
export const Route = createFileRoute("/terms")({ component: Terms });
function Terms() {
  return (
    <SiteLayout>
      <article className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="font-display text-4xl">Using Talent Compass</h1>
        <p>
          Talent Compass helps candidates review their CVs, discover vacancies and access workplace
          guidance through UK Talent Link.
        </p>
        <section>
          <h2 className="font-display text-2xl mb-2">Your account and uploads</h2>
          <p>
            Keep your credentials private and provide accurate information. Only upload documents
            you are entitled to share. Do not upload malicious files, impersonate another person or
            attempt to access someone else’s records.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-2">Assessments and vacancies</h2>
          <p>
            AI-generated extraction, scores and suggestions can contain errors. Review and correct
            your profile and request human review when needed. Job availability can change, and a
            match or expression of interest does not guarantee an interview, an application to an
            external employer or employment.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-2">Workplace guidance</h2>
          <p>
            General workplace information is not a substitute for advice on your individual
            circumstances. Use the consultation option or contact a qualified adviser where
            appropriate.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-2">Questions and information</h2>
          <p>
            Contact the team about account problems, corrections, service details or privacy
            requests.
          </p>
          <Link to="/contact" className="inline-block underline mt-3">
            Contact the team
          </Link>
          <Link to="/privacy" className="inline-block underline mt-3 ml-6">
            Your information
          </Link>
        </section>
      </article>
    </SiteLayout>
  );
}
