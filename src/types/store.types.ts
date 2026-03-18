// ─── Category ─────────────────────────────────────────────────────────────────

/**
 * A spending category (e.g. Groceries, Gas, Dining).
 * Supports one level of parent/child nesting.
 */
export interface Category {
  id:               string;
  name:             string;
  slug:             string;
  parentCategoryId: string | null;
  icon:             string | null;
  sortOrder:        number;
  children?:        Category[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * A merchant/store with its spending category.
 */
export interface Store {
  id:            string;
  name:          string;
  slug:          string;
  categoryId:    string;
  websiteDomain: string | null;
  logoUrl:       string | null;
  merchantMcc:   string | null;
  isActive:      boolean;
  createdAt:     Date;
  updatedAt:     Date;
  category:      Category;
}

/**
 * A store search result, augmented with a relevance score.
 * Score range: 0–100 (100 = exact name match).
 */
export interface StoreSearchResult extends Store {
  matchScore: number;
}

/**
 * Query parameters for the store search endpoint.
 */
export interface StoreSearchParams {
  query:  string;
  limit?: number;
}
