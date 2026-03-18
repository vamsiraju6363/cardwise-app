"use client";

import { useQuery } from "@tanstack/react-query";
import type { RecommendationResult, RankedCard } from "@/types/ranking.types";

interface RecommendApiResponse {
  store: RecommendationResult["store"];
  rankedCards: RankedCard[];
  totalOffersFound: number;
  message?: string;
}

async function fetchRecommendations(storeId: string): Promise<RecommendationResult> {
  const res = await fetch(`/api/recommend?storeId=${encodeURIComponent(storeId)}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  const data = (await res.json()) as RecommendApiResponse;
  // Transform rankedCards to CardRecommendation format for OfferCard
  const recommendations = data.rankedCards.map((rc): RecommendationResult["recommendations"][0] => ({
    userCard:           rc.userCard,
    offer:              rc.bestOffer,
    effectiveRewardPct:  rc.rewardPct,
    rewardType:         rc.card.rewardType as "CASHBACK" | "POINTS" | "MILES",
    explanation:        rc.reason,
    isCapReached:       !!(rc.capInfo && rc.capInfo.percentUsed >= 100),
    remainingCapAmount: rc.capInfo?.headroom ?? null,
    matchedOn:          rc.bestOffer?.storeId ? "store" : rc.bestOffer?.categoryId ? "category" : "base",
  }));
  return {
    store:           data.store,
    recommendations,
    generatedAt:    new Date(),
  };
}

/**
 * Fetches ranked card recommendations for a specific store.
 * Returns a RecommendationResult containing the store info and
 * an ordered list of CardRecommendation entries.
 * Only fires when storeId is a non-empty string.
 */
export function useRecommendations(storeId: string | null) {
  return useQuery<RecommendationResult>({
    queryKey:  ["recommendations", storeId],
    queryFn:   () => fetchRecommendations(storeId!),
    enabled:   !!storeId && storeId.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
