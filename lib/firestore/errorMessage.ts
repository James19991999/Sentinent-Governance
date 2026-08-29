/**
 * Turns a Firestore error into an actionable message instead of a generic
 * one. Shared across every page with an onSnapshot listener so a real
 * failure (missing index, rules not yet propagated, etc.) never just
 * looks like "no data" or an indefinite loading spinner.
 */
export function firestoreErrorMessage(err: { code?: string }): string {
  if (err.code === "failed-precondition")
    return "This needs a Firestore index that hasn't finished building yet. Check Firebase Console → Firestore → Indexes — this can take a few minutes after deploying.";
  if (err.code === "permission-denied")
    return "Firestore denied this request. If you just deployed security rules, they can take a moment to propagate — try refreshing in a minute.";
  return `Couldn't load this data${err.code ? ` (${err.code})` : ""}. Check your connection and try again.`;
}
