import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneHeader } from "@/components/layout/StandaloneHeader";

export const metadata: Metadata = { title: "Contact IT Support" };

export default function ContactPage() {
  return (
    <>
      <StandaloneHeader />
      <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-headline-md mb-2">Contact IT Support</h1>
      <p className="text-body-md text-on-surface-variant mb-8">
        For account access issues, SSO configuration, or billing questions, reach your organization&apos;s admin
        first — they can manage most account settings directly from{" "}
        <Link href="/settings" className="text-secondary font-medium">
          Settings
        </Link>
        . For platform-level issues, email <a href="mailto:support@sentient-governance.example.com" className="text-secondary font-medium">support@sentient-governance.example.com</a>.
      </p>
      <div className="card">
        <h2 className="font-medium text-body-lg mb-2">Common self-service fixes</h2>
        <ul className="list-disc pl-5 space-y-1 text-body-md text-on-surface-variant">
          <li>Can&apos;t sign in — use the &quot;Forgot password&quot; link on the sign-in page.</li>
          <li>Need a role change — ask an owner/admin on your team; role changes happen in your org roster.</li>
          <li>Billing question — owners and admins can open the billing portal from the Billing page.</li>
        </ul>
      </div>
      </main>
    </>
  );
}
