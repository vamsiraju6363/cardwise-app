import { prisma } from "@/lib/prisma";
import type {
  AddUserCardInput,
  AddCustomCardInput,
  UpdateUserCardInput,
} from "@/lib/validations/card.schema";

// ─── Normalizer for custom cards ───────────────────────────────────────────────

/** Synthetic card shape for custom UserCards (no catalog entry). */
function syntheticCard(raw: {
  id: string;
  customIssuer?: string | null;
  customCardName?: string | null;
  customNetwork?: string | null;
  customBaseRewardPct?: { toString?: () => string } | number | null;
  customRewardType?: string | null;
  addedAt: Date;
}) {
  return {
    id:            `custom-${raw.id}`,
    issuer:        raw.customIssuer ?? "",
    cardName:      raw.customCardName ?? "",
    network:       (raw.customNetwork ?? "VISA") as "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER",
    annualFee:     0,
    rewardType:    (raw.customRewardType ?? "CASHBACK") as "CASHBACK" | "POINTS" | "MILES",
    baseRewardPct: Number(raw.customBaseRewardPct ?? 0),
    imageUrl:      null as string | null,
    isActive:      true,
    createdAt:     raw.addedAt,
    updatedAt:     raw.addedAt,
    offers:        [] as unknown[],
    _count:        { offers: 0 },
  };
}

/** Ensures every UserCard has a card object (synthetic for custom cards). */
function normalizeUserCard<T extends { card?: unknown; id: string; addedAt: Date }>(
  raw: T,
): T & { card: NonNullable<T["card"]> } {
  if (raw.card) return raw as T & { card: NonNullable<T["card"]> };
  const card = syntheticCard({
    id: raw.id,
    customIssuer: (raw as { customIssuer?: string | null }).customIssuer,
    customCardName: (raw as { customCardName?: string | null }).customCardName,
    customNetwork: (raw as { customNetwork?: string | null }).customNetwork,
    customBaseRewardPct: (raw as { customBaseRewardPct?: unknown }).customBaseRewardPct,
    customRewardType: (raw as { customRewardType?: string | null }).customRewardType,
    addedAt: raw.addedAt,
  });
  return { ...raw, card } as T & { card: ReturnType<typeof syntheticCard> };
}

// ─── Shared selects ───────────────────────────────────────────────────────────

const catalogCardSelect = {
  id:            true,
  issuer:        true,
  cardName:      true,
  network:       true,
  annualFee:     true,
  rewardType:    true,
  baseRewardPct: true,
  imageUrl:      true,
  isActive:      true,
  createdAt:     true,
  updatedAt:     true,
} as const;

const offerWithRelationsInclude = {
  where:   { isActive: true },
  include: {
    store:    { select: { id: true, name: true, slug: true } },
    category: { select: { id: true, name: true, slug: true } },
  },
} as const;

/**
 * Service for all card-related database operations.
 *
 * The global Card catalog is read-only from the app's perspective.
 * Users manage their wallet via UserCard records.
 */
export class CardService {
  /**
   * Returns every active card in the global catalog (for the "add card" picker).
   * Alias: getAllCards / getAllCatalogCards.
   */
  static async getAllCards() {
    try {
      return await prisma.card.findMany({
        where:   { isActive: true },
        select:  catalogCardSelect,
        orderBy: [{ issuer: "asc" }, { cardName: "asc" }],
      });
    } catch (err) {
      console.error("[CardService.getAllCards]", err);
      throw err;
    }
  }

  /** Alias kept for backwards-compatibility. */
  static getAllCatalogCards = CardService.getAllCards;

  /**
   * Returns a single catalog card by ID. Returns null if not found.
   */
  static async getCatalogCardById(cardId: string) {
    try {
      return await prisma.card.findUnique({
        where:  { id: cardId },
        select: catalogCardSelect,
      });
    } catch (err) {
      console.error("[CardService.getCatalogCardById]", err);
      throw err;
    }
  }

