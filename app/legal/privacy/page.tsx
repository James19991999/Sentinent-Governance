import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-headline-md mb-2">Privacy Policy</h1>
      <p className="text-label-sm text-on-surface-variant mb-8">
        Draft template — review with counsel before relying on this for a live deployment. Last updated: 2026.
      </p>

      <div className="space-y-6 text-body-md text-on-surface">
        <section>
          <h2 className="font-medium text-body-lg mb-2">1. What we collect</h2>
          <p>
            Account information (name, email, organization), authentication data managed by our identity provider,
            billing information handled by our payment processor (we do not store card numbers ourselves), and the
            data you upload for fairness audits, workflow definitions, and compliance checklists.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">2. Protected-attribute data in bias audits</h2>
          <p>
            The bias-detection feature requires you to upload prediction data that includes a protected-attribute
            or group column (e.g. demographic group) in order to compute disparate-impact and parity metrics. This
            data is stored scoped to your organization and is never shared across organizations. You are
            responsible for ensuring you have a lawful basis to process this data.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">3. How data is isolated</h2>
          <p>
            Every record is tagged with your organization&apos;s ID and access is enforced both by our application
            servers and by database-level security rules, so that only members of your organization can read your
            organization&apos;s data.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">4. Third parties</h2>
          <p>
            We use a payment processor to handle subscription billing and an authentication provider to handle
            sign-in. Neither receives access to your uploaded prediction data, workflow definitions, or compliance
            records.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">5. Data retention and deletion</h2>
          <p>
            You may request deletion of your account and associated organization data by contacting us. We retain
            audit-log entries for a limited period for security and compliance purposes even after a request.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-body-lg mb-2">6. Contact</h2>
          <p>Questions about this policy can be sent through our Contact page.</p>
        </section>
      </div>
    </>
  );
}
