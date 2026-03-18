"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock } from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/utils";
import { useStoreSearch } from "@/hooks/useStoreSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { StoreSearchResult } from "@/types/store.types";

// ─── Category badge colours ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  groceries:       "bg-green-100 text-green-700",
  dining:          "bg-orange-100 text-orange-700",
  gas:             "bg-yellow-100 text-yellow-700",
  travel:          "bg-blue-100 text-blue-700",
  "online-shopping": "bg-purple-100 text-purple-700",
  general:         "bg-slate-100 text-slate-600",
};

function categoryColor(slug: string) {
  return CATEGORY_COLORS[slug] ?? "bg-slate-100 text-slate-600";
}

// ─── Store avatar (logo or first-letter fallback) ─────────────────────────────

function StoreAvatar({ store }: { store: StoreSearchResult }) {
  const letter = store.name.charAt(0).toUpperCase();
  if (store.logoUrl) {
    return (
      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
        <Image
          src={store.logoUrl}
          alt=""
          fill
          className="object-contain"
          sizes="32px"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold shrink-0">
      {letter}
    </div>
  );
}

// ─── Dropdown item ────────────────────────────────────────────────────────────

interface DropdownItemProps {
  store:       StoreSearchResult;
  isActive:    boolean;
  isRecent?:   boolean;
  onSelect:    (store: StoreSearchResult) => void;
  onMouseEnter: () => void;
  id:          string;
}

function DropdownItem({ store, isActive, isRecent, onSelect, onMouseEnter, id }: DropdownItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      onMouseEnter={onMouseEnter}
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); onSelect(store); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg",
          "transition-colors duration-100",
          isActive ? "bg-emerald-50" : "hover:bg-gray-50",
        )}
      >
        {isRecent
          ? <Clock className="h-4 w-4 text-gray-400 shrink-0" />
          : <StoreAvatar store={store} />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{store.name}</p>
          {store.websiteDomain && (
            <p className="text-xs text-gray-400 truncate">{store.websiteDomain}</p>
          )}
        </div>
        <Badge
          variant="secondary"
          className={cn("text-[10px] shrink-0 font-medium", categoryColor(store.category.slug))}
        >
          {store.category.name}
        </Badge>
      </button>
    </li>
  );
}

// ─── StoreSearch ──────────────────────────────────────────────────────────────

interface StoreSearchProps {
  /** Called when the user selects a store — parent can use this to show recommendations inline. */
  onStoreSelect?: (store: StoreSearchResult) => void;
  /** If true, navigates to /store/[id] on selection instead of calling onStoreSelect. */
  navigateOnSelect?: boolean;
  className?: string;
  /** Ref to focus the search input (e.g. for "/" keyboard shortcut). */
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Hero store search input with autocomplete dropdown, keyboard navigation,
 * first-letter store avatars, category badges, and recent searches.
 */
export function StoreSearch({ onStoreSelect, navigateOnSelect = false, className, inputRef: inputRefProp }: StoreSearchProps) {
  const listboxId = useId();
  const internalRef = useRef<HTMLInputElement | null>(null);
  const inputRef = inputRefProp ?? internalRef;
  const listRef = useRef<HTMLUListElement | null>(null);

  const [inputValue, setInputValue]     = useState("");
  const [isOpen, setIsOpen]             = useState(false);
  const [activeIndex, setActiveIndex]   = useState(-1);

  const debouncedQuery = useDebounce(inputValue, 300);

  const { recentSearches, addRecentSearch, selectStore, setSearchFocused } = useSearchStore();
  const { data: searchResults, isFetching } = useStoreSearch(debouncedQuery);

  const showRecent  = isOpen && inputValue.trim().length === 0 && recentSearches.length > 0;
  const showResults = isOpen && debouncedQuery.trim().length >= 2;
  const isDropdownOpen = showRecent || showResults;

  // Build the flat list of items shown in the dropdown
  const dropdownItems: StoreSearchResult[] = showRecent
    ? recentSearches.slice(0, 5).map((r) => r.store)
    : (searchResults ?? []);

  // Reset active index when dropdown items change
  useEffect(() => { setActiveIndex(-1); }, [dropdownItems.length, debouncedQuery]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (store: StoreSearchResult) => {
      addRecentSearch(inputValue || store.name, store);
      selectStore(store);
      setInputValue(store.name);
      setIsOpen(false);
      setActiveIndex(-1);
      if (onStoreSelect) {
        onStoreSelect(store);
      }
      if (navigateOnSelect) {
        window.location.href = `/store/${store.id}`;
      }
    },
    [inputValue, addRecentSearch, selectStore, onStoreSelect, navigateOnSelect],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, dropdownItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && dropdownItems[activeIndex]) {
          handleSelect(dropdownItems[activeIndex]);
        } else if (dropdownItems[0]) {
          handleSelect(dropdownItems[0]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  function handleClear() {
    setInputValue("");
    setIsOpen(false);
    setActiveIndex(-1);
    selectStore(null);
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* ── Input ── */}
      <div
        className={cn(
          "flex items-center gap-3 h-14 px-4 rounded-2xl border-2 bg-white",
          "transition-all duration-200 shadow-sm",
          isOpen
            ? "border-emerald-400 shadow-emerald-100 shadow-md"
            : "border-gray-200 hover:border-gray-300",
        )}
      >
        <Search
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isOpen ? "text-emerald-500" : "text-gray-400",
          )}
        />
        <input
          ref={internalRef}
          type="text"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => { setIsOpen(true); setSearchFocused(true); }}
          onBlur={() => { setTimeout(() => setIsOpen(false), 150); setSearchFocused(false); }}
          onKeyDown={handleKeyDown}
          placeholder="Search a store — Target, Amazon, Starbucks…"
          className="flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 outline-none min-w-0"
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="p-2 max-h-72 overflow-y-auto"
          >
            {/* Section label */}
            <li className="px-3 py-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {showRecent ? "Recent searches" : "Stores"}
              </span>
            </li>

            {/* Loading */}
            {showResults && isFetching && dropdownItems.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-3 text-sm text-gray-400">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                Searching…
              </li>
            )}

            {/* No results */}
            {showResults && !isFetching && dropdownItems.length === 0 && (
              <li className="px-3 py-4 text-sm text-gray-400 text-center">
                No stores found for &ldquo;{debouncedQuery}&rdquo;
              </li>
            )}

            {/* Results */}
            {dropdownItems.map((store, index) => (
              <DropdownItem
                key={store.id}
                id={`${listboxId}-item-${index}`}
                store={store}
                isActive={index === activeIndex}
                isRecent={showRecent}
                onSelect={handleSelect}
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
