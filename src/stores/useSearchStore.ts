"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreSearchResult } from "@/types/store.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentSearch {
  query:      string;
  store:      StoreSearchResult;
  searchedAt: string;
}

interface SearchState {
  // ── Spec fields ──
  query:           string;
  selectedStore:   StoreSearchResult | null;
  isSearchFocused: boolean;

  // ── Extended (persisted recent searches) ──
  recentSearches:  RecentSearch[];

  // ── Legacy alias ──
  currentQuery:    string;

  // ── Actions ──
  setQuery:          (query: string) => void;
  selectStore:       (store: StoreSearchResult | null) => void;
  clearSearch:       () => void;
  setSearchFocused:  (focused: boolean) => void;

  // ── Extended actions ──
  addRecentSearch:     (query: string, store: StoreSearchResult) => void;
  clearRecentSearches: () => void;

  // ── Legacy alias ──
  setCurrentQuery: (query: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Zustand store for the store search feature.
 * Recent searches are persisted to localStorage (up to 10 entries).
 */
export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query:           "",
      selectedStore:   null,
      isSearchFocused: false,
      recentSearches:  [],
      currentQuery:    "",

      setQuery: (query) =>
        set({ query, currentQuery: query }),

      selectStore: (store) =>
        set({ selectedStore: store }),

      clearSearch: () =>
        set({ query: "", currentQuery: "", selectedStore: null }),

      setSearchFocused: (focused) =>
        set({ isSearchFocused: focused }),

      addRecentSearch: (query, store) =>
        set((state) => {
          const filtered = state.recentSearches.filter(
            (s) => s.store.id !== store.id,
          );
          return {
            recentSearches: [
              { query, store, searchedAt: new Date().toISOString() },
              ...filtered,
            ].slice(0, 10),
          };
        }),

      clearRecentSearches: () =>
        set({ recentSearches: [] }),

      // Legacy alias
      setCurrentQuery: (query) =>
        set({ query, currentQuery: query }),
    }),
    {
      name:    "cardwise-search",
      // Only persist the recent searches list, not transient UI state
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    },
  ),
);
