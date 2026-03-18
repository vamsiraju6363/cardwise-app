import { CardTileSkeleton } from "@/components/cards/CardTile";

/**
 * Loading skeleton for the wallet page — mirrors the summary bar and card grid.
 */
export default function WalletLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 mt-2 rounded bg-muted animate-pulse" />
      </div>

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
    </div>
  );
}
