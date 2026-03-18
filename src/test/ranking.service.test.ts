import { describe, it, expect, vi } from "vitest";

// ── Prevent PrismaClient from connecting to a real database ──────────────────
// @prisma/client is imported by src/lib/prisma.ts at module load time.
// Mocking it here stops the instantiation before it can open a socket.
vi.mock("@prisma/client", () => {
  const PrismaClient = vi.fn().mockImplementation(() => ({
    spendTracking: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    store:         { findUnique: vi.fn() },
    userCard:      { findMany: vi.fn() },
    offer:         { findMany: vi.fn(), findUnique: vi.fn() },
    $connect:      vi.fn(),
    $disconnect:   vi.fn(),
  }));
  return { PrismaClient };
});

// Stub the services that RankingService.getRecommendations depends on
// (not used by rankCards, but needed for the module to load without errors).
vi.mock("@/services/card.service",  () => ({ CardService:  { getUserCards: vi.fn() } }));
vi.mock("@/services/store.service", () => ({ StoreService: { getStoreById: vi.fn() } }));
vi.mock("@/services/offer.service", () => ({ OfferService: { getOffersForStore: vi.fn() } }));

import { rankCards } from "@/services/ranking.service";
import type { UserCard }          from "@/types/card.types";
import type { OfferWithRelevance } from "@/types/offer.types";
import type { SpendTracking }      from "@/types/offer.types";

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const NOW = Date.now();

/** Builds a minimal UserCard for use in tests. */
function makeUserCard(overrides: {
  id:            string;
  issuer:        string;
  cardName:      string;
  baseRewardPct: number;
  rewardType?:   "CASHBACK" | "POINTS" | "MILES";
  nickname?:     string | null;
}): UserCard {
  return {
    id:       overrides.id,
    userId:   "user-1",
    cardId:   `card-${overrides.id}`,
    nickname: overrides.nickname ?? null,
    lastFour: null,
    isActive: true,
    addedAt:  new Date(),
    card: {
      id:            `card-${overrides.id}`,
      issuer:        overrides.issuer,
      cardName:      overrides.cardName,
      network:       "VISA",
      annualFee:     0,
      rewardType:    overrides.rewardType ?? "CASHBACK",
      baseRewardPct: overrides.baseRewardPct,
      imageUrl:      null,
      isActive:      true,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    },
  };
}

/** Builds a minimal OfferWithRelevance for use in tests. */
function makeOffer(overrides: {
  id:             string;
  userCardId:     string;
  rewardPct:      number;
  relevanceType?: "store_specific" | "category_wide";
  capAmount?:     number | null;
  validUntil?:    Date | null;
  storeName?:     string;
  categoryName?:  string;
  isActive?:      boolean;
}): OfferWithRelevance {
  return {
    id:               overrides.id,
    cardId:           `card-${overrides.userCardId}`,
    storeId:          overrides.relevanceType === "store_specific" ? "store-target" : null,
    categoryId:       overrides.relevanceType === "category_wide"  ? "cat-general"  : null,
    rewardPct:        overrides.rewardPct,
    rewardType:       "CASHBACK",
    capAmount:        overrides.capAmount ?? null,
    capPeriod:        overrides.capAmount ? "MONTHLY" : null,
    bonusDescription: null,
    validFrom:        new Date(NOW - 86400_000),
    validUntil:       overrides.validUntil ?? null,
    isActive:         overrides.isActive ?? true,
    dataSource:       "MANUAL",
    lastVerifiedAt:   null,
    createdAt:        new Date(),
    updatedAt:        new Date(),
    userCardId:       overrides.userCardId,
    relevanceType:    overrides.relevanceType ?? "store_specific",
    store:    overrides.storeName
      ? { id: "store-target", name: overrides.storeName, slug: "target", websiteDomain: null }
      : null,
    category: overrides.categoryName
      ? { id: "cat-general", name: overrides.categoryName, slug: "general", icon: null }
      : null,
  };
}

