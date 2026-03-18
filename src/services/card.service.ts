import { prisma } from "@/lib/prisma";
import type { AddUserCardInput, UpdateUserCardInput } from "@/lib/validations/card.schema";

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
   * Used for the "Archived" section in the wallet.
   */
  static async getUserCardsIncludingInactive(userId: string) {
    try {
      return await prisma.userCard.findMany({
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
    } catch (err) {
      console.error("[CardService.getUserCardsIncludingInactive]", err);
      throw err;
    }
  }

  /**
   * Returns all active UserCard records for a user, including:
   * - the catalog Card
   * - all active Offers with store/category details
   * - a count of active offers (_count.offers)
   */
  static async getUserCards(userId: string) {
    try {
      return await prisma.userCard.findMany({
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
    } catch (err) {
      console.error("[CardService.getUserCards]", err);
      throw err;
    }
  }

  /**
   * Returns a single UserCard, verifying it belongs to the given user.
   * Returns null if not found or ownership mismatch.
   */
  static async getUserCardById(userCardId: string, userId: string) {
    try {
      return await prisma.userCard.findFirst({
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
      if (existing) return existing;

      return await prisma.userCard.create({
        data: {
          userId,
          cardId:   data.cardId,
          nickname: data.nickname ?? null,
          lastFour: data.lastFour ?? null,
        },
        include: { card: true },
      });
    } catch (err) {
      console.error("[CardService.addUserCard]", err);
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

      return await prisma.userCard.update({
        where:   { id: userCardId },
        data:    {
          nickname: data.nickname,
          lastFour: data.lastFour,
          isActive: data.isActive,
        },
        include: { card: true },
      });
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
