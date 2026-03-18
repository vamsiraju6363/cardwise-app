"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  Search,
  BarChart3,
  Settings,
  LogOut,
  ChevronUp,
} from "lucide-react";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/",        label: "Find a Store",      icon: Search    },
  { href: "/wallet",  label: "My Wallet",          icon: CreditCard },
  { href: "/tracker", label: "Spending Tracker",   icon: BarChart3  },
  { href: "/settings", label: "Settings",          icon: Settings   },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  user: {
    name?:  string | null;
    email?: string | null;
    image?: string | null;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fixed 240px dark sidebar — desktop only (hidden below md breakpoint).
 * Contains the CardWise logo, nav links, and a user menu at the bottom.
 */
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? "?").toUpperCase();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-[240px] shrink-0",
        "bg-slate-900 border-r border-slate-800",
        "h-screen sticky top-0 overflow-y-auto",
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
          <CreditCard className="h-4.5 w-4.5 text-emerald-400" strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">CardWise</span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menu
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-all duration-150",
                isActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-emerald-400"
                    : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User section ── */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5",
                "text-sm text-slate-300 hover:bg-slate-800 hover:text-white",
                "transition-colors duration-150 group",
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user.name ?? "Account"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <ChevronUp className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-52 bg-slate-800 border-slate-700 text-slate-200"
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="text-slate-200 hover:text-white focus:text-white cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
