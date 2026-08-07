import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded bg-surface-container-high", className)} aria-hidden="true" />;
}
