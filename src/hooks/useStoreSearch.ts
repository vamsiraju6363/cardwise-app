"use client";

import { useQuery } from "@tanstack/react-query";
import type { StoreSearchResult } from "@/types/store.types";

async function searchStores(query: string): Promise<StoreSearchResult[]> {
  // API route reads the "query" param; "q" is accepted as an alias
  const params = new URLSearchParams({ query });
  const response = await fetch(`/api/stores?${params}`);
  if (!response.ok) throw new Error("Failed to search stores");
  return response.json() as Promise<StoreSearchResult[]>;
}

/**
 * Queries the store search API with a debounced search string.
 * Only fires when the query is at least 2 characters long.
 * Results are cached for 5 minutes.
 */
export function useStoreSearch(query: string) {
  return useQuery<StoreSearchResult[]>({
    queryKey: ["stores", "search", query],
    queryFn:  () => searchStores(query),
    enabled:  query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev, // keep previous results while new ones load
  });
}
