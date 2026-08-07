import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <h1 className="text-headline-md mb-2">Terms of Service</h1>
      <p className="text-label-sm text-on-surface-variant mb-8">
        Draft template — review with counsel before relying on this for a live deployment. Last updated: 2026.
      </p>

      <div className="space-y-6 text-body-md text-on-surface">
        <section>
          <h2 className="font-medium text-body-lg mb-2">1. Acceptance of terms</h2>
          <p>
            By creating an account or otherwise accessing Sentient Governance (the &quot;Service&quot;), you agree to
            be bound by these Terms of Service. If you are accepting on behalf of an organization, you represent
            that you have the authority to bind that organization.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">2. What the Service does</h2>
          <p>
            The Service computes statistical fairness metrics (disparate impact ratio, statistical parity
            difference, and related measures) over model-prediction data you upload, tracks ethics-certification
            status for automation workflows you define, and provides responsible-AI training content. Fairness
            metrics are derived entirely from the data you supply; the Service does not audit your underlying
            models directly and does not guarantee legal compliance with any specific regulation.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">3. Your data</h2>
          <p>
            You retain ownership of all data you upload, including prediction datasets, workflow definitions, and
            compliance records. You are responsible for having the right to upload and process that data, including
            any protected-attribute or demographic data used in fairness audits.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">4. Subscriptions and billing</h2>
          <p>
            Paid plans are billed on a recurring basis through our payment processor. You may cancel at any time
            through the billing portal; cancellation takes effect at the end of the current billing period.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">5. Termination</h2>
          <p>
            Either party may terminate this agreement at any time. Upon termination, your right to access the
            Service ends, and we will retain your data only as long as necessary to comply with legal obligations
            or as described in our Privacy Policy.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">6. Disclaimer</h2>
          <p>
            The Service is provided &quot;as is.&quot; Fairness scores and compliance-risk labels are decision-support
            tools, not legal determinations — you remain responsible for your organization&apos;s regulatory
            compliance.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">7. Contact</h2>
          <p>Questions about these terms can be sent through our Contact page.</p>
        </section>
      </div>
    </>
  );
}
