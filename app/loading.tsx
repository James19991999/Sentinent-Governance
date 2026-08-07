export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading...</span>
      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    </div>
  );
}
