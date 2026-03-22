"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, CreditCard, BarChart3, Settings } from "lucide-react";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/discover", label: "Search",  icon: Search    },
  { href: "/wallet",   label: "Wallet",  icon: CreditCard },
  { href: "/tracker",  label: "Tracker", icon: BarChart3  },
  { href: "/settings", label: "Settings", icon: Settings  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fixed bottom tab bar — visible on mobile only (hidden on md and above).
 * Four icon tabs: Search, Wallet, Tracker, Settings.
 * Active tab is highlighted with the emerald accent color.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "md:hidden",
        "fixed bottom-0 inset-x-0 z-50",
        "flex items-stretch",
        "bg-white border-t border-gray-200",
        "h-16",
        // Safe area inset for notched phones
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/discover"
            ? pathname === "/discover"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1",
              "text-[10px] font-medium transition-colors duration-150",
              isActive
                ? "text-emerald-600"
                : "text-gray-400 hover:text-gray-600",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-emerald-500" : "text-gray-400",
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
