"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CapProgressBar } from "@/components/tracker/CapProgressBar";
import { SpendSummary } from "@/components/tracker/SpendSummary";
import { useSpendTracking, useUpdateSpend } from "@/hooks/useTracker";
import type { CapProgressItem, CapPeriod } from "@/hooks/useTracker";
import { cn, formatCurrency } from "@/lib/utils";
import { BarChart3, RefreshCw, CreditCard } from "lucide-react";
import { Loader2 } from "lucide-react";

// ─── Log Spend dialog ─────────────────────────────────────────────────────────

const logSpendSchema = z.object({
  amountSpent: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid non-negative amount"),
});

type LogSpendForm = z.infer<typeof logSpendSchema>;

interface LogSpendDialogProps {
  item:    CapProgressItem | null;
  onClose: () => void;
}

function LogSpendDialog({ item, onClose }: LogSpendDialogProps) {
  const { mutate, isPending } = useUpdateSpend();
  const form = useForm<LogSpendForm>({
    resolver: zodResolver(logSpendSchema),
    defaultValues: { amountSpent: item ? String(item.amountSpent.toFixed(2)) : "" },
  });

  function onSubmit(values: LogSpendForm) {
    if (!item) return;
    mutate(
      {
        userCardId:  item.userCardId,
        offerId:     item.offerId,
        amountSpent: Number(values.amountSpent),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log spend</DialogTitle>
          <DialogDescription>
            Update the total amount spent toward this offer&apos;s cap.
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-0.5">
            <p className="text-sm font-semibold text-gray-900">{item.cardName}</p>
            <p className="text-xs text-gray-500">{item.offerLabel}</p>
            <p className="text-xs text-gray-400 mt-1">
              Cap: {formatCurrency(item.capAmount)} · Currently: {formatCurrency(item.amountSpent)}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total spent this period ($)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-7"
                        autoFocus
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50">
          <BarChart3 className="h-7 w-7 text-emerald-500" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-gray-900">No caps being tracked</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
        This page tracks your progress toward spending caps on bonus category offers.
        Cards like Chase Freedom and Discover It have quarterly rotating categories
        with a $1,500 cap — once you hit it, you drop to the base rate.
      </p>
      <p className="text-sm text-gray-400 mt-3">
        Add cards with capped bonus offers to your wallet to start tracking.
      </p>
      <Button className="mt-5 bg-emerald-500 hover:bg-emerald-600" asChild>
        <a href="/wallet">
          <CreditCard className="h-4 w-4 mr-2" />
          Go to My Wallet
        </a>
      </Button>
    </div>
  );
}

// ─── Period group ─────────────────────────────────────────────────────────────

interface PeriodGroupProps {
  period:        CapPeriod;
  items:         CapProgressItem[];
  isLoading:     boolean;
  isError:       boolean;
  onRetry:       () => void;
  onLogSpend:    (item: CapProgressItem) => void;
}

function PeriodGroup({ period, items, isLoading, isError, onRetry, onLogSpend }: PeriodGroupProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-600 font-medium">Failed to load tracker data</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2 text-red-600 border-red-200"
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState />;
  }

  // Sort: cap-hit first, then by percentUsed descending
  const sorted = [...items].sort((a, b) => {
    if (a.capHit !== b.capHit) return a.capHit ? -1 : 1;
    return b.percentUsed - a.percentUsed;
  });

  return (
    <div className="space-y-3">
      {sorted.map((item) => (
        <CapProgressBar
          key={`${item.userCardId}-${item.offerId}`}
          label={item.offerLabel}
          amountSpent={item.amountSpent}
          capAmount={item.capAmount}
          period={period}
          cardName={item.cardName}
          rewardPct={item.rewardPct}
          rewardType={item.rewardType}
          capHit={item.capHit}
          percentUsed={item.percentUsed}
          onLogSpend={() => onLogSpend(item)}
        />
      ))}
    </div>
  );
}

// ─── Period tab data fetcher ──────────────────────────────────────────────────

function PeriodTabContent({
  period,
  onLogSpend,
}: {
  period:     CapPeriod;
  onLogSpend: (item: CapProgressItem) => void;
}) {
  const { data = [], isLoading, isError, refetch } = useSpendTracking(period);

  return (
    <div className="space-y-6 mt-5">
      <SpendSummary items={data} isLoading={isLoading} />
      <PeriodGroup
        period={period}
        items={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onLogSpend={onLogSpend}
      />
    </div>
  );
}

// ─── Tracker page ─────────────────────────────────────────────────────────────

const PERIODS: { value: CapPeriod; label: string }[] = [
  { value: "MONTHLY",   label: "This Month"    },
  { value: "QUARTERLY", label: "This Quarter"  },
  { value: "ANNUALLY",  label: "This Year"     },
];

/**
 * Spending Cap Tracker page.
 * Shows per-period cap utilization across all active cards,
 * with summary stats and a manual spend logging dialog.
 */
export default function TrackerPage() {
  const [activePeriod, setActivePeriod] = useState<CapPeriod>("MONTHLY");
  const [loggingItem, setLoggingItem]   = useState<CapProgressItem | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Spending Cap Tracker
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor bonus category caps so you always know when to switch cards.
        </p>
      </div>

      {/* ── Period tabs ── */}
      <Tabs
        value={activePeriod}
        onValueChange={(v) => setActivePeriod(v as CapPeriod)}
      >
        <TabsList className={cn("grid w-full", `grid-cols-${PERIODS.length}`)}>
          {PERIODS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PERIODS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            <PeriodTabContent period={value} onLogSpend={setLoggingItem} />
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Log spend dialog ── */}
      <LogSpendDialog
        item={loggingItem}
        onClose={() => setLoggingItem(null)}
      />
    </div>
  );
}
