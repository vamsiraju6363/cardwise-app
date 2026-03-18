"use client";

import Image from "next/image";
import { cn, BLUR_DATA_URL } from "@/lib/utils";
import { formatPercent, getRewardTypeLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, CreditCard, EyeOff } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import { useRemoveCard, useToggleCardActive } from "@/hooks/useCards";

// ─── Network gradient config ──────────────────────────────────────────────────

const NETWORK_GRADIENT: Record<string, { gradient: string; badge: string; dot: string }> = {
  VISA: {
    gradient: "from-blue-600 via-blue-700 to-blue-900",
    badge:    "bg-blue-500/20 text-blue-100 border-blue-400/30",
    dot:      "bg-blue-300",
  },
  MASTERCARD: {
    gradient: "from-orange-500 via-orange-600 to-red-700",
    badge:    "bg-orange-500/20 text-orange-100 border-orange-400/30",
    dot:      "bg-orange-300",
  },
  AMEX: {
    gradient: "from-emerald-600 via-emerald-700 to-teal-900",
    badge:    "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
    dot:      "bg-emerald-300",
  },
  DISCOVER: {
    gradient: "from-purple-600 via-purple-700 to-indigo-900",
    badge:    "bg-purple-500/20 text-purple-100 border-purple-400/30",
    dot:      "bg-purple-300",
  },
};

const FALLBACK_NETWORK = {
  gradient: "from-slate-600 via-slate-700 to-slate-900",
  badge:    "bg-slate-500/20 text-slate-100 border-slate-400/30",
  dot:      "bg-slate-300",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardTileUserCard {
  id:       string;
  nickname: string | null;
  lastFour: string | null;
  isActive?: boolean;
  card: {
    id:            string;
    issuer:        string;
    cardName:      string;
    network:       string;
    baseRewardPct: number | string;
    rewardType:    string;
    annualFee:     number | string;
    imageUrl?:     string | null;
    _count?:       { offers: number };
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function CardTileSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden">
      <Skeleton className="h-[168px] w-full rounded-2xl" />
    </div>
  );
}

// ─── CardTile ─────────────────────────────────────────────────────────────────

interface CardTileProps {
  userCard: CardTileUserCard;
  /** When true, shows Restore instead of Remove and omits Hide. */
  archived?: boolean;
}

/**
 * Displays one UserCard as a credit-card-styled tile with gradient background,
 * active offers badge, and a three-dot action menu.
 */
export function CardTile({ userCard, archived = false }: CardTileProps) {
  const { card } = userCard;
  const setEditingCard = useWalletStore((s) => s.setEditingCard);
  const removeCard     = useRemoveCard();
  const toggleActive   = useToggleCardActive();

  const network     = NETWORK_GRADIENT[card.network] ?? FALLBACK_NETWORK;
  const displayName = userCard.nickname ?? card.cardName;
  const baseRate    = formatPercent(Number(card.baseRewardPct));
  const rewardLabel = getRewardTypeLabel(card.rewardType as "CASHBACK" | "POINTS" | "MILES");
  const activeOffers = card._count?.offers ?? 0;

  function handleEdit() {
    setEditingCard({ id: userCard.id, nickname: userCard.nickname, lastFour: userCard.lastFour });
  }

  function handleRemove() {
    if (confirm(`Remove "${displayName}" from your wallet?`)) {
      removeCard.mutate(userCard.id);
    }
  }

  function handleHide() {
    toggleActive.mutate({ id: userCard.id, isActive: false });
  }

  function handleRestore() {
    toggleActive.mutate({ id: userCard.id, isActive: true });
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-default select-none",
        "transition-transform duration-200 hover:scale-[1.02]",
        "shadow-md hover:shadow-lg",
      )}
    >
      {/* ── Gradient background ── */}
      <div className={cn("bg-gradient-to-br p-5 h-[168px] flex flex-col justify-between", network.gradient)}>

        {/* ── Top row: issuer + three-dot menu ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {card.imageUrl ? (
              <div className="relative w-7 h-7 rounded-md overflow-hidden bg-white/15 shrink-0">
                <Image
                  src={card.imageUrl}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="28px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/15">
                <CreditCard className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
            )}
            <span className="text-white/80 text-xs font-medium tracking-wide">
              {card.issuer}
            </span>
          </div>

          {/* ── Three-dot menu ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md",
                  "bg-white/10 hover:bg-white/20 transition-colors",
                  "text-white/70 hover:text-white",
                )}
                aria-label="Card options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit nickname
              </DropdownMenuItem>
              {!archived && (
                <>
                  <DropdownMenuItem
                    onClick={handleHide}
                    disabled={toggleActive.isPending}
                    className="cursor-pointer"
                  >
                    <EyeOff className="mr-2 h-3.5 w-3.5" />
                    Hide from wallet
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleRemove}
                    disabled={removeCard.isPending}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Remove card
                  </DropdownMenuItem>
                </>
              )}
              {archived && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleRestore}
                    disabled={toggleActive.isPending}
                    className="text-emerald-600 focus:text-emerald-600 cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-3.5 w-3.5" />
                    Restore to wallet
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Card name + last four ── */}
        <div>
          <p className="text-white font-semibold text-sm leading-snug truncate">
            {displayName}
          </p>
          <p className="text-white/60 text-xs mt-0.5 font-mono tracking-widest">
            {userCard.lastFour ? `•••• •••• •••• ${userCard.lastFour}` : "•••• •••• •••• ••••"}
          </p>
        </div>

        {/* ── Bottom row: reward rate + offers badge + network ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white font-bold text-xl leading-none">{baseRate}</p>
            <p className="text-white/60 text-[10px] mt-0.5">base {rewardLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            {activeOffers > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                <span className={cn("w-1.5 h-1.5 rounded-full", network.dot)} />
                {activeOffers} offer{activeOffers !== 1 ? "s" : ""}
              </span>
            )}
            <Badge
              variant="outline"
              className={cn("text-[10px] font-semibold border px-1.5 py-0.5", network.badge)}
            >
              {card.network}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
