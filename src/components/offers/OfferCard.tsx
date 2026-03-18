"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, BLUR_DATA_URL } from "@/lib/utils";
import { formatPercent, getRewardTypeLabel, getCapPeriodLabel, isOfferExpiringSoon } from "@/lib/utils";
import { OfferBadge } from "./OfferBadge";
import { Badge } from "@/components/ui/badge";
import { Crown, ChevronDown, ChevronUp, AlertTriangle, Clock } from "lucide-react";
import type { CardRecommendation } from "@/types/ranking.types";
import type { RewardType } from "@/types/card.types";

// ─── Network gradient config (mirrors CardTile) ───────────────────────────────

const NETWORK_GRADIENT: Record<string, string> = {
  VISA:       "from-blue-600 via-blue-700 to-blue-900",
  MASTERCARD: "from-orange-500 via-orange-600 to-red-700",
  AMEX:       "from-emerald-600 via-emerald-700 to-teal-900",
  DISCOVER:   "from-purple-600 via-purple-700 to-indigo-900",
};

function networkGradient(network: string) {
  return NETWORK_GRADIENT[network.toUpperCase()] ?? "from-slate-600 via-slate-700 to-slate-900";
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1.5">
        <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Best pick</span>
      </div>
    );
  }
  const label = rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`;
  return (
    <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</span>
  );
}

// ─── Warning badges ───────────────────────────────────────────────────────────

interface WarningBadgesProps {
  isCapReached:       boolean;
  remainingCapAmount: number | null;
  offer:              CardRecommendation["offer"];
}

function WarningBadges({ isCapReached, remainingCapAmount, offer }: WarningBadgesProps) {
  const warnings: React.ReactNode[] = [];

  if (isCapReached) {
    warnings.push(
      <span key="cap-hit" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <AlertTriangle className="h-3 w-3" />
        Cap hit!
      </span>,
    );
  } else if (offer?.capAmount && remainingCapAmount !== null) {
    const cap     = Number(offer.capAmount);
    const spent   = cap - remainingCapAmount;
    const pctUsed = cap > 0 ? Math.round((spent / cap) * 100) : 0;
    if (pctUsed >= 60) {
      warnings.push(
        <span key="cap-pct" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle className="h-3 w-3" />
          Cap {pctUsed}% used
        </span>,
      );
    }
  }

  if (offer?.validUntil && isOfferExpiringSoon(new Date(offer.validUntil), 14)) {
    const daysLeft = Math.ceil(
      (new Date(offer.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    warnings.push(
      <span key="expiry" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" />
        Expires in {daysLeft}d
      </span>,
    );
  }

  if (warnings.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-2">{warnings}</div>;
}

// ─── Expanded offer list ──────────────────────────────────────────────────────

interface ExpandedOffersProps {
  rec: CardRecommendation;
}

function ExpandedOffers({ rec }: ExpandedOffersProps) {
  const { offer, userCard } = rec;
  const { card } = userCard;

  if (!offer) {
    return (
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center py-2">
          Earning base rate — no active bonus offers
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
        Active offers
      </p>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <OfferBadge
            rewardPct={offer.rewardPct}
            rewardType={card.rewardType}
          />
          {offer.capAmount && offer.capPeriod && (
            <span className="text-xs text-gray-500">
              Up to ${Number(offer.capAmount).toLocaleString()} {getCapPeriodLabel(offer.capPeriod as "MONTHLY" | "QUARTERLY" | "ANNUALLY")}
            </span>
          )}
        </div>
        {offer.bonusDescription && (
          <p className="text-xs text-gray-600">{offer.bonusDescription}</p>
        )}
        {offer.validUntil && (
          <p className="text-xs text-gray-400">
            Valid until {new Date(offer.validUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── OfferCard ────────────────────────────────────────────────────────────────

interface OfferCardProps {
  recommendation: CardRecommendation;
  rank:           number;
}

/**
 * Displays a single ranked card result for a store search.
 * Rank 1 gets a gold crown and an emerald left-border accent.
 * Includes warning badges for cap usage and expiring offers.
 * Expand/collapse to see all offer details.
 */
export function OfferCard({ recommendation, rank }: OfferCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { userCard, effectiveRewardPct, explanation, isCapReached, remainingCapAmount, matchedOn, offer } = recommendation;
  const { card } = userCard;

  const isBest      = rank === 1;
  const displayName = userCard.nickname ?? `${card.issuer} ${card.cardName}`;
  const gradient    = networkGradient(card.network);
  const rewardLabel = getRewardTypeLabel(card.rewardType as RewardType);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white overflow-hidden shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
        isBest && "border-l-4 border-l-emerald-500 border-t-emerald-100 border-r-emerald-100 border-b-emerald-100",
        !isBest && "border-gray-200",
      )}
    >
      {/* ── Card gradient header ── */}
      <div className={cn("bg-gradient-to-br px-4 pt-3 pb-4", gradient)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {card.imageUrl && (
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/10 shrink-0">
                <Image
                  src={card.imageUrl}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="32px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            )}
            <RankBadge rank={rank} />
          </div>
          {matchedOn !== "base" && (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                matchedOn === "store"
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-white/10 text-white/80 border-white/20",
              )}
            >
              {matchedOn === "store" ? `At ${card.issuer}` : "Category bonus"}
            </span>
          )}
        </div>

        <p className="text-white/70 text-xs font-medium">{card.issuer}</p>
        <p className="text-white font-semibold text-sm leading-tight">{displayName}</p>

        {/* Big reward percentage */}
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={cn(
              "text-4xl font-extrabold tracking-tight",
              isCapReached ? "text-white/40 line-through" : "text-white",
            )}
          >
            {formatPercent(effectiveRewardPct)}
          </span>
          <span className="text-white/60 text-sm font-medium">{rewardLabel}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-3">
        {/* Offer type badge */}
        {offer && (
          <div className="mb-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                matchedOn === "store"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200",
              )}
            >
              {matchedOn === "store"
                ? offer.store
                  ? `At ${offer.store.name}`
                  : "Store offer"
                : offer.category
                  ? `All ${offer.category.name}`
                  : "Category offer"
              }
            </span>
          </div>
        )}

        {/* Reason */}
        <p className="text-sm text-gray-500 line-clamp-1">{explanation}</p>

        {/* Warning badges */}
        <WarningBadges
          isCapReached={isCapReached}
          remainingCapAmount={remainingCapAmount}
          offer={offer}
        />

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-emerald-600 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide offers
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              See all offers
            </>
          )}
        </button>
      </div>

      {/* ── Expanded offer details ── */}
      {expanded && <ExpandedOffers rec={recommendation} />}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function OfferCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
