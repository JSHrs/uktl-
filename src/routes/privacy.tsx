import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
export const Route = createFileRoute("/privacy")({ component: Privacy });
function Privacy() {
  return (
    <SiteLayout>
      <article className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="font-display text-4xl">Your information</h1>
        <p>
          UK Talent Link uses the information you provide to operate your candidate account, assess
          your CV, suggest relevant vacancies and respond to workplace questions or consultation
          requests.
        </p>
        <section>
          <h2 className="font-display text-2xl mb-2">What the platform processes</h2>
          <p>
            Account contact details, uploaded CVs and extracted career information, assessment
            results, job interests, workplace questions, consultation records and technical security
            records. Avoid including unnecessary sensitive information in your CV or questions.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-2">AI and service providers</h2>
          <p>
            CV assessment and some guidance use Anthropic’s AI service. The platform also uses
            infrastructure, private file security, vacancy, booking and email services to deliver
            the relevant features. AI assessments may be incomplete or incorrect. You can correct
            your extracted profile and ask the team to review a result; a score is not an employment
            decision.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-2">Access and your requests</h2>
          <p>
            Candidate records are restricted to the account owner and authorized firm staff. From
            your profile you can download a self-service data copy, request a full reviewed export
            or ask for erasure. The team reviews the scope of requests, records held by service
            providers and any applicable retention requirements before confirming completion.
          </p>
          <Link className="inline-block underline mt-3" to="/app/profile">
            Manage your data
          </Link>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-2">Cookies and retention questions</h2>
          <p>
            Sign-in uses session cookies to keep your account secure. Contact the team for the
            retention period and handling arrangements applicable to your records, or to raise a
            privacy concern.
          </p>
          <a className="inline-block underline mt-3" href="mailto:info@uktalentlink.co.uk">
            Contact UK Talent Link
          </a>
        </section>
      </article>
    </SiteLayout>
  );
}
