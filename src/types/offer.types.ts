import type { RewardType } from "./card.types";
import type { Category, Store } from "./store.types";
import type { Card } from "./card.types";

// Re-export Category so existing `import type { Category } from "@/types/offer.types"` still works.
export type { Category } from "./store.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

/** Mirror of the Prisma CapPeriod enum. */
export type CapPeriod = "MONTHLY" | "QUARTERLY" | "ANNUALLY";

/** Mirror of the Prisma DataSource enum. */
export type DataSource = "MANUAL" | "SCRAPED" | "USER_SUBMITTED";

// ─── Offer ────────────────────────────────────────────────────────────────────

/**
 * A reward offer linking a Card to a Store or Category.
 * Includes nested card, store, and category relations.
 */
export interface Offer {
  id:               string;
  cardId:           string;
  storeId:          string | null;
  categoryId:       string | null;
  rewardPct:        number;
  rewardType:       RewardType;
  capAmount:        number | null;
  capPeriod:        CapPeriod | null;
  bonusDescription: string | null;
  validFrom:        Date;
  validUntil:       Date | null;
  isActive:         boolean;
  dataSource:       DataSource;
  lastVerifiedAt:   Date | null;
  createdAt:        Date;
  updatedAt:        Date;
  // Optional nested relations (present when fetched with include/select)
  card?:     Pick<Card, "id" | "issuer" | "cardName" | "network" | "rewardType" | "baseRewardPct" | "imageUrl">;
  store?:    Pick<Store, "id" | "name" | "slug" | "websiteDomain"> | null;
  category?: Pick<Category, "id" | "name" | "slug" | "icon"> | null;
}

/**
 * An offer augmented with how it was matched to a store lookup.
 * - "store_specific": offer.storeId === the queried store
 * - "category_wide":  offer.categoryId === the store's category (no storeId)
 */
export interface OfferWithRelevance extends Offer {
  relevanceType: "store_specific" | "category_wide";
  /** The UserCard ID that holds this offer's card. */
  userCardId:    string | null;
}

// ─── SpendTracking ────────────────────────────────────────────────────────────

/**
 * A spend tracking record for a user's card against an offer cap.
 */
export interface SpendTracking {
  id:          string;
  userCardId:  string;
  offerId:     string;
  periodStart: Date;
  periodEnd:   Date;
  amountSpent: number;
  capHit:      boolean;
  updatedAt:   Date;
}
