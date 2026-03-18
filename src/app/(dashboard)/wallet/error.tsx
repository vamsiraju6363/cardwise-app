"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

/**
 * Error boundary for the wallet page.
 */
export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WalletError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Couldn&apos;t load your wallet</h2>
          <p className="text-sm text-gray-500">
            Something went wrong. Please try again or head back home.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={reset} className="gap-2">
            Try again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
