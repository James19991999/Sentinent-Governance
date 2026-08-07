import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Search, Workflow, GraduationCap, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Sentient Governance | Responsible AI Oversight for the Enterprise",
  description:
    "Audit model bias with real statistical fairness metrics, certify automation workflows, and get your workforce AI-ready — all in one governance platform.",
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "Ethical AI Guidelines",
    body: "A living framework library — transparency, fairness, and accountability protocols your teams can actually apply, with a built-in compliance checklist per project.",
  },
  {
    icon: Search,
    title: "Technical Bias Audits",
    body: "Upload real model predictions and get back statistically computed disparate-impact ratios, demographic parity, and equal-opportunity metrics — not a guess.",
  },
  {
    icon: Workflow,
    title: "Automation Workflows",
    body: "Track every AI-driven business process and its ethics-certification status in one place, from resume screening to invoice processing.",
  },
  {
    icon: GraduationCap,
    title: "Upskilling Hub",
    body: "A responsible-AI certification pathway for your whole org, with course tracking and a team leaderboard.",
  },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Sentient Governance",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Enterprise AI governance platform: real statistical bias audits, ethics-certified automation workflows, and a responsible-AI upskilling hub.",
    offers: {
      "@type": "Offer",
      price: "499",
      priceCurrency: "USD",
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-secondary-container/20 to-surface">
        <div className="max-w-container mx-auto px-6 py-24 text-center">
          <h1 className="text-display-lg-mobile md:text-display-lg text-on-surface mb-6">
            Govern your AI systems like they&apos;re production infrastructure.
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
            Sentient Governance gives enterprise teams one place to audit model bias with real statistics, certify
            automation workflows, and build a workforce that understands responsible AI.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded bg-secondary text-on-secondary px-6 py-3 font-medium"
            >
              Start free trial <ArrowRight size={18} />
            </Link>
            <Link
              href="#pillars"
              className="inline-flex items-center gap-2 rounded border border-outline-variant px-6 py-3 font-medium"
            >
              See what it covers
            </Link>
          </div>
        </div>
      </section>

      <section id="pillars" className="max-w-container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {pillars.map((p) => (
            <div key={p.title} className="card">
              <p.icon className="text-secondary mb-3" size={28} aria-hidden="true" />
              <h2 className="text-headline-md mb-2">{p.title}</h2>
              <p className="text-body-md text-on-surface-variant">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-container mx-auto px-6 py-20 text-center border-t border-outline-variant">
        <h2 className="text-headline-md mb-4">Ready to bring your AI systems under real oversight?</h2>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 rounded bg-secondary text-on-secondary px-6 py-3 font-medium"
        >
          Get started <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
