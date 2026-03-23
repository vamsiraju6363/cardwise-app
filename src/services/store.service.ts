import { prisma } from "@/lib/prisma";

/** Maps search keywords to category slugs when store name search returns nothing. */
const KEYWORD_TO_CATEGORY: Record<string, string> = {
  gas: "gas", fuel: "gas", gasstation: "gas", "gas station": "gas", mobil: "gas",
  grocery: "groceries", groceries: "groceries", supermarket: "groceries",
  dining: "dining", restaurant: "dining", eat: "dining",
  travel: "travel", flight: "travel", hotel: "travel",
  online: "online-shopping", amazon: "online-shopping", shop: "general",
};

function getCategoryFromKeyword(query: string): string | null {
  const cleaned = query.replace(/\s+/g, " ").trim().toLowerCase();
  if (KEYWORD_TO_CATEGORY[cleaned]) return KEYWORD_TO_CATEGORY[cleaned];
  for (const [kw, cat] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (cleaned.includes(kw) || kw.includes(cleaned)) return cat;
  }
  return null;
}

function getCapRange(period: CapPeriod): [Date, Date] {
  const now = new Date();
  switch (period) {
    case "MONTHLY":
      return [startOfMonth(now), endOfMonth(now)];
    case "QUARTERLY":
      return [startOfQuarter(now), endOfQuarter(now)];
    case "ANNUALLY":
      return [startOfYear(now), endOfYear(now)];
  }
}
import { CardService } from "./card.service";
import { OfferService } from "./offer.service";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import type { CapPeriod } from "@prisma/client";

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

      const sorted = scored
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      // When no name match, try category keywords (e.g. "gas", "gas station" → gas stores)
      if (sorted.length === 0) {
        const categoryFromQuery = getCategoryFromKeyword(normalized);
        if (categoryFromQuery) {
          return this.getStoresByCategorySlug(categoryFromQuery, limit);
        }
      }
      return sorted;
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
   * Returns stores in a given category (by slug). Used for browse-by-category.
   */
  static async getStoresByCategorySlug(categorySlug: string, limit = 12) {
    try {
      const stores = await prisma.store.findMany({
        where: {
          isActive: true,
          category: { slug: categorySlug },
        },
        select: storeWithCategorySelect,
        orderBy: { name: "asc" },
        take: limit,
      });
      return stores;
    } catch (err) {
      console.error("[StoreService.getStoresByCategorySlug]", err);
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

  /**
   * Returns stores in a category ranked by the best reward the user can get
   * with their wallet cards. Enables "I need gas" → "best gas stations for my cards".
   */
  static async getStoresRankedByUserCards(
    userId: string,
    categorySlug: string,
    limit = 20,
  ): Promise<
    Array<{
      store: Awaited<ReturnType<typeof StoreService.getStoreById>>;
      bestRewardPct: number;
      bestCardName: string;
      bestOfferDescription: string | null;
    }>
  > {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true },
    });
    if (!category) return [];

    const stores = await prisma.store.findMany({
      where: { isActive: true, categoryId: category.id },
      select: storeWithCategorySelect,
      orderBy: { name: "asc" },
      take: limit * 2,
    });

    const userCards = await CardService.getUserCards(userId);
    if (userCards.length === 0) {
      return stores.map((store) => ({
        store: { ...store, matchScore: 0 },
        bestRewardPct: 0,
        bestCardName: "",
        bestOfferDescription: null,
      }));
    }

    const userCardIds = userCards.map((uc) => uc.id);

    const ranked: Array<{
      store: (typeof stores)[0] & { matchScore?: number };
      bestRewardPct: number;
      bestCardName: string;
      bestOfferDescription: string | null;
    }> = [];

    for (const store of stores) {
      const offersRaw = await OfferService.getOffersForStore(store.id, userCardIds);
      if (!offersRaw) continue;

      let bestRewardPct = 0;
      let bestCardName = "";
      let bestOfferDescription: string | null = null;

      for (const offer of offersRaw) {
        if (!offer.userCardId) continue;

        const userCard = userCards.find((uc) => uc.id === offer.userCardId);
        if (!userCard) continue;

        const now = new Date();
        if (offer.validUntil && new Date(offer.validUntil) < now) continue;

        let effectivePct = Number(offer.rewardPct);

        if (offer.capAmount && offer.capPeriod) {
          const [periodStart] = getCapRange(offer.capPeriod as CapPeriod);
          const tracking = await prisma.spendTracking.findUnique({
            where: {
              userCardId_offerId_periodStart: {
                userCardId: offer.userCardId,
                offerId: offer.id,
                periodStart,
              },
            },
          });
          const spent = tracking ? Number(tracking.amountSpent) : 0;
          const cap = Number(offer.capAmount);
          if (spent >= cap) effectivePct = Number(userCard.card.baseRewardPct);
        }

        if (effectivePct > bestRewardPct) {
          bestRewardPct = effectivePct;
          bestCardName = userCard.nickname ?? `${userCard.card.issuer} ${userCard.card.cardName}`;
          bestOfferDescription = offer.bonusDescription ?? null;
        }
      }

      if (bestRewardPct === 0) {
        const bestBase = userCards.reduce((max, uc) => {
          const base = Number(uc.card.baseRewardPct);
          return base > max ? base : max;
        }, 0);
        if (bestBase > 0) {
          bestRewardPct = bestBase;
          const uc = userCards.reduce((best, curr) =>
            Number(curr.card.baseRewardPct) > Number(best.card.baseRewardPct) ? curr : best,
          );
          bestCardName = uc.nickname ?? `${uc.card.issuer} ${uc.card.cardName}`;
        }
      }

      ranked.push({
        store: { ...store, matchScore: bestRewardPct * 100 },
        bestRewardPct,
        bestCardName,
        bestOfferDescription,
      });
    }

    ranked.sort((a, b) => b.bestRewardPct - a.bestRewardPct);
    return ranked.slice(0, limit);
  }

  /**
   * Returns stores in a category ranked by the reward a specific user card earns
   * at each store. Enables "My Amex + Gas" → "best gas stations for my Amex".
   */
  static async getStoresRankedForUserCard(
    userId: string,
    userCardId: string,
    categorySlug: string,
    limit = 20,
  ): Promise<
    Array<{
      store: Awaited<ReturnType<typeof StoreService.getStoreById>>;
      bestRewardPct: number;
      bestCardName: string;
      bestOfferDescription: string | null;
    }>
  > {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true },
    });
    if (!category) return [];

    const userCard = await CardService.getUserCardById(userCardId, userId);
    if (!userCard) return [];

    const cardId = userCard.cardId ?? null;
    if (!cardId || String(userCard.card.id).startsWith("custom-")) {
      const stores = await prisma.store.findMany({
        where: { isActive: true, categoryId: category.id },
        select: storeWithCategorySelect,
        orderBy: { name: "asc" },
        take: limit,
      });
      const basePct = Number(userCard.card.baseRewardPct ?? 0);
      const cardName = userCard.nickname ?? `${userCard.card.issuer} ${userCard.card.cardName}`;
      return stores.map((store) => ({
        store: { ...store, matchScore: basePct * 100 },
        bestRewardPct: basePct,
        bestCardName: cardName,
        bestOfferDescription: null,
      }));
    }

    const stores = await prisma.store.findMany({
      where: { isActive: true, categoryId: category.id },
      select: storeWithCategorySelect,
      orderBy: { name: "asc" },
      take: limit * 2,
    });

    const cardName = userCard.nickname ?? `${userCard.card.issuer} ${userCard.card.cardName}`;
    const ranked: Array<{
      store: (typeof stores)[0] & { matchScore?: number };
      bestRewardPct: number;
      bestCardName: string;
      bestOfferDescription: string | null;
    }> = [];

    for (const store of stores) {
      const offersRaw = await OfferService.getOffersForStore(store.id, [userCardId]);
      if (!offersRaw) continue;

      const now = new Date();
      let bestRewardPct = Number(userCard.card.baseRewardPct ?? 0);
      let bestOfferDescription: string | null = null;

      for (const offer of offersRaw) {
        if (offer.userCardId !== userCardId) continue;
        if (offer.validUntil && new Date(offer.validUntil) < now) continue;

        let effectivePct = Number(offer.rewardPct);
        if (offer.capAmount && offer.capPeriod) {
          const [periodStart] = getCapRange(offer.capPeriod as CapPeriod);
          const tracking = await prisma.spendTracking.findUnique({
            where: {
              userCardId_offerId_periodStart: {
                userCardId,
                offerId: offer.id,
                periodStart,
              },
            },
          });
          const spent = tracking ? Number(tracking.amountSpent) : 0;
          const cap = Number(offer.capAmount);
          if (spent >= cap) effectivePct = Number(userCard.card.baseRewardPct);
        }

        if (effectivePct > bestRewardPct) {
          bestRewardPct = effectivePct;
          bestOfferDescription = offer.bonusDescription ?? null;
        }
      }

      ranked.push({
        store: { ...store, matchScore: bestRewardPct * 100 },
        bestRewardPct,
        bestCardName: cardName,
        bestOfferDescription,
      });
    }

    ranked.sort((a, b) => b.bestRewardPct - a.bestRewardPct);
    return ranked.slice(0, limit);
  }
}
