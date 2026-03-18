import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the home dashboard — mirrors the hero, search bar,
 * and category grid layout.
 */
export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Hero skeleton */}
      <div className="text-center space-y-3">
        <Skeleton className="h-10 w-72 mx-auto rounded-lg" />
        <Skeleton className="h-5 w-96 mx-auto rounded" />
      </div>

      {/* Search bar skeleton */}
      <div className="flex items-center gap-3 h-14 px-4 rounded-2xl border-2 border-gray-200 bg-gray-50/50">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 flex-1 rounded" />
      </div>

      {/* Recent + categories skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
