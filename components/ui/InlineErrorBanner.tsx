import { AlertTriangle } from "lucide-react";

/** For pages that degrade gracefully to an empty list on a Firestore error
 * (rather than a full-page error state) — shows what actually happened
 * instead of silently looking like "there's just no data here." */
export function InlineErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 text-body-md bg-error-container/30 border border-error-container rounded p-3 mb-4">
      <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
