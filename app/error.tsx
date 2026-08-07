"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main role="alert" className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-headline-md mb-2">Something went wrong</h1>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
        An unexpected error occurred. You can try again, or come back later if it persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
