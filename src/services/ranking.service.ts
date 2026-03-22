import { prisma } from "@/lib/prisma";
import { CardService } from "./card.service";
import { StoreService } from "./store.service";
import { OfferService } from "./offer.service";
import type {
  CardRecommendation,
  RecommendationResult,
  RankedCard,
  CapInfo,
} from "@/types/ranking.types";
import type { UserCard } from "@/types/card.types";
import type { OfferWithRelevance } from "@/types/offer.types";
import type { SpendTracking } from "@/types/offer.types";
import {
  startOfMonth,  endOfMonth,
  startOfQuarter, endOfQuarter,
  startOfYear,   endOfYear,
} from "date-fns";
import type { CapPeriod } from "@prisma/client";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getCapPeriodRange(period: CapPeriod): [Date, Date] {
  const now = new Date();
  switch (period) {
    case "MONTHLY":   return [startOfMonth(now),   endOfMonth(now)];
    case "QUARTERLY": return [startOfQuarter(now), endOfQuarter(now)];
    case "ANNUALLY":  return [startOfYear(now),    endOfYear(now)];
  }
}

/** Formats a decimal reward pct for display: 0.05 → "5%", 0.015 → "1.5%" */
function formatPct(pct: number): string {
  const p = pct * 100;
  return `${p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)}%`;
}

