"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, firebaseUser, profile, orgs, activeOrgId, activeRole, setActiveOrgId } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/sign-in");
  }, [loading, firebaseUser, router]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-container mx-auto">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!firebaseUser) return null; // redirect in-flight

  if (!profile || orgs.length === 0 || !activeOrgId || !activeRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <EmptyState
          title="Let's set up your organization"
          description="You're signed in, but you don't belong to an organization yet. Create one to start governing your AI systems."
          action={<Button onClick={() => router.push("/onboarding")}>Start onboarding</Button>}
        />
      </div>
    );
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId)!;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={activeRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <EmailVerificationBanner />
        <TopBar org={activeOrg} orgs={orgs} user={profile} onSwitchOrg={setActiveOrgId} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-container w-full mx-auto">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
