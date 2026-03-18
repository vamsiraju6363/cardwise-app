import type { RewardType } from "./card.types";
import type { UserCard, Card } from "./card.types";
import type { StoreSearchResult } from "./store.types";
import type { Offer } from "./offer.types";

// ─── CardRecommendation (existing — used by RankingService and UI components) ─

/**
 * A single card's ranked recommendation for a given store.
 * Produced by RankingService.getRecommendations().
 */
export interface CardRecommendation {
  userCard:           UserCard;
  offer:              Offer | null;
  effectiveRewardPct: number;
  rewardType:         RewardType;
  explanation:        string;
  isCapReached:       boolean;
  remainingCapAmount: number | null;
  matchedOn:          "store" | "category" | "base";
}

/**
 * The full recommendation response for a store lookup.
 */
export interface RecommendationResult {
  store:           StoreSearchResult;
  recommendations: CardRecommendation[];
  generatedAt:     Date;
}

// ─── RankedCard (richer type for future ranking UI) ───────────────────────────

/**
 * Cap utilization detail attached to a RankedCard when the best offer has a cap.
 */
export interface CapInfo {
  capAmount:   number;
  amountSpent: number;
  headroom:    number;
  percentUsed: number;
}

/**
 * A fully ranked card entry for a store, with score, human-readable reason,
 * actionable warnings, and optional cap detail.
 *
 * Designed for richer UI rendering than CardRecommendation.
 */
export interface RankedCard {
  /** The user's wallet entry for this card. */
  userCard:   UserCard;
  /** The underlying catalog card. */
  card:       Card;
  /** The single best offer selected for this store (store-specific or category-wide). */
  bestOffer:  Offer | null;
  /** All active offers for this card at this store (store-specific + category-wide). */
  allOffers:  Offer[];
  /**
   * Numeric score used for sorting (higher = better).
   * Derived from effectiveRewardPct × 100, with tie-breaking adjustments.
   */
  score:      number;
  /** Effective reward percentage after cap logic (decimal fraction, e.g. 0.05 = 5%). */
  rewardPct:  number;
  /** Human-readable explanation of why this card was ranked here. */
  reason:     string;
  /**
   * Actionable warnings to surface in the UI.
   * Examples: "Cap 80% used", "Expires in 7 days", "Cap reached — earning base rate"
   */
  warnings:   string[];
  /** Present only when bestOffer has a spending cap. */
  capInfo?:   CapInfo;
}
