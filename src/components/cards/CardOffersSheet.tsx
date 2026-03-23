"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { CardTileUserCard, CardTileOffer } from "./CardTile";

interface CardOffersSheetProps {
  userCard: CardTileUserCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatReward(pct: number, rewardType: string) {
  const display = `${(pct * 100).toFixed(pct % 0.01 === 0 ? 0 : 1)}%`;
  return `${display} ${rewardType.toLowerCase()}`;
}

export function CardOffersSheet({
  userCard,
  open,
  onOpenChange,
}: CardOffersSheetProps) {
  if (!userCard) return null;

  const displayName =
    userCard.nickname ?? `${userCard.card.issuer} ${userCard.card.cardName}`;
  const offers = (userCard.card.offers ?? []) as CardTileOffer[];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active offers for this card.
            </p>
          ) : (
            <ul className="space-y-3">
              {offers.map((offer) => {
                const target =
                  offer.store?.name ?? offer.category?.name ?? "General";
                return (
                  <li
                    key={offer.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {target}
                      </span>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {formatReward(offer.rewardPct, offer.rewardType)}
                      </Badge>
                    </div>
                    {offer.bonusDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {offer.bonusDescription}
                      </p>
                    )}
                    {offer.capAmount != null && offer.capPeriod && (
                      <p className="text-[10px] text-muted-foreground">
                        Cap: ${Number(offer.capAmount).toLocaleString()} /{" "}
                        {offer.capPeriod.toLowerCase()}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
