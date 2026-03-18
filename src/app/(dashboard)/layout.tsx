import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? { name: "Guest", email: "", image: "" };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}