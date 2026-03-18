import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { AlertTriangle, XCircle } from "lucide-react";
import type { CapPeriod } from "@/hooks/useTracker";

// ─── Colour tiers ─────────────────────────────────────────────────────────────

function barColor(pct: number, capHit: boolean): string {
  if (capHit || pct >= 100) return "bg-red-500";
  if (pct >= 85)            return "bg-orange-500";
  if (pct >= 60)            return "bg-amber-400";
  return "bg-emerald-500";
}

function trackColor(pct: number, capHit: boolean): string {
  if (capHit || pct >= 100) return "bg-red-100";
  if (pct >= 85)            return "bg-orange-100";
  if (pct >= 60)            return "bg-amber-100";
  return "bg-emerald-100";
}

function pctTextColor(pct: number, capHit: boolean): string {
  if (capHit || pct >= 100) return "text-red-600";
  if (pct >= 85)            return "text-orange-600";
  if (pct >= 60)            return "text-amber-600";
  return "text-emerald-600";
}

// ─── Period label ─────────────────────────────────────────────────────────────

function periodLabel(period: CapPeriod): string {
  switch (period) {
    case "MONTHLY":   return "month";
    case "QUARTERLY": return "quarter";
    case "ANNUALLY":  return "year";
  }
}

// ─── CapProgressBar ───────────────────────────────────────────────────────────

export interface CapProgressBarProps {
  label:       string;
  amountSpent: number;
  capAmount:   number;
  period:      CapPeriod;
  cardName:    string;
  rewardPct:   number;
  rewardType?: string;
  capHit:      boolean;
  /** 0–100 */
  percentUsed: number;
  onLogSpend?: () => void;
}

/**
 * Labeled progress bar showing spending cap utilization for one offer.
 *
 * Color tiers:
 *   0–59%:   emerald
 *   60–84%:  amber
 *   85–99%:  orange
 *   100%/cap hit: red
 */
export function CapProgressBar({
  label,
  amountSpent,
  capAmount,
  period,
  cardName,
  rewardPct,
  rewardType,
  capHit,
  percentUsed,
  onLogSpend,
}: CapProgressBarProps) {
  const clampedPct = Math.min(Math.max(percentUsed, 0), 100);
  const isAlmostAt = clampedPct >= 85 && !capHit;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 space-y-3",
        capHit ? "border-red-200 bg-red-50/30" : "border-gray-200",
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{cardName}</p>
            {rewardType && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {formatPercent(rewardPct)} {rewardType.toLowerCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        </div>

        <div className="text-right shrink-0">
          <p className={cn("text-sm font-bold tabular-nums", pctTextColor(clampedPct, capHit))}>
            {formatCurrency(amountSpent)}
            <span className="text-gray-400 font-normal"> / {formatCurrency(capAmount)}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            used this {periodLabel(period)}
          </p>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1.5">
        <div className={cn("w-full h-2.5 rounded-full overflow-hidden", trackColor(clampedPct, capHit))}>
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor(clampedPct, capHit))}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-semibold", pctTextColor(clampedPct, capHit))}>
            {clampedPct.toFixed(0)}% used
          </span>
          <span className="text-xs text-gray-400">
            {formatCurrency(Math.max(capAmount - amountSpent, 0))} remaining
          </span>
        </div>
      </div>

      {/* ── Status badges ── */}
      {capHit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-100 border border-red-200">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            Cap reached — use a different card for this category
          </p>
        </div>
      )}

      {isAlmostAt && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            Almost at cap — {formatCurrency(Math.max(capAmount - amountSpent, 0))} left
          </p>
        </div>
      )}

      {/* ── Log spend button ── */}
      {onLogSpend && (
        <button
          onClick={onLogSpend}
          className="w-full text-xs font-medium text-gray-400 hover:text-emerald-600 transition-colors py-1"
        >
          + Manually log spend
        </button>
      )}
    </div>
  );
}
