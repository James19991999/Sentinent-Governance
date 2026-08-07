import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <p className="text-label-sm text-secondary mb-2">404</p>
      <h1 className="text-headline-md mb-2">This page doesn&apos;t exist</h1>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
        The page you&apos;re looking for may have moved, or the link may be out of date.
      </p>
      <Link href="/dashboard" className="text-secondary font-medium">
        Back to dashboard
      </Link>
    </main>
  );
}
