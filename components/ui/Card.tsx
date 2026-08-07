import { clsx } from "clsx";

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
          {title && <h3 className="text-headline-md text-on-surface">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
