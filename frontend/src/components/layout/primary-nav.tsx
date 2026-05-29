"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "../../lib/utils/cn";

const items: { href: Route; label: string }[] = [
  { href: "/dashboard", label: "Executive" },
  { href: "/customer-analytics", label: "Customer 360" },
  { href: "/calls", label: "Calls" },
  { href: "/agents", label: "Agents" },
  { href: "/metrics", label: "Metrics" },
  { href: "/settings", label: "Settings" },
];

export function PrimaryNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-4 py-3 text-sm font-medium transition-all",
              isActive
                ? "bg-surface-strong text-foreground shadow-card"
                : "text-muted-foreground hover:bg-surface-strong/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
