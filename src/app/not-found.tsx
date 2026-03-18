import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX, Home } from "lucide-react";

/**
 * 404 page — shown when a route doesn't exist.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100">
          <SearchX className="h-10 w-10 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
          <p className="text-gray-500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Link href="/">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
