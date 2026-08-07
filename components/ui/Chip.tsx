import { clsx } from "clsx";

type ChipTone = "success" | "warning" | "error" | "neutral" | "ai";

const toneClasses: Record<ChipTone, string> = {
  success: "bg-secondary-container text-on-secondary-container",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container text-on-surface-variant",
  ai: "bg-tertiary-container/10 text-tertiary border border-tertiary/20",
};

export function Chip({ tone = "neutral", children }: { tone?: ChipTone; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-label-sm font-mono", toneClasses[tone])}>
      {children}
    </span>
  );
}
