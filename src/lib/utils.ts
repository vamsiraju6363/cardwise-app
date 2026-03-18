import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RewardType } from "@/types/card.types";
import type { CapPeriod } from "@/types/offer.types";

// ─── Image placeholder ────────────────────────────────────────────────────────

/** Base64 blur placeholder for next/image (gray 10x10). */
export const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwA/wA/8A//Z";

// ─── Class name utility ───────────────────────────────────────────────────────

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Formats a number as a USD currency string.
 * @example formatCurrency(1234.56) → "$1,234.56"
 * @example formatCurrency(0)       → "$0.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style:                 "currency",
    currency:              "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a decimal reward percentage for display.
 * Accepts either a decimal fraction (0.05) or a whole percentage (5).
 * Values ≤ 1 are treated as decimal fractions and multiplied by 100.
 *
 * @example formatPercent(0.05)  → "5.00%"
 * @example formatPercent(5)     → "5.00%"
 * @example formatPercent(0.015) → "1.50%"
 */
export function formatPercent(pct: number): string {
  const value = pct <= 1 ? pct * 100 : pct;
  return `${value.toFixed(2)}%`;
}

// ─── Label helpers ────────────────────────────────────────────────────────────

/**
 * Returns a human-readable label for a reward type enum value.
 * @example getRewardTypeLabel("CASHBACK") → "Cash Back"
 * @example getRewardTypeLabel("POINTS")   → "Points"
 * @example getRewardTypeLabel("MILES")    → "Miles"
 */
export function getRewardTypeLabel(type: RewardType): "Cash Back" | "Points" | "Miles" {
  switch (type) {
    case "CASHBACK": return "Cash Back";
    case "POINTS":   return "Points";
    case "MILES":    return "Miles";
  }
}

/**
 * Returns a human-readable label for a cap period enum value.
 * @example getCapPeriodLabel("MONTHLY")   → "per month"
 * @example getCapPeriodLabel("QUARTERLY") → "per quarter"
 * @example getCapPeriodLabel("ANNUALLY")  → "per year"
 */
export function getCapPeriodLabel(period: CapPeriod): "per month" | "per quarter" | "per year" {
  switch (period) {
    case "MONTHLY":   return "per month";
    case "QUARTERLY": return "per quarter";
    case "ANNUALLY":  return "per year";
  }
}

// ─── Cap / offer logic ────────────────────────────────────────────────────────

/**
 * Calculates the remaining headroom before a spending cap is hit.
 * Always returns a non-negative number (clamps at 0 if cap is already exceeded).
 *
 * @example calculateCapHeadroom(1500, 900) → 600
 * @example calculateCapHeadroom(1500, 1600) → 0
 */
export function calculateCapHeadroom(capAmount: number, spent: number): number {
  return Math.max(capAmount - spent, 0);
}

/**
 * Returns true if an offer's `validUntil` date falls within the next `days` days,
 * OR if the offer has already expired (so the UI can warn the user in both cases).
 * Returns false if `validUntil` is null (offer has no expiry).
 *
 * @param validUntil - The offer's expiry date, or null for ongoing offers.
 * @param days       - Look-ahead window in days (default: 14).
 *
 * @example isOfferExpiringSoon(new Date(Date.now() + 7 * 86400_000))  → true  (7 days away)
 * @example isOfferExpiringSoon(new Date(Date.now() + 30 * 86400_000)) → false (30 days away)
 * @example isOfferExpiringSoon(new Date(Date.now() - 86400_000))      → true  (already expired)
 * @example isOfferExpiringSoon(null)                                  → false
 */
export function isOfferExpiringSoon(
  validUntil: Date | null,
  days = 14,
): boolean {
  if (!validUntil) return false;
  const now       = Date.now();
  const expiresAt = new Date(validUntil).getTime();
  const windowMs  = days * 24 * 60 * 60 * 1000;
  // Already expired OR expiring within the window
  return expiresAt <= now || expiresAt - now <= windowMs;
}
