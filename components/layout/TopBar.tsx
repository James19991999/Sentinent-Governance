"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { Organization, UserProfile } from "@/lib/types";

export function TopBar({
  org,
  orgs,
  user,
  onSwitchOrg,
}: {
  org: Organization;
  orgs: Organization[];
  user: UserProfile;
  onSwitchOrg?: (orgId: string) => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 md:px-6 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="flex-1 flex items-center gap-2 max-w-md">
        <label htmlFor="global-search" className="sr-only">
          Search
        </label>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            placeholder="Search models, workflows, courses..."
            className="w-full rounded border border-outline-variant bg-surface-container-low pl-9 pr-3 py-2 text-body-md focus:border-secondary focus:border-2 focus:outline-none"
          />
        </div>
      </div>

      {orgs.length > 1 && (
        <label className="hidden sm:block">
          <span className="sr-only">Switch organization</span>
          <select
            value={org.id}
            onChange={(e) => onSwitchOrg?.(e.target.value)}
            className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        aria-label="Notifications"
        className="relative p-2 rounded hover:bg-surface-container-low text-on-surface-variant"
      >
        <Bell size={20} />
      </button>

      <Link href="/settings" className="flex items-center gap-2" aria-label="Account settings">
        <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-sm font-medium">
          {user.displayName?.[0]?.toUpperCase() ?? "?"}
        </span>
      </Link>
    </header>
  );
}
