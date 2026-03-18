import { cn, formatCurrency } from "@/lib/utils";
import { Activity, AlertTriangle, TrendingUp } from "lucide-react";
import type { CapProgressItem } from "@/hooks/useTracker";

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon:       React.ReactNode;
  label:      string;
  value:      string;
  sub?:       string;
  accent?:    "default" | "red" | "emerald";
}

function StatCard({ icon, label, value, sub, accent = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 flex items-start gap-3",
        accent === "red"     && "border-red-200 bg-red-50/40",
        accent === "emerald" && "border-emerald-200 bg-emerald-50/40",
        accent === "default" && "border-gray-200",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-xl shrink-0",
          accent === "red"     && "bg-red-100 text-red-600",
          accent === "emerald" && "bg-emerald-100 text-emerald-600",
          accent === "default" && "bg-gray-100 text-gray-500",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p
          className={cn(
            "text-xl font-bold mt-0.5 tabular-nums",
            accent === "red"     && "text-red-600",
            accent === "emerald" && "text-emerald-600",
            accent === "default" && "text-gray-900",
          )}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── SpendSummary ─────────────────────────────────────────────────────────────

interface SpendSummaryProps {
  items:      CapProgressItem[];
  isLoading?: boolean;
}

/**
 * Three summary stat cards shown at the top of the tracker page:
 *   1. Active caps being tracked
 *   2. Caps hit this period (red accent when > 0)
 *   3. Estimated rewards earned this period
 */
export function SpendSummary({ items, isLoading }: SpendSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  const activeCaps     = items.length;
  const capsHit        = items.filter((i) => i.capHit).length;
  const estimatedRewards = items.reduce(
    (sum, item) => sum + item.amountSpent * item.rewardPct,
    0,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard
        icon={<Activity className="h-4 w-4" />}
        label="Active caps tracked"
        value={String(activeCaps)}
        sub={activeCaps === 1 ? "offer with a spending cap" : "offers with spending caps"}
        accent="default"
      />
      <StatCard
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Caps hit this period"
        value={String(capsHit)}
        sub={capsHit > 0 ? "Switch cards for these categories" : "All caps have headroom"}
        accent={capsHit > 0 ? "red" : "default"}
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Estimated rewards"
        value={formatCurrency(estimatedRewards)}
        sub="earned on tracked spend this period"
        accent="emerald"
      />
    </div>
  );
}
