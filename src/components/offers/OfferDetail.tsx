import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Offer } from "@/types/offer.types";

interface OfferDetailProps {
  offer:      Offer;
  rewardType: string;
  label:      string;
}

/**
 * Expanded detail view for a single Offer, including cap information.
 */
export function OfferDetail({ offer, rewardType, label }: OfferDetailProps) {
  const displayRate = `${(Number(offer.rewardPct) * 100).toFixed(Number(offer.rewardPct) % 0.01 === 0 ? 0 : 1)}%`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary">
          {displayRate} {rewardType.toLowerCase()}
        </Badge>
      </div>
      {offer.capAmount && offer.capPeriod && (
        <>
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Spending cap:{" "}
              <span className="font-medium">${Number(offer.capAmount).toLocaleString()}</span>
            </p>
            <p>
              Resets:{" "}
              <span className="font-medium capitalize">{offer.capPeriod.toLowerCase()}</span>
            </p>
          </div>
        </>
      )}
      {offer.bonusDescription && (
        <p className="text-xs text-muted-foreground italic">{offer.bonusDescription}</p>
      )}
    </div>
  );
}
