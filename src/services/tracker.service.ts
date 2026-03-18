import { prisma } from "@/lib/prisma";
import {
  startOfMonth,  endOfMonth,
  startOfQuarter, endOfQuarter,
  startOfYear,   endOfYear,
} from "date-fns";
import type { CapPeriod } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the [periodStart, periodEnd] date range for a given CapPeriod
 * relative to the current moment.
 */
function getPeriodRange(period: CapPeriod): [Date, Date] {
  const now = new Date();
  switch (period) {
    case "MONTHLY":   return [startOfMonth(now),   endOfMonth(now)];
    case "QUARTERLY": return [startOfQuarter(now), endOfQuarter(now)];
    case "ANNUALLY":  return [startOfYear(now),    endOfYear(now)];
  }
}

/**
 * Service for computing and persisting spend tracking against offer caps.
 */
export class TrackerService {
  /**
   * Returns all SpendTracking records for the user's active cards that fall
   * within the current cap period for each offer.
   *
   * Only records whose periodStart is within the current MONTHLY window are
   * returned by default; callers can pass a specific period to override.
   */
  static async getSpendTracking(userId: string, period: CapPeriod = "MONTHLY") {
    try {
      const [periodStart] = getPeriodRange(period);

      return await prisma.spendTracking.findMany({
        where: {
          userCard:    { userId, isActive: true },
          periodStart: { gte: periodStart },
          offer:       { capPeriod: period, isActive: true },
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
          userCard: {
            select: {
              id:       true,
              nickname: true,
              lastFour: true,
              card: {
                select: {
                  id:       true,
                  issuer:   true,
                  cardName: true,
                  network:  true,
                  imageUrl: true,
                },
              },
            },
          },
          offer: {
            select: {
              id:               true,
              rewardPct:        true,
              rewardType:       true,
              capAmount:        true,
              capPeriod:        true,
              bonusDescription: true,
              store:    { select: { id: true, name: true, slug: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (err) {
      console.error("[TrackerService.getSpendTracking]", err);
      throw err;
    }
  }

  /**
   * Creates or updates a SpendTracking record for a userCard + offer.
   *
   * The periodStart/periodEnd are derived automatically from the offer's
   * capPeriod — no need for the caller to supply them.
   * If the offer has no cap, the record is still written (capHit stays false).
   */
  static async upsertSpendTracking(
    userCardId:  string,
    offerId:     string,
    amountSpent: number,
  ) {
    try {
      const offer = await prisma.offer.findUnique({
        where:  { id: offerId },
        select: { capAmount: true, capPeriod: true },
      });
      if (!offer) return null;

      const [periodStart, periodEnd] = offer.capPeriod
        ? getPeriodRange(offer.capPeriod)
        : [startOfMonth(new Date()), endOfMonth(new Date())];

      const capHit = offer.capAmount
        ? amountSpent >= Number(offer.capAmount)
        : false;

      return await prisma.spendTracking.upsert({
        where: {
          userCardId_offerId_periodStart: { userCardId, offerId, periodStart },
        },
        update: { amountSpent, capHit, periodEnd },
        create: { userCardId, offerId, periodStart, periodEnd, amountSpent, capHit },
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
    } catch (err) {
      console.error("[TrackerService.upsertSpendTracking]", err);
      throw err;
    }
  }

  /**
   * Returns cap headroom details for a specific userCard + offer in the
   * current cap period.
   *
   * Returns null if the offer is not found.
   * If no SpendTracking record exists yet, amountSpent is treated as 0.
   */
  static async getCapHeadroomForOffer(userCardId: string, offerId: string): Promise<{
    capAmount:    number | null;
    amountSpent:  number;
    headroom:     number | null;
    capHit:       boolean;
    percentUsed:  number | null;
  } | null> {
    try {
      const offer = await prisma.offer.findUnique({
        where:  { id: offerId },
        select: { capAmount: true, capPeriod: true },
      });
      if (!offer) return null;

      const capAmount = offer.capAmount ? Number(offer.capAmount) : null;

      if (!offer.capPeriod || capAmount === null) {
        return { capAmount: null, amountSpent: 0, headroom: null, capHit: false, percentUsed: null };
      }

      const [periodStart] = getPeriodRange(offer.capPeriod);

      const tracking = await prisma.spendTracking.findUnique({
        where: {
          userCardId_offerId_periodStart: { userCardId, offerId, periodStart },
        },
        select: { amountSpent: true, capHit: true },
      });

      const amountSpent = tracking ? Number(tracking.amountSpent) : 0;
      const headroom    = Math.max(capAmount - amountSpent, 0);
      const capHit      = amountSpent >= capAmount;
      const percentUsed = Math.min((amountSpent / capAmount) * 100, 100);

      return { capAmount, amountSpent, headroom, capHit, percentUsed };
    } catch (err) {
      console.error("[TrackerService.getCapHeadroomForOffer]", err);
      throw err;
    }
  }

  /**
   * Returns cap utilization for all capped offers on the user's active cards,
   * sorted by utilization descending. Offers with no tracking record appear
   * with $0 spent.
   */
  static async getCapProgress(userId: string, period: CapPeriod = "MONTHLY") {
    try {
      const [periodStart] = getPeriodRange(period);

      const userCards = await prisma.userCard.findMany({
        where: { userId, isActive: true },
        select: {
          id:       true,
          nickname: true,
          card: { select: { id: true, issuer: true, cardName: true } },
          spendTracking: {
            where: {
              periodStart: { gte: periodStart },
              offer:       { capPeriod: period },
            },
            select: {
              offerId:     true,
              amountSpent: true,
              capHit:      true,
              offer: {
                select: {
                  id:          true,
                  rewardPct:   true,
                  rewardType:  true,
                  capAmount:   true,
                  capPeriod:   true,
                  store:    { select: { id: true, name: true } },
                  category: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      const cardIds = userCards.map((uc) => uc.card.id);
      const cappedOffers = await prisma.offer.findMany({
        where: { cardId: { in: cardIds }, capPeriod: period, isActive: true },
        select: {
          id:        true,
          cardId:    true,
          rewardPct: true,
          rewardType: true,
          capAmount: true,
          capPeriod: true,
          store:    { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      const results = userCards.flatMap((userCard) => {
        const relevantOffers = cappedOffers.filter((o) => o.cardId === userCard.card.id);

        return relevantOffers.map((offer) => {
          const tracking    = userCard.spendTracking.find((t) => t.offerId === offer.id);
          const spent       = tracking ? Number(tracking.amountSpent) : 0;
          const cap         = Number(offer.capAmount ?? 0);
          const percentUsed = cap > 0 ? Math.min((spent / cap) * 100, 100) : 0;

          return {
            userCardId:      userCard.id,
            cardName:        userCard.nickname ?? `${userCard.card.issuer} ${userCard.card.cardName}`,
            offerId:         offer.id,
            offerLabel:      offer.store?.name ?? offer.category?.name ?? "Unknown",
            rewardPct:       Number(offer.rewardPct),
            rewardType:      offer.rewardType,
            capAmount:       cap,
            amountSpent:     spent,
            headroom:        Math.max(cap - spent, 0),
            percentUsed,
            capHit:          spent >= cap,
            period,
          };
        });
      });

      return results.sort((a, b) => b.percentUsed - a.percentUsed);
    } catch (err) {
      console.error("[TrackerService.getCapProgress]", err);
      throw err;
    }
  }
}
