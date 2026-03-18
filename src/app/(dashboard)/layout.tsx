import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";

/**
 * Dashboard layout — requires an authenticated session.
 *
 * Desktop: fixed 240px dark sidebar + scrollable white content area.
 * Mobile:  full-width content + fixed bottom tab bar (64px).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Fixed dark sidebar (desktop only) ── */}
      <Sidebar user={session.user} />

      {/* ── Right column: top navbar + scrollable content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={session.user} />

        <main className="flex-1 overflow-y-auto scroll-area">
          {/* Extra bottom padding on mobile so content isn't hidden behind the tab bar */}
          <div className="px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Fixed bottom tab bar (mobile only) ── */}
      <MobileNav />
    </div>
  );
}
