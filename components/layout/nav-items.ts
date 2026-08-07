import type { LucideIcon } from "lucide-react";
import { ShieldCheck, Search, Workflow, GraduationCap, Settings, CreditCard } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Bottom tab bar on mobile mirrors the Stitch export exactly (Ethics, Bias,
// Workflows, Upskill). Guidelines lives at /guidelines and is labeled
// "Ethics" in the nav to match the export's tab label.
export const primaryNav: NavItem[] = [
  { href: "/guidelines", label: "Ethics", icon: ShieldCheck },
  { href: "/bias-audit", label: "Bias", icon: Search },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/upskilling", label: "Upskill", icon: GraduationCap },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];
