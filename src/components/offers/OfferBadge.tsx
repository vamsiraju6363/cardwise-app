import { cn } from "@/lib/utils";
import type { RewardType } from "@/types/card.types";

// ─── Colour tiers ─────────────────────────────────────────────────────────────

function rewardColor(pct: number): string {
  // pct is a decimal fraction (e.g. 0.05 = 5%)
  const p = pct <= 1 ? pct * 100 : pct;
  if (p >= 4)  return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (p >= 2)  return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ─── Reward type icon ─────────────────────────────────────────────────────────

function RewardIcon({ type }: { type: string }) {
  const upper = type.toUpperCase();
  if (upper === "CASHBACK") return <span aria-hidden>$</span>;
  if (upper === "POINTS")   return <span aria-hidden>★</span>;
  if (upper === "MILES")    return <span aria-hidden>✈</span>;
  return null;
}

// ─── OfferBadge ───────────────────────────────────────────────────────────────

interface OfferBadgeProps {
  /** Reward percentage as a decimal fraction (e.g. 0.05 = 5%) or whole number (5). */
  rewardPct:   number;
  rewardType:  RewardType | string;
  label?:      string;
  className?:  string;
}

/**
 * Compact pill badge displaying a reward rate and type.
 * - Emerald for 4%+
 * - Blue for 2–3.99%
 * - Gray for below 2%
 */
export function OfferBadge({ rewardPct, rewardType, label, className }: OfferBadgeProps) {
  const pct     = rewardPct <= 1 ? rewardPct * 100 : rewardPct;
  const display = `${pct.toFixed(pct % 1 === 0 ? 0 : 2)}%`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
        rewardColor(rewardPct),
        className,
      )}
    >
      <RewardIcon type={rewardType} />
      {display}
      {label ? ` · ${label}` : ""}
    </span>
  );
}
