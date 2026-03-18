import { prisma } from "@/lib/prisma";

// ─── Shared selects ───────────────────────────────────────────────────────────

const storeWithCategorySelect = {
  id:            true,
  name:          true,
  slug:          true,
  categoryId:    true,
  websiteDomain: true,
  logoUrl:       true,
  merchantMcc:   true,
  isActive:      true,
  createdAt:     true,
  updatedAt:     true,
  category: {
    select: {
      id:       true,
      name:     true,
      slug:     true,
      icon:     true,
      sortOrder: true,
      parentCategoryId: true,
    },
  },
} as const;

/**
 * Service for store/merchant search and lookup operations.
 */
export class StoreService {
  /**
   * Full-text search across store name and website domain.
   * Returns up to 8 results sorted by relevance:
   *   exact name match → name starts-with → name contains → domain contains.
   */
  static async searchStores(query: string, limit = 8) {
    try {
      const normalized = query.trim().toLowerCase();

      const stores = await prisma.store.findMany({
        where: {
          isActive: true,
          OR: [
            { name:          { contains: normalized, mode: "insensitive" } },
            { websiteDomain: { contains: normalized, mode: "insensitive" } },
          ],
        },
        select: storeWithCategorySelect,
        take:   limit * 3,
      });

      const scored = stores.map((store) => {
        const lowerName   = store.name.toLowerCase();
        const lowerDomain = (store.websiteDomain ?? "").toLowerCase();
        let score = 10;

        if (lowerName === normalized)                score = 100;
        else if (lowerName.startsWith(normalized))   score = 75;
        else if (lowerName.includes(normalized))     score = 50;
        else if (lowerDomain.includes(normalized))   score = 25;

        return { ...store, matchScore: score };
      });

      return scored
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (err) {
      console.error("[StoreService.searchStores]", err);
      throw err;
    }
  }

  /**
   * Returns a single store by ID with its category. Returns null if not found.
   */
  static async getStoreById(storeId: string) {
    try {
      return await prisma.store.findUnique({
        where:  { id: storeId },
        select: storeWithCategorySelect,
      });
    } catch (err) {
      console.error("[StoreService.getStoreById]", err);
      throw err;
    }
  }

  /**
   * Returns a single store by slug with its category. Returns null if not found.
   */
  static async getStoreBySlug(slug: string) {
    try {
      return await prisma.store.findUnique({
        where:  { slug },
        select: storeWithCategorySelect,
      });
    } catch (err) {
      console.error("[StoreService.getStoreBySlug]", err);
      throw err;
    }
  }

  /**
   * Returns all active stores ordered by name — for browse/autocomplete.
   */
  static async getAllStores() {
    try {
      return await prisma.store.findMany({
        where:   { isActive: true },
        select:  storeWithCategorySelect,
        orderBy: { name: "asc" },
      });
    } catch (err) {
      console.error("[StoreService.getAllStores]", err);
      throw err;
    }
  }

  /**
   * Returns all categories sorted by sortOrder, with their direct children.
   */
  static async getAllCategories() {
    try {
      return await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id:               true,
          name:             true,
          slug:             true,
          icon:             true,
          sortOrder:        true,
          parentCategoryId: true,
          children: {
            select: {
              id:        true,
              name:      true,
              slug:      true,
              icon:      true,
              sortOrder: true,
            },
          },
        },
      });
    } catch (err) {
      console.error("[StoreService.getAllCategories]", err);
      throw err;
    }
  }
}
