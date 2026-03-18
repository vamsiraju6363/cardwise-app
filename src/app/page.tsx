import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Root page — redirects authenticated users to the dashboard,
 * unauthenticated users to the login page.
 */
export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }
  redirect("/login");
}
