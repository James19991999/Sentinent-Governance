"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { primaryNav } from "./nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around border-t border-outline-variant bg-surface-container-lowest h-16"
    >
      {primaryNav.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-label-sm",
              active ? "text-secondary" : "text-on-surface-variant"
            )}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
