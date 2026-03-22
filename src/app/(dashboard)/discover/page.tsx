"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { StoreSearch } from "@/components/store/StoreSearch";
import { RecommendationList } from "@/components/store/RecommendationList";
import { useSearchStore } from "@/stores/useSearchStore";
import { useUserCards } from "@/hooks/useCards";
import { useWalletStore } from "@/stores/useWalletStore";
import { cn, BLUR_DATA_URL } from "@/lib/utils";
import {
  ShoppingCart,
  Utensils,
  Fuel,
  Plane,
  ShoppingBag,
  Store,
  Clock,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCardModal } from "@/components/cards/AddCardModal";
import type { StoreSearchResult } from "@/types/store.types";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "groceries",       name: "Groceries",        icon: ShoppingCart, color: "bg-green-50 text-green-600 hover:bg-green-100" },
  { slug: "dining",          name: "Dining",            icon: Utensils,     color: "bg-orange-50 text-orange-600 hover:bg-orange-100" },
  { slug: "gas",             name: "Gas & Fuel",        icon: Fuel,         color: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" },
  { slug: "travel",          name: "Travel",            icon: Plane,        color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
  { slug: "online-shopping", name: "Online Shopping",   icon: ShoppingBag,  color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
  { slug: "general",         name: "General",           icon: Store,        color: "bg-slate-50 text-slate-600 hover:bg-slate-100" },
];

// ─── Recent searches section ──────────────────────────────────────────────────

interface RecentSearchesSectionProps {
  recentSearches: Array<{ store: StoreSearchResult; searchedAt: string }>;
  onSelect:       (store: StoreSearchResult) => void;
  onClear:        () => void;
}

function RecentSearchesSection({ recentSearches, onSelect, onClear }: RecentSearchesSectionProps) {
  if (recentSearches.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Recently searched
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.slice(0, 5).map(({ store }) => (
          <button
            key={store.id}
            onClick={() => onSelect(store)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200",
              "bg-white hover:border-emerald-300 hover:bg-emerald-50",
              "text-sm text-gray-700 transition-all duration-150",
            )}
          >
            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-medium">{store.name}</span>
            <span className="text-xs text-gray-400">{store.category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Browse by category section ───────────────────────────────────────────────

interface BrowseCategoriesProps {
  onCategoryClick: (slug: string, name: string) => void;
}

function BrowseCategories({ onCategoryClick }: BrowseCategoriesProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Browse by category
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {CATEGORIES.map(({ slug, name, icon: Icon, color }) => (
          <button
            key={slug}
            onClick={() => onCategoryClick(slug, name)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border border-transparent",
              "transition-all duration-150 cursor-pointer",
              color,
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium text-center leading-tight">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Selected store header ────────────────────────────────────────────────────

function SelectedStoreHeader({
  store,
  onClear,
}: {
  store: StoreSearchResult;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {store.logoUrl ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 shrink-0">
            <Image
              src={store.logoUrl}
              alt=""
              fill
              className="object-contain"
              sizes="40px"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg">
            {store.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{store.name}</p>
          <p className="text-xs text-gray-400">{store.category.name}</p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </button>
    </div>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

/**
 * Find a Store — store search and card recommendations (was unreachable at `/` while root redirects to wallet).
 */
export default function DiscoverPage() {
  const [selectedStore, setSelectedStore] = useState<StoreSearchResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, clearRecentSearches, selectStore } = useSearchStore();
  const { data: userCards } = useUserCards();
  const openAddModal = useWalletStore((s) => s.openAddModal);

  const hasNoCards = (userCards ?? []).length === 0;

  // Keyboard shortcut: "/" focuses the store search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleStoreSelect(store: StoreSearchResult) {
    setSelectedStore(store);
    selectStore(store);
  }

  function handleClearStore() {
    setSelectedStore(null);
    selectStore(null);
  }

  function handleCategoryClick(_slug: string, name: string) {
    // Pre-fill the search with the category name so the user can refine
    // (the StoreSearch component manages its own input state)
    // This is a light UX hint — a full category browse page could be added later
    console.info(`Browse category: ${name}`);
  }

  const showPreSearch = !selectedStore;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* ── Onboarding: welcome banner when user has no cards ── */}
      {hasNoCards && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Welcome to CardWise!</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add your cards to get personalized recommendations.
            </p>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add your first card
          </Button>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
          Which card should I use?
        </h1>
        <p className="text-gray-500 text-base">
          Search any store to instantly see your best card and reward rate.
        </p>
      </div>

      {/* ── Search input ── */}
      <StoreSearch
        onStoreSelect={handleStoreSelect}
        className="w-full"
        inputRef={searchInputRef}
      />

      {/* ── Pre-search: recent + categories ── */}
      {showPreSearch && (
        <div className="space-y-8">
          <RecentSearchesSection
            recentSearches={recentSearches}
            onSelect={handleStoreSelect}
            onClear={clearRecentSearches}
          />
          <BrowseCategories onCategoryClick={handleCategoryClick} />
        </div>
      )}

      {/* ── Post-search: selected store + recommendations ── */}
      {selectedStore && (
        <div className="space-y-5">
          <SelectedStoreHeader store={selectedStore} onClear={handleClearStore} />
          <RecommendationList storeId={selectedStore.id} store={selectedStore} />
        </div>
      )}

      <AddCardModal />
    </div>
  );
}
