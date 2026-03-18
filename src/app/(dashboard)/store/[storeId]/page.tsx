import { Suspense } from "react";
import { RecommendationList } from "@/components/store/RecommendationList";
import { Skeleton } from "@/components/ui/skeleton";

interface StorePageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Store detail page — shows ranked card recommendations for a specific store.
 */
export default async function StorePage({ params }: StorePageProps) {
  const { storeId } = await params;

  return (
    <div className="space-y-8">
      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        }
      >
        <RecommendationList storeId={storeId} />
      </Suspense>
    </div>
  );
}