  /**
   * Returns all UserCard records (active + inactive) for a user.
   * Custom cards get a synthetic card object.
   */
  static async getUserCardsIncludingInactive(userId: string) {
    try {
      const rows = await prisma.userCard.findMany({
        where: { userId },
        include: {
          card: {
            include: {
              offers: offerWithRelationsInclude,
              _count: {
                select: { offers: { where: { isActive: true } } },
              },
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { addedAt: "desc" }],
      });
      return rows.map((r) => normalizeUserCard(r));
    } catch (err) {
      console.error("[CardService.getUserCardsIncludingInactive]", err);
      throw err;
    }
  }

  /**
   * Returns all active UserCard records for a user. Catalog cards include
   * offers; custom cards get a synthetic card object (no offers).
   */
  static async getUserCards(userId: string) {
    try {
      const rows = await prisma.userCard.findMany({
        where: { userId, isActive: true },
        include: {
          card: {
            include: {
              offers: offerWithRelationsInclude,
              _count: {
                select: { offers: { where: { isActive: true } } },
              },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      });
      return rows.map((r) => normalizeUserCard(r));
    } catch (err) {
      console.error("[CardService.getUserCards]", err);
      throw err;
    }
  }

  /**
   * Returns a single UserCard, verifying it belongs to the given user.
   * Returns null if not found. Custom cards get a synthetic card object.
   */
  static async getUserCardById(userCardId: string, userId: string) {
    try {
      const row = await prisma.userCard.findFirst({
        where: { id: userCardId, userId },
        include: {
          card: {
            include: {
              offers: offerWithRelationsInclude,
              _count: {
                select: { offers: { where: { isActive: true } } },
              },
            },
          },
        },
      });
      return row ? normalizeUserCard(row) : null;
    } catch (err) {
      console.error("[CardService.getUserCardById]", err);
      throw err;
    }
  }

  /**
   * Adds a catalog card to the user's wallet.
   * Returns the existing record if the user already has this card active.
   */
  static async addUserCard(userId: string, data: AddUserCardInput) {
    try {
      const existing = await prisma.userCard.findFirst({
        where:   { userId, cardId: data.cardId, isActive: true },
        include: { card: true },
      });
      if (existing) return normalizeUserCard(existing);

      const created = await prisma.userCard.create({
        data: {
          userId,
          cardId:   data.cardId,
          nickname: data.nickname ?? null,
          lastFour: data.lastFour ?? null,
        },
        include: { card: true },
      });
      return normalizeUserCard(created);
    } catch (err) {
      console.error("[CardService.addUserCard]", err);
      throw err;
    }
  }

  /**
   * Adds a custom card (not in catalog) to the user's wallet.
   */
  static async addCustomUserCard(userId: string, data: AddCustomCardInput) {
    try {
      const created = await prisma.userCard.create({
        data: {
          userId,
          cardId:            null,
          nickname:          data.nickname ?? null,
          lastFour:          data.lastFour ?? null,
          customIssuer:      data.issuer,
          customCardName:    data.cardName,
          customNetwork:     data.network as "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER",
          customBaseRewardPct: data.baseRewardPct,
          customRewardType:  data.rewardType as "CASHBACK" | "POINTS" | "MILES",
        },
        include: { card: true },
      });
      return normalizeUserCard(created);
    } catch (err) {
      console.error("[CardService.addCustomUserCard]", err);
      throw err;
    }
  }

  /**
   * Updates a UserCard's nickname, lastFour, or active status.
   * Returns null if the record doesn't exist or belongs to another user.
   */
  static async updateUserCard(
    userCardId: string,
    userId: string,
    data: UpdateUserCardInput,
  ) {
    try {
      const existing = await prisma.userCard.findFirst({
        where: { id: userCardId, userId },
      });
      if (!existing) return null;

      const updated = await prisma.userCard.update({
        where:   { id: userCardId },
        data:    {
          nickname: data.nickname,
          lastFour: data.lastFour,
          isActive: data.isActive,
        },
        include: { card: true },
      });
      return normalizeUserCard(updated);
    } catch (err) {
      console.error("[CardService.updateUserCard]", err);
      throw err;
    }
  }

  /**
   * Soft-removes a card from the user's wallet (sets isActive = false).
   * Returns null if the record doesn't exist or belongs to another user.
   */
  static async removeUserCard(userCardId: string, userId: string) {
    try {
      const existing = await prisma.userCard.findFirst({
        where: { id: userCardId, userId },
      });
      if (!existing) return null;

      return await prisma.userCard.update({
        where: { id: userCardId },
        data:  { isActive: false },
      });
    } catch (err) {
      console.error("[CardService.removeUserCard]", err);
      throw err;
    }
  }
}
