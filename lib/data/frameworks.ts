export interface Framework {
  id: string;
  name: string;
  description: string;
  status: "active" | "critical" | "standard";
  metric: string;
}

export const FRAMEWORK_LIBRARY: Framework[] = [
  {
    id: "transparency",
    name: "Transparency Frameworks",
    description: "Documentation standards for model training data, architectural decisions, and decision-making logic pathways.",
    status: "active",
    metric: "2 Protocols",
  },
  {
    id: "fairness",
    name: "Fairness & Non-Bias",
    description: "Metric-driven approach to identifying and mitigating protected-class bias in predictive modeling and generative outputs.",
    status: "critical",
    metric: "5 Audit Tests",
  },
  {
    id: "accountability",
    name: "Accountability Chain",
    description: "Defines stakeholder responsibility matrix for AI-driven outcomes and establishes clear human-in-the-loop triggers.",
    status: "standard",
    metric: "5 Key Roles",
  },
];

export const DEFAULT_COMPLIANCE_ITEMS = [
  "Data Lineage Audit",
  "Bias Impact Assessment",
  "Red-Teaming Protocol",
  "Model Interpretability",
];
