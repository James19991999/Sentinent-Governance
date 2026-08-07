import { Button } from "./Button";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-16 px-6 border border-error-container rounded-lg bg-error-container/20"
    >
      <h3 className="text-headline-md text-on-error-container mb-2">{title}</h3>
      <p className="text-body-md text-on-surface-variant max-w-md mb-6">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
