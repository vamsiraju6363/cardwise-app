import { prisma } from "@/lib/prisma";
import type { CreateOfferInput, UpdateOfferInput } from "@/lib/validations/offer.schema";

// ─── Shared selects ───────────────────────────────────────────────────────────

const offerDetailSelect = {
  id:               true,
  cardId:           true,
  storeId:          true,
  categoryId:       true,
  rewardPct:        true,
  rewardType:       true,
  capAmount:        true,
  capPeriod:        true,
  bonusDescription: true,
  validFrom:        true,
  validUntil:       true,
  isActive:         true,
  dataSource:       true,
  lastVerifiedAt:   true,
  createdAt:        true,
  updatedAt:        true,
  card: {
    select: {
      id:            true,
      issuer:        true,
      cardName:      true,
      network:       true,
      rewardType:    true,
      baseRewardPct: true,
      imageUrl:      true,
    },
  },
  store: {
    select: { id: true, name: true, slug: true, websiteDomain: true },
  },
  category: {
    select: { id: true, name: true, slug: true, icon: true },
  },
} as const;

/** Shared filter: offer must be active and not expired. */
function activeOfferWhere() {
  const now = new Date();
  return {
    isActive:   true,
    validFrom:  { lte: now },
    OR: [
      { validUntil: null },
      { validUntil: { gte: now } },
    ],
  } as const;
}

/**
 * Service for offer lookup and administration.
 */
export class OfferService {
  /**
   * Returns all active, non-expired offers relevant to a store for the given
   * user cards. An offer is relevant when:
   *   (a) offer.storeId === storeId  (store-specific), OR
   *   (b) offer.categoryId === store.categoryId  (category-wide)
   *
   * Only offers whose card has a matching UserCard in `userCardIds` are returned.
   * Returns null if the store is not found.
   */
  static async getOffersForStore(storeId: string, userCardIds: string[]) {
    try {
      const store = await prisma.store.findUnique({
        where:  { id: storeId },
        select: { id: true, categoryId: true },
      });
      if (!store) return null;

      // Resolve the cardIds that belong to the provided userCards
      const userCards = await prisma.userCard.findMany({
        where:  { id: { in: userCardIds }, isActive: true },
        select: { id: true, cardId: true },
      });
      const cardIds = userCards.map((uc) => uc.cardId);

      const offers = await prisma.offer.findMany({
        where: {
          ...activeOfferWhere(),
          cardId: { in: cardIds },
          OR: [
            { storeId },
            { categoryId: store.categoryId, storeId: null },
          ],
        },
        select: offerDetailSelect,
        orderBy: { rewardPct: "desc" },
      });

      // Attach the matching userCardId to each offer for convenience
      const cardIdToUserCardId = new Map(
        userCards.map((uc) => [uc.cardId, uc.id])
      );

      return offers.map((offer) => ({
        ...offer,
        userCardId: cardIdToUserCardId.get(offer.cardId) ?? null,
      }));
    } catch (err) {
      console.error("[OfferService.getOffersForStore]", err);
      throw err;
    }
  }

  /**
   * Returns full detail for a single offer. Returns null if not found.
   */
  static async getOfferById(offerId: string) {
    try {
      return await prisma.offer.findUnique({
        where:  { id: offerId },
        select: offerDetailSelect,
      });
    } catch (err) {
      console.error("[OfferService.getOfferById]", err);
      throw err;
    }
  }

  /**
   * Creates a new offer (admin use).
   * Validates that at least one of storeId / categoryId is provided.
   */
  static async createOffer(data: CreateOfferInput) {
    try {
      return await prisma.offer.create({
        data: {
          cardId:           data.cardId,
          storeId:          data.storeId    ?? null,
          categoryId:       data.categoryId ?? null,
          rewardPct:        data.rewardPct,
          rewardType:       data.rewardType,
          capAmount:        data.capAmount   ?? null,
          capPeriod:        data.capPeriod   ?? null,
          bonusDescription: data.bonusDescription ?? null,
          validFrom:        data.validFrom ? new Date(data.validFrom) : new Date(),
          validUntil:       data.validUntil ? new Date(data.validUntil) : null,
          dataSource:       data.dataSource ?? "MANUAL",
        },
        select: offerDetailSelect,
      });
    } catch (err) {
      console.error("[OfferService.createOffer]", err);
      throw err;
    }
  }

  /**
   * Updates an existing offer (admin use).
   * Returns null if the offer is not found.
   */
  static async updateOffer(offerId: string, data: UpdateOfferInput) {
    try {
      const existing = await prisma.offer.findUnique({
        where:  { id: offerId },
        select: { id: true },
      });
      if (!existing) return null;

      return await prisma.offer.update({
        where: { id: offerId },
        data:  {
          ...(data.rewardPct        !== undefined && { rewardPct:        data.rewardPct }),
          ...(data.rewardType       !== undefined && { rewardType:       data.rewardType }),
          ...(data.capAmount        !== undefined && { capAmount:        data.capAmount }),
          ...(data.capPeriod        !== undefined && { capPeriod:        data.capPeriod }),
          ...(data.bonusDescription !== undefined && { bonusDescription: data.bonusDescription }),
          ...(data.validUntil       !== undefined && { validUntil:       data.validUntil ? new Date(data.validUntil) : null }),
          ...(data.isActive         !== undefined && { isActive:         data.isActive }),
          ...(data.dataSource       !== undefined && { dataSource:       data.dataSource }),
          ...(data.lastVerifiedAt   !== undefined && { lastVerifiedAt:   data.lastVerifiedAt ? new Date(data.lastVerifiedAt) : null }),
        },
        select: offerDetailSelect,
      });
    } catch (err) {
      console.error("[OfferService.updateOffer]", err);
      throw err;
    }
  }
}
