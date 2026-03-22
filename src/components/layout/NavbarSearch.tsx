"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreSearch } from "@/hooks/useStoreSearch";
import { useSearchStore } from "@/stores/useSearchStore";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Global store search input in the top navbar.
 * Shows an inline dropdown of results; navigates to /store/[id] on selection.
 */
export function NavbarSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue]   = useState("");
  const [isOpen, setIsOpen]           = useState(false);
  const debouncedQuery                = useDebounce(inputValue, 300);

  const { addRecentSearch } = useSearchStore();
  const { data: results, isFetching } = useStoreSearch(debouncedQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(storeId: string, storeName: string) {
    const store = results?.find((s) => s.id === storeId);
    if (store) addRecentSearch(inputValue, store);
    setInputValue(storeName);
    setIsOpen(false);
    router.push(`/store/${storeId}`);
  }

  function handleClear() {
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  const showDropdown = isOpen && debouncedQuery.trim().length >= 2;
  const hasResults   = results && results.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Input ── */}
      <div
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-lg border bg-muted/50",
          "transition-all duration-150",
          isOpen
            ? "border-emerald-400 ring-2 ring-emerald-500/20 bg-background"
            : "border-input hover:border-border",
        )}
      >
        <Search
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-colors",
            isOpen ? "text-emerald-500" : "text-muted-foreground",
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
            if (e.key === "Enter" && results?.[0]) {
              handleSelect(results[0].id, results[0].name);
            }
          }}
          placeholder="Search stores…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Results dropdown ── */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-1.5 z-50",
            "bg-popover rounded-lg border border-border shadow-lg",
            "overflow-hidden",
          )}
        >
          {isFetching && !hasResults && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              Searching…
            </div>
          )}

          {!isFetching && !hasResults && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No stores found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {hasResults && (
            <ul role="listbox">
              {results.slice(0, 8).map((store) => (
                <li key={store.id} role="option">
                  <button
                    onMouseDown={(e) => {
                      // Prevent input blur before click fires
                      e.preventDefault();
                      handleSelect(store.id, store.name);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                      "hover:bg-accent/10 transition-colors duration-100",
                    )}
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0">
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {store.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {store.category.name}
                        {store.websiteDomain && ` · ${store.websiteDomain}`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
