// ─── Enums ────────────────────────────────────────────────────────────────────

/** Mirror of the Prisma CardNetwork enum — usable without importing @prisma/client. */
export type CardNetwork = "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER";

/** Mirror of the Prisma RewardType enum. */
export type RewardType = "CASHBACK" | "POINTS" | "MILES";

// ─── Models ───────────────────────────────────────────────────────────────────

/**
 * A credit card product from the global catalog.
 */
export interface Card {
  id:            string;
  issuer:        string;
  cardName:      string;
  network:       CardNetwork;
  annualFee:     number;
  rewardType:    RewardType;
  baseRewardPct: number;
  imageUrl:      string | null;
  isActive:      boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

/**
 * A user's specific instance of a card — from the catalog or custom.
 * Includes the nested catalog Card (or synthetic for custom) and a count of active offers.
 * cardId is null for custom cards.
 */
export interface UserCard {
  id:               string;
  userId:           string;
  cardId:           string | null;
  nickname:         string | null;
  lastFour:         string | null;
  isActive:         boolean;
  addedAt:          Date;
  card:             Card & {
    _count?: { offers: number };
  };
  activeOffersCount?: number;
}

// ─── Input types ──────────────────────────────────────────────────────────────

/** Payload for adding a card to the user's wallet. */
export interface AddCardInput {
  cardId:   string;
  nickname?: string;
  lastFour?: string;
}

/** Payload for updating a user's card instance. */
export interface UpdateCardInput {
  nickname?: string | null;
  lastFour?: string | null;
  isActive?: boolean;
}

// ─── Legacy aliases (kept for backwards-compatibility with existing imports) ──

/** @deprecated Use AddCardInput */
export type AddUserCardInput    = AddCardInput;
/** @deprecated Use UpdateCardInput */
export type UpdateUserCardInput = UpdateCardInput;
