import { signOut } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { NavbarSearch } from "./NavbarSearch";

// ─── Props ────────────────────────────────────────────────────────────────────

interface NavbarProps {
  user: {
    name?:  string | null;
    email?: string | null;
    image?: string | null;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Top bar rendered inside the main content column (not the sidebar).
 * Contains the global store search input and a user avatar dropdown.
 * Server component — sign-out uses a server action.
 */
export function Navbar({ user }: NavbarProps) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 md:px-8 bg-background/95 backdrop-blur-sm border-b border-border shrink-0">
      {/* ── Global store search (client component) ── */}
      <div className="flex-1 max-w-sm">
        <NavbarSearch />
      </div>

      <div className="flex-1" />

      {/* ── User avatar + dropdown ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-emerald-500/30 transition-all"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-emerald-500/15 text-emerald-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold truncate">{user.name ?? "Account"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/wallet" className="cursor-pointer">
              My Wallet
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/tracker" className="cursor-pointer">
              Spending Tracker
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center text-red-600 hover:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