/** Days until a date from now. Negative if already past. */
function daysUntil(date: Date): number {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

// ─── rankCards ────────────────────────────────────────────────────────────────

/**
 * Pure ranking function — no DB calls.
 *
 * Scoring formula (total = 1.0):
 *   rewardScore   = bestOffer.rewardPct * 0.50
 *   headroomScore = capHeadroomRatio    * 0.20
 *   expiryScore   = expiryRatio         * 0.15
 *   stackScore    = 0.15 if multiple offers (stacking possible), else 0
 *
 * headroomRatio:
 *   1.0  if no cap
 *   0.0  if cap hit
 *   headroom / capAmount  otherwise
 *
 * expiryRatio (urgency — use it before it expires):
 *   1.0  if no expiry or > 14 days away
 *   min(1, (14 - daysUntilExpiry) / 14)  if < 14 days
 */
export function rankCards(
  offersForStore: OfferWithRelevance[],
  userCards:      UserCard[],
  trackingRecords: SpendTracking[],
): RankedCard[] {
  // Index tracking records by "userCardId:offerId" for O(1) lookup
  const trackingIndex = new Map<string, SpendTracking>();
  for (const t of trackingRecords) {
    trackingIndex.set(`${t.userCardId}:${t.offerId}`, t);
  }

  // Group offers by userCardId (cards without offers get empty array — we still show base rate)
  const offersByUserCard = new Map<string, OfferWithRelevance[]>();
  for (const offer of offersForStore) {
    if (!offer.userCardId) continue;
    const list = offersByUserCard.get(offer.userCardId) ?? [];
    list.push(offer);
    offersByUserCard.set(offer.userCardId, list);
  }

  const ranked: RankedCard[] = [];

  // Include ALL user cards, not just those with offers — cards without offers show base rate
  for (const userCard of userCards) {
    const userCardId = userCard.id;
    const cardOffers = offersByUserCard.get(userCardId) ?? [];
    const card = userCard.card;

    // ── Find the best offer ──────────────────────────────────────────────────
    // Eligible = active, not expired, not cap-hit
    const now = new Date();
    const eligibleOffers = cardOffers.filter((o) => {
      if (!o.isActive) return false;
      if (o.validUntil && new Date(o.validUntil) < now) return false;
      // Check cap
      if (o.capAmount) {
        const tracking = trackingIndex.get(`${userCardId}:${o.id}`);
        const spent    = tracking ? Number(tracking.amountSpent) : 0;
        if (spent >= Number(o.capAmount)) return false;
      }
      return true;
    });

    // Sort eligible by rewardPct descending to find the best
    eligibleOffers.sort((a, b) => Number(b.rewardPct) - Number(a.rewardPct));
    const bestOffer = eligibleOffers[0] ?? null;

    // If no eligible offer, fall back to base rate with a synthetic "offer"
    const effectiveRewardPct = bestOffer
      ? Number(bestOffer.rewardPct)
      : Number(card.baseRewardPct);

    // ── Cap info ─────────────────────────────────────────────────────────────
    let capInfo: CapInfo | undefined;
    let capHit = false;
    let headroomRatio = 1.0;

    if (bestOffer?.capAmount) {
      const tracking   = trackingIndex.get(`${userCardId}:${bestOffer.id}`);
      const amountSpent = tracking ? Number(tracking.amountSpent) : 0;
      const capAmount   = Number(bestOffer.capAmount);
      const headroom    = Math.max(capAmount - amountSpent, 0);
      const percentUsed = capAmount > 0 ? Math.min((amountSpent / capAmount) * 100, 100) : 0;

      capHit       = amountSpent >= capAmount;
      headroomRatio = capHit ? 0 : headroom / capAmount;
      capInfo = { capAmount, amountSpent, headroom, percentUsed };
    }

    // ── Expiry score ─────────────────────────────────────────────────────────
    let expiryRatio = 1.0;
    if (bestOffer?.validUntil) {
      const days = daysUntil(new Date(bestOffer.validUntil));
      if (days < 14) {
        // Urgency: the closer to expiry, the higher the score (use it before it expires)
        expiryRatio = Math.min(1, Math.max(0, (14 - days) / 14));
      }
    }

    // ── Stack score ──────────────────────────────────────────────────────────
    const stackScore = cardOffers.length > 1 ? 0.15 : 0;

    // ── Total score ──────────────────────────────────────────────────────────
    const rewardScore   = effectiveRewardPct * 0.50;
    const headroomScore = headroomRatio       * 0.20;
    const expiryScore   = expiryRatio         * 0.15;
    const totalScore    = rewardScore + headroomScore + expiryScore + stackScore;

    // ── Reason string ────────────────────────────────────────────────────────
    const storeName    = bestOffer?.store?.name ?? "this store";
    const categoryName = bestOffer?.category?.name ?? card.rewardType.toLowerCase();
    const isCategoryWide = bestOffer
      ? bestOffer.relevanceType === "category_wide"
      : false;

    let reason = `${formatPct(effectiveRewardPct)} ${card.rewardType.toLowerCase()} at ${storeName}`;
    reason += ` · via ${card.issuer} ${card.cardName}`;
    if (isCategoryWide) {
      reason += ` (applies to all ${categoryName})`;
    }

    // ── Warnings ─────────────────────────────────────────────────────────────
    const warnings: string[] = [];

    if (capHit) {
      warnings.push("Spending cap reached for this period");
    } else if (capInfo && capInfo.percentUsed > 85) {
      warnings.push(
        `Cap ${capInfo.percentUsed.toFixed(0)}% used — $${capInfo.headroom.toFixed(2)} remaining`,
      );
    }

    if (bestOffer?.validUntil) {
      const days = Math.ceil(daysUntil(new Date(bestOffer.validUntil)));
      if (days < 14 && days > 0) {
        warnings.push(`Offer expires in ${days} day${days === 1 ? "" : "s"}`);
      }
    }

    if (isCategoryWide) {
      warnings.push("Category-wide offer — confirm it applies at this store");
    }

    ranked.push({
      userCard,
      card,
      bestOffer:  bestOffer ?? null,
      allOffers:  cardOffers,
      score:      totalScore,
      rewardPct:  effectiveRewardPct,
      reason,
      warnings,
      capInfo,
    });
  }

  // Sort by totalScore descending
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

// ─── RankingService ───────────────────────────────────────────────────────────

/**
 * Service that computes ranked card recommendations for a given store.
 *
 * Exposes two surfaces:
 *   - rankCards()           — pure function, used by the /api/recommend route
 *   - getRecommendations()  — full DB-orchestrated method, kept for backward compat
 *                             with the existing /store/[id] page and UI components
 */
export class RankingService {
  /**
   * Returns all of the user's wallet cards ranked by effective reward rate
   * at the specified store, accounting for offers and spending caps.
   *
   * Used by the legacy /store/[storeId] page and RecommendationList component.
   * The /api/recommend route uses rankCards() directly for the richer RankedCard shape.
   */
  static async getRecommendations(
    userId:  string,
    storeId: string,
  ): Promise<RecommendationResult | null> {
    const store = await StoreService.getStoreById(storeId);
    if (!store) return null;

    const userCards = await CardService.getUserCards(userId);

    const recommendations: CardRecommendation[] = await Promise.all(
      userCards.map(async (userCard) => {
        const { card } = userCard;
        const baseRate  = Number(card.baseRewardPct);

        const storeOffer = card.offers
          .filter((o) => o.storeId === storeId)
          .sort((a, b) => Number(b.rewardPct) - Number(a.rewardPct))[0] ?? null;

        const categoryOffer = card.offers
          .filter((o) => !o.storeId && o.categoryId === store.categoryId)
          .sort((a, b) => Number(b.rewardPct) - Number(a.rewardPct))[0] ?? null;

        const bestOffer = (() => {
          const candidates = [storeOffer, categoryOffer].filter(Boolean);
          if (candidates.length === 0) return null;
          return candidates.reduce((best, current) =>
            Number(current!.rewardPct) > Number(best!.rewardPct) ? current : best,
          );
        })();

        let isCapReached        = false;
        let remainingCapAmount: number | null = null;
        let effectiveRewardPct  = baseRate;
        let matchedOn: CardRecommendation["matchedOn"] = "base";

        if (bestOffer) {
          const offerRate = Number(bestOffer.rewardPct);
          matchedOn = bestOffer.storeId ? "store" : "category";

          if (bestOffer.capAmount && bestOffer.capPeriod) {
            const [periodStart] = getCapPeriodRange(bestOffer.capPeriod as CapPeriod);

            const tracking = await prisma.spendTracking.findUnique({
              where: {
                userCardId_offerId_periodStart: {
                  userCardId:  userCard.id,
                  offerId:     bestOffer.id,
                  periodStart,
                },
              },
            });

            const spent = tracking ? Number(tracking.amountSpent) : 0;
            const cap   = Number(bestOffer.capAmount);

            if (spent >= cap) {
              isCapReached       = true;
              effectiveRewardPct = baseRate;
              remainingCapAmount = 0;
            } else {
              effectiveRewardPct = offerRate;
              remainingCapAmount = cap - spent;
            }
          } else {
            effectiveRewardPct = offerRate;
          }
        }

        const displayName = userCard.nickname ?? `${card.issuer} ${card.cardName}`;
        let explanation: string;

        if (matchedOn === "base") {
          explanation = `Earns ${formatPct(baseRate)} base ${card.rewardType.toLowerCase()} on all purchases — no bonus category for ${store.category.name}.`;
        } else if (isCapReached) {
          explanation = `${formatPct(Number(bestOffer!.rewardPct))} ${card.rewardType.toLowerCase()} on ${store.category.name} — spending cap of $${bestOffer!.capAmount} reached this ${bestOffer!.capPeriod!.toLowerCase()}. Earning base ${formatPct(baseRate)} instead.`;
        } else if (bestOffer?.capAmount && remainingCapAmount !== null) {
          explanation = `${formatPct(effectiveRewardPct)} ${card.rewardType.toLowerCase()} on ${matchedOn === "store" ? store.name : store.category.name}. $${remainingCapAmount.toFixed(2)} remaining before $${bestOffer.capAmount} ${bestOffer.capPeriod!.toLowerCase()} cap.`;
        } else {
          explanation = `${formatPct(effectiveRewardPct)} ${card.rewardType.toLowerCase()} on ${matchedOn === "store" ? store.name : store.category.name} — no spending cap.`;
        }

        if (bestOffer?.bonusDescription) {
          explanation += ` (${bestOffer.bonusDescription})`;
        }

        void displayName; // used only for legacy explanation context

        return {
          userCard,
          offer:              bestOffer ?? null,
          effectiveRewardPct,
          rewardType:         card.rewardType,
          explanation,
          isCapReached,
          remainingCapAmount,
          matchedOn,
        } as unknown as CardRecommendation;
      }),
    );

    recommendations.sort((a, b) => b.effectiveRewardPct - a.effectiveRewardPct);

    return {
      store: { ...store, matchScore: 100 },
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Orchestrates the full data fetch and calls rankCards() for the
   * /api/recommend route. Returns the richer RankedCard[] shape.
   *
   * Returns null if the store is not found.
   * Returns an empty rankedCards array with message "no_cards" if the user
   * has no active wallet cards.
   */
  static async getRankedCards(
    userId:  string,
    storeId: string,
  ): Promise<{
    store:            Awaited<ReturnType<typeof StoreService.getStoreById>>;
    rankedCards:      RankedCard[];
    totalOffersFound: number;
    message?:         string;
  } | null> {
    const store = await StoreService.getStoreById(storeId);
    if (!store) return null;

    const userCardsRaw = await CardService.getUserCards(userId);
    const userCards = userCardsRaw.map((uc) => ({
       ...uc,
       card: {
        ...uc.card,
        baseRewardPct: Number(uc.card.baseRewardPct),
        annualFee:     Number(uc.card.annualFee),
       },
    }));
    if (userCards.length === 0) {
      return { store, rankedCards: [], totalOffersFound: 0, message: "no_cards" };
    }

    const userCardIds = userCards.map((uc) => uc.id);

    // Fetch all relevant offers in one query
    const offersRaw = await OfferService.getOffersForStore(storeId, userCardIds);
    if (!offersRaw) return null; // store not found inside service

    // Fetch spend tracking for all relevant offers in the current period
    const offerIds = offersRaw.map((o) => o.id);
    const trackingRecords = await prisma.spendTracking.findMany({
      where: {
        userCardId: { in: userCardIds },
        offerId:    { in: offerIds },
      },
      select: {
        id:          true,
        userCardId:  true,
        offerId:     true,
        periodStart: true,
        periodEnd:   true,
        amountSpent: true,
        capHit:      true,
        updatedAt:   true,
      },
    });

    // Cast offers to OfferWithRelevance — the service already attaches userCardId
    // and the relevanceType can be derived from storeId presence
    const offersWithRelevance: OfferWithRelevance[] = offersRaw.map((o) => ({
      ...o,
      rewardPct:      Number(o.rewardPct),
      capAmount:      o.capAmount ? Number(o.capAmount) : null,
      relevanceType:  o.storeId ? "store_specific" : "category_wide",
      card: {
        ...o.card,
        baseRewardPct: Number(o.card.baseRewardPct),
      },
    }));

    const trackingRecordsCast = trackingRecords.map((t) => ({
      ...t,
      amountSpent: Number(t.amountSpent),
    }));
    const rankedCards = rankCards(offersWithRelevance, userCards, trackingRecordsCast);

    return {
      store,
      rankedCards,
      totalOffersFound: offersRaw.length,
    };
  }
}
