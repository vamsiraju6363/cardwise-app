import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CardRecommendation } from "@/types/ranking.types";
import { Trophy, AlertTriangle } from "lucide-react";

interface StoreSearchResultProps {
  recommendation: CardRecommendation;
  rank:           number;
}

/**
 * A single ranked card recommendation row.
 * Shows the effective reward rate, explanation, and spending cap status.
 */
export function StoreSearchResult({ recommendation, rank }: StoreSearchResultProps) {
  const { userCard, effectiveRewardPct, explanation, isCapReached, matchedOn } = recommendation;
  const { card } = userCard;

  const isBest      = rank === 1;
  const displayName = userCard.nickname ?? `${card.issuer} ${card.cardName}`;
  const displayRate = `${(effectiveRewardPct * 100).toFixed(
    effectiveRewardPct % 0.01 === 0 ? 0 : 1
  )}%`;

  return (
    <Card className={cn("transition-all", isBest && "border-primary shadow-sm ring-1 ring-primary/20")}>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
            isBest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {isBest ? <Trophy className="h-4 w-4" /> : rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{displayName}</p>
            {matchedOn !== "base" && (
              <Badge variant="secondary" className="text-xs capitalize">
                {matchedOn} bonus
              </Badge>
            )}
            {isCapReached && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Cap reached
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{explanation}</p>
        </div>

        <div className="text-right shrink-0">
          <p
            className={cn(
              "text-xl font-bold",
              isBest && !isCapReached ? "text-primary" : "text-foreground",
              isCapReached && "text-muted-foreground"
            )}
          >
            {displayRate}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {card.rewardType.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
