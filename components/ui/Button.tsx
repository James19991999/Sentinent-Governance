import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ai" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-secondary text-on-secondary hover:opacity-90",
  secondary: "bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-low",
  ai: "bg-transparent border border-tertiary/40 text-tertiary hover:bg-tertiary-container/5 ai-glow",
  danger: "bg-error text-on-error hover:opacity-90",
  ghost: "bg-transparent text-on-surface hover:bg-surface-container-low",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-body-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
