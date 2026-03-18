"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OfferCard, OfferCardSkeleton } from "@/components/offers/OfferCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { CreditCard, RefreshCw } from "lucide-react";
import type { StoreSearchResult } from "@/types/store.types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
      <p className="text-sm text-red-600 font-medium">Failed to load recommendations</p>
      <p className="text-xs text-red-400 mt-1">Check your connection and try again</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 gap-2 text-red-600 border-red-200 hover:bg-red-50"
        onClick={onRetry}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}

function NoCardsState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50">
          <CreditCard className="h-7 w-7 text-emerald-500" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-gray-900">No cards in your wallet</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
        Add cards to your wallet to see which one earns the most rewards here.
      </p>
      <Button className="mt-5 bg-emerald-500 hover:bg-emerald-600" asChild>
        <Link href="/wallet">Add cards to wallet</Link>
      </Button>
    </div>
  );
}

// ─── RecommendationList ───────────────────────────────────────────────────────

interface RecommendationListProps {
  storeId: string;
  /** If provided, used for the header instead of fetching store info from the result. */
  store?: StoreSearchResult | null;
}

/**
 * Fetches and renders the ranked card recommendation list for a given store.
 * Shows a loading skeleton, error state, no-cards state, or the ranked list.
 */
export function RecommendationList({ storeId, store: storeProp }: RecommendationListProps) {
  const { data, isLoading, isError, refetch } = useRecommendations(storeId);

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState onRetry={() => void refetch()} />;
  if (!data)     return null;

  const displayStore = storeProp ?? data.store;
  const recs         = data.recommendations;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Best cards for {displayStore.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 text-gray-600 border-gray-200"
            >
              {displayStore.category.name}
            </Badge>
            {displayStore.websiteDomain && (
              <span className="text-xs text-gray-400">{displayStore.websiteDomain}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary bar ── */}
      {recs.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing results for{" "}
          <span className="font-semibold text-gray-700">{recs.length}</span>{" "}
          {recs.length === 1 ? "card" : "cards"} in your wallet
        </p>
      )}

      {/* ── No cards state ── */}
      {recs.length === 0 && <NoCardsState />}

      {/* ── Ranked cards ── */}
      {recs.length > 0 && (
        <div className="space-y-3">
          {recs.map((rec, index) => (
            <OfferCard
              key={rec.userCard.id}
              recommendation={rec}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
