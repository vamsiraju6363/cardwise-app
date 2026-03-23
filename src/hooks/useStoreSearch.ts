"use client";

import { useQuery } from "@tanstack/react-query";
import type { StoreSearchResult, RankedStoreResult } from "@/types/store.types";

async function searchStores(query: string): Promise<StoreSearchResult[]> {
  const params = new URLSearchParams({ query });
  const response = await fetch(`/api/stores?${params}`);
  if (!response.ok) throw new Error("Failed to search stores");
  return response.json() as Promise<StoreSearchResult[]>;
}

async function fetchStoresByCategory(
  categorySlug: string
): Promise<StoreSearchResult[]> {
  const params = new URLSearchParams({ category: categorySlug });
  const response = await fetch(`/api/stores?${params}`);
  if (!response.ok) throw new Error("Failed to fetch stores");
  return response.json() as Promise<StoreSearchResult[]>;
}

/**
 * Queries the store search API with a debounced search string.
 * Only fires when the query is at least 2 characters long.
 */
export function useStoreSearch(query: string) {
  return useQuery<StoreSearchResult[]>({
    queryKey: ["stores", "search", query],
    queryFn: () => searchStores(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
}

/** Fetches stores in a category for browse-by-category (plain list). */
export function useStoresByCategory(categorySlug: string | null) {
  return useQuery<StoreSearchResult[]>({
    queryKey: ["stores", "category", categorySlug],
    queryFn: () => fetchStoresByCategory(categorySlug!),
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 5,
  });
}

async function fetchStoresRankedByCategory(
  categorySlug: string,
): Promise<RankedStoreResult[]> {
  const params = new URLSearchParams({ category: categorySlug });
  const response = await fetch(`/api/recommend/stores?${params}`);
  if (!response.ok) throw new Error("Failed to fetch ranked stores");
  return response.json() as Promise<RankedStoreResult[]>;
}

/** Fetches stores in a category ranked by best reward for the user's cards. */
export function useStoresRankedByCategory(categorySlug: string | null) {
  return useQuery<RankedStoreResult[]>({
    queryKey: ["stores", "ranked", categorySlug],
    queryFn: () => fetchStoresRankedByCategory(categorySlug!),
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 2,
  });
}
