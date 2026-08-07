"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";

function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, firebaseUser } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/sign-in");
  }, [loading, firebaseUser, router]);

  if (loading) {
    return (
      <div className="p-6 max-w-md mx-auto mt-24">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!firebaseUser) return null;
  return <>{children}</>;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>{children}</Guard>
    </AuthProvider>
  );
}
