import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneHeader } from "@/components/layout/StandaloneHeader";

export const metadata: Metadata = { title: "Help Center" };

const FAQS = [
  {
    q: "How is my Responsible AI Score calculated?",
    a: "It's the average Fairness Index across every model you've run a bias audit on. Run more audits to refine it — it starts empty until your first audit.",
  },
  {
    q: "What does the four-fifths rule mean on a bias audit?",
    a: "A widely used disparate-impact threshold: if a group's selection rate falls below 80% (or above 125%) of your reference group's rate, it's flagged as a violation.",
  },
  {
    q: "Who can certify a workflow?",
    a: "Only org owners and admins — members can create workflows, but certification requires elevated review.",
  },
  {
    q: "Can I change my organization's plan?",
    a: "Owners and admins can manage billing from the Billing page, including switching plans or canceling via the subscription portal.",
  },
];

export default function HelpCenterPage() {
  return (
    <>
      <StandaloneHeader />
      <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-headline-md mb-6">Help Center</h1>
      <div className="space-y-4">
        {FAQS.map((item) => (
          <div key={item.q} className="card">
            <h2 className="font-medium text-body-lg mb-1">{item.q}</h2>
            <p className="text-body-md text-on-surface-variant">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="text-body-md text-on-surface-variant mt-8">
        Still stuck?{" "}
        <Link href="/contact" className="text-secondary font-medium">
          Contact IT Support
        </Link>
        .
      </p>
      </main>
    </>
  );
}
