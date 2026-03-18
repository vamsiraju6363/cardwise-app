import { Suspense } from "react";
import { WalletGrid } from "@/components/cards/WalletGrid";
import { CardTileSkeleton } from "@/components/cards/CardTile";

export const metadata = {
  title: "My Wallet — CardWise",
};

/**
 * Wallet page — lists all the user's cards and lets them add, edit, and remove cards.
 */
export default function WalletPage() {
  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your credit cards and track their reward categories.
        </p>
      </div>

      {/* ── Wallet grid (summary + cards + modal) ── */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-9 w-48 rounded-xl bg-muted animate-pulse" />
              <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardTileSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <WalletGrid />
      </Suspense>
    </div>
  );
}
