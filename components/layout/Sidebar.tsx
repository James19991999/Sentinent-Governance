"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { ChevronsLeft, ChevronsRight, LayoutDashboard } from "lucide-react";
import { primaryNav, secondaryNav } from "./nav-items";
import type { Role } from "@/lib/types";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const items = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, ...primaryNav];
  const visibleSecondary = role === "member" ? secondaryNav.filter((i) => i.href !== "/billing") : secondaryNav;

  return (
    <nav
      aria-label="Primary"
      className={clsx(
        "hidden md:flex flex-col shrink-0 border-r border-outline-variant bg-surface-container-lowest h-screen sticky top-0 transition-all",
        collapsed ? "w-[76px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-outline-variant">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary shrink-0">
          <span aria-hidden="true">⛨</span>
        </div>
        {!collapsed && <span className="font-display font-semibold text-body-lg truncate">Sentient Governance</span>}
      </div>

      <ul className="flex-1 py-4 px-2 space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-body-md transition-colors",
                  active
                    ? "bg-secondary-container text-on-secondary-container font-medium"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <ul className="px-2 pb-2 space-y-1 border-t border-outline-variant pt-2">
        {visibleSecondary.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-body-md transition-colors",
                  active
                    ? "bg-secondary-container text-on-secondary-container font-medium"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center h-12 border-t border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </nav>
  );
}
