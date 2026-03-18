import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the spending cap tracker — mirrors tabs and progress bars.
 */
export default function TrackerLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-80 mt-2 rounded" />
      </div>

      {/* Tabs skeleton */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-muted">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>

      {/* Progress bars skeleton */}
      <div className="space-y-3 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