/** Builds a SpendTracking record. */
function makeTracking(userCardId: string, offerId: string, amountSpent: number): SpendTracking {
  return {
    id:          `tracking-${userCardId}-${offerId}`,
    userCardId,
    offerId,
    periodStart: new Date(NOW),
    periodEnd:   new Date(NOW + 30 * 86400_000),
    amountSpent,
    capHit:      false,
    updatedAt:   new Date(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("rankCards", () => {
  // ── a. Basic ranking ────────────────────────────────────────────────────────

  describe("a. basic ranking", () => {
    it("ranks the higher-rewardPct offer first", () => {
      const cardA = makeUserCard({ id: "uc-a", issuer: "Chase",  cardName: "Freedom", baseRewardPct: 0.01 });
      const cardB = makeUserCard({ id: "uc-b", issuer: "Citi",   cardName: "Double",  baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-a", userCardId: "uc-a", rewardPct: 0.05, storeName: "Target" }),
        makeOffer({ id: "offer-b", userCardId: "uc-b", rewardPct: 0.03, storeName: "Target" }),
      ];

      const result = rankCards(offers, [cardA, cardB], []);

      expect(result).toHaveLength(2);
      expect(result[0].userCard.id).toBe("uc-a");
      expect(result[0].rewardPct).toBe(0.05);
      expect(result[1].userCard.id).toBe("uc-b");
      expect(result[1].rewardPct).toBe(0.03);
    });
  });

  // ── b. Cap-hit card ranks below lower-reward uncapped card ──────────────────

  describe("b. cap hit demotes card", () => {
    it("ranks a cap-hit card below a lower-reward uncapped card", () => {
      const highCard = makeUserCard({ id: "uc-high", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });
      const lowCard  = makeUserCard({ id: "uc-low",  issuer: "Citi",  cardName: "Double",  baseRewardPct: 0.02 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-high", userCardId: "uc-high", rewardPct: 0.05, capAmount: 500, storeName: "Target" }),
        makeOffer({ id: "offer-low",  userCardId: "uc-low",  rewardPct: 0.02, storeName: "Target" }),
      ];

      // highCard has spent exactly the cap — cap is hit, falls back to 1% base
      const tracking = [makeTracking("uc-high", "offer-high", 500)];
      const result   = rankCards(offers, [highCard, lowCard], tracking);

      // uc-low earns 2% (no cap), uc-high earns only 1% base (cap hit)
      expect(result[0].userCard.id).toBe("uc-low");
      expect(result[1].userCard.id).toBe("uc-high");
      // The cap-hit card falls back to its base rate
      expect(result[1].rewardPct).toBe(highCard.card.baseRewardPct);
    });
  });

  // ── c. Expiry urgency score ─────────────────────────────────────────────────
  //
  // expiryRatio formula:
  //   1.0  if no expiry OR > 14 days away
  //   min(1, (14 - daysUntilExpiry) / 14)  if < 14 days
  //
  // This means:
  //   - "no expiry" → ratio = 1.0  (full score)
  //   - "expiring in 3 days" → ratio = (14-3)/14 ≈ 0.786  (slightly penalised)
  //   - "expiring today" → ratio = 14/14 = 1.0  (back to full — use it now!)
  //
  // The urgency bump applies to offers expiring very soon (< 1 day),
  // while offers expiring in a few days score slightly lower.

  describe("c. expiry urgency score", () => {
    it("offer expiring in 3 days scores lower than identical offer with no expiry", () => {
      const cardA = makeUserCard({ id: "uc-expiring", issuer: "Amex",  cardName: "Gold",     baseRewardPct: 0.01 });
      const cardB = makeUserCard({ id: "uc-stable",   issuer: "Chase", cardName: "Sapphire", baseRewardPct: 0.01 });

      const expiringDate = new Date(NOW + 3 * 86400_000); // 3 days from now

      const offers: OfferWithRelevance[] = [
        // Both offer the same rewardPct — expiring in 3 days has expiryRatio ≈ 0.786
        makeOffer({ id: "offer-expiring", userCardId: "uc-expiring", rewardPct: 0.04, validUntil: expiringDate, storeName: "Target" }),
        // No expiry → expiryRatio = 1.0
        makeOffer({ id: "offer-stable",   userCardId: "uc-stable",   rewardPct: 0.04, storeName: "Target" }),
      ];

      const result = rankCards(offers, [cardA, cardB], []);

      // Stable (no expiry) has expiryRatio 1.0 vs expiring's 0.786 → stable scores higher
      expect(result[0].userCard.id).toBe("uc-stable");
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it("offer expiring today (< 1 day) scores as high as one with no expiry", () => {
      const cardA = makeUserCard({ id: "uc-today",  issuer: "Amex",  cardName: "Gold",     baseRewardPct: 0.01 });
      const cardB = makeUserCard({ id: "uc-stable", issuer: "Chase", cardName: "Sapphire", baseRewardPct: 0.01 });

      // Expiring in 1 hour → daysUntilExpiry ≈ 0.04 → expiryRatio = (14 - 0.04)/14 ≈ 0.997
      const expiringToday = new Date(NOW + 60 * 60 * 1000);

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-today",  userCardId: "uc-today",  rewardPct: 0.04, validUntil: expiringToday, storeName: "Target" }),
        makeOffer({ id: "offer-stable", userCardId: "uc-stable", rewardPct: 0.04, storeName: "Target" }),
      ];

      const result = rankCards(offers, [cardA, cardB], []);

      // Both should have very similar scores (within 0.01)
      expect(Math.abs(result[0].score - result[1].score)).toBeLessThan(0.01);
    });

    it("expiry warning is added when offer expires within 14 days", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const expiringDate = new Date(NOW + 7 * 86400_000); // 7 days from now

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05, validUntil: expiringDate, storeName: "Target" }),
      ];

      const result = rankCards(offers, [card], []);

      const expiryWarning = result[0].warnings.find((w) => w.includes("expires in"));
      expect(expiryWarning).toBeDefined();
      expect(expiryWarning).toMatch(/7 days/);
    });
  });

  // ── d. Category-wide offer generates correct warning ───────────────────────

  describe("d. category-wide warning", () => {
    it("includes the category-wide confirmation warning in warnings array", () => {
      const card = makeUserCard({ id: "uc-cat", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({
          id:            "offer-cat",
          userCardId:    "uc-cat",
          rewardPct:     0.05,
          relevanceType: "category_wide",
          categoryName:  "Groceries",
        }),
      ];

      const result = rankCards(offers, [card], []);

      expect(result).toHaveLength(1);
      expect(result[0].warnings).toContain(
        "Category-wide offer — confirm it applies at this store",
      );
    });
  });

  // ── e. No offers → empty array ──────────────────────────────────────────────

  describe("e. no offers", () => {
    it("returns an empty array when offersForStore is empty", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });
      const result = rankCards([], [card], []);
      expect(result).toHaveLength(0);
    });

    it("returns an empty array when userCards is empty", () => {
      const offer = makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05 });
      const result = rankCards([offer], [], []);
      expect(result).toHaveLength(0);
    });
  });

  // ── f. Single card, single offer: score is calculated correctly ─────────────

  describe("f. score calculation", () => {
    it("computes score correctly for a single uncapped offer with no expiry", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05, storeName: "Target" }),
      ];

      const result = rankCards(offers, [card], []);
      expect(result).toHaveLength(1);

      const { score, rewardPct } = result[0];

      // rewardScore   = 0.05 * 0.50 = 0.025
      // headroomScore = 1.0  * 0.20 = 0.20   (no cap)
      // expiryScore   = 1.0  * 0.15 = 0.15   (no expiry)
      // stackScore    = 0              (single offer)
      // total         = 0.375
      expect(rewardPct).toBe(0.05);
      expect(score).toBeCloseTo(0.375, 5);
    });

    it("includes stackScore 0.15 when card has multiple offers", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1a", userCardId: "uc-1", rewardPct: 0.05, storeName: "Target" }),
        makeOffer({ id: "offer-1b", userCardId: "uc-1", rewardPct: 0.03, storeName: "Target" }),
      ];

      const result = rankCards(offers, [card], []);
      expect(result).toHaveLength(1);

      // rewardScore   = 0.05 * 0.50 = 0.025
      // headroomScore = 1.0  * 0.20 = 0.20
      // expiryScore   = 1.0  * 0.15 = 0.15
      // stackScore    = 0.15
      // total         = 0.525
      expect(result[0].score).toBeCloseTo(0.525, 5);
    });
  });

  // ── g. Cap at 90% used: warning mentions percentage and remaining amount ────

  describe("g. cap 90% used warning", () => {
    it("emits a cap-percentage warning when cap is > 85% used", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05, capAmount: 1000, storeName: "Target" }),
      ];

      // 900 / 1000 = 90% used → $100 remaining
      const tracking = [makeTracking("uc-1", "offer-1", 900)];
      const result   = rankCards(offers, [card], tracking);

      expect(result).toHaveLength(1);
      const warning = result[0].warnings.find((w) => w.includes("Cap") && w.includes("used"));
      expect(warning).toBeDefined();
      expect(warning).toMatch(/90%/);
      expect(warning).toMatch(/\$100\.00 remaining/);
    });

    it("does not emit a cap warning when cap is below 85% used", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05, capAmount: 1000, storeName: "Target" }),
      ];

      const tracking = [makeTracking("uc-1", "offer-1", 500)]; // 50%
      const result   = rankCards(offers, [card], tracking);

      const capWarning = result[0].warnings.find((w) => w.includes("Cap") && w.includes("used"));
      expect(capWarning).toBeUndefined();
    });
  });

  // ── h. Reason string contains card name and store name ──────────────────────

  describe("h. reason string format", () => {
    it("contains the card issuer, card name, and store name", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Sapphire Reserve", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05, storeName: "Target" }),
      ];

      const result = rankCards(offers, [card], []);

      expect(result[0].reason).toContain("Chase");
      expect(result[0].reason).toContain("Sapphire Reserve");
      expect(result[0].reason).toContain("Target");
    });

    it("includes category name in reason when offer is category-wide", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Amex", cardName: "Gold", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({
          id:            "offer-1",
          userCardId:    "uc-1",
          rewardPct:     0.04,
          relevanceType: "category_wide",
          categoryName:  "Dining",
        }),
      ];

      const result = rankCards(offers, [card], []);

      expect(result[0].reason).toContain("Dining");
      expect(result[0].reason).toContain("applies to all Dining");
    });

    it("formats the reward percentage correctly in the reason string", () => {
      const card = makeUserCard({ id: "uc-1", issuer: "Chase", cardName: "Freedom", baseRewardPct: 0.01 });

      const offers: OfferWithRelevance[] = [
        makeOffer({ id: "offer-1", userCardId: "uc-1", rewardPct: 0.05, storeName: "Target" }),
      ];

      const result = rankCards(offers, [card], []);

      // formatPct(0.05) → "5%"
      expect(result[0].reason).toMatch(/^5%/);
    });
  });
});
