"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CapPeriod = "MONTHLY" | "QUARTERLY" | "ANNUALLY";

/**
 * A single cap-progress entry returned by GET /api/tracker.
 * Field names match TrackerService.getCapProgress() output exactly.
 */
export interface CapProgressItem {
  userCardId:  string;
  cardName:    string;
  offerId:     string;
  offerLabel:  string;
  rewardPct:   number;
  rewardType:  string;
  capAmount:   number;
  amountSpent: number;
  headroom:    number;
  percentUsed: number;
  capHit:      boolean;
  period:      CapPeriod;
}

export interface LogSpendInput {
  userCardId:  string;
  offerId:     string;
  amountSpent: number;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchCapProgress(period: CapPeriod): Promise<CapProgressItem[]> {
  const res = await fetch(`/api/tracker?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch cap progress");
  return res.json() as Promise<CapProgressItem[]>;
}

async function postLogSpend(input: LogSpendInput): Promise<unknown> {
  const res = await fetch("/api/tracker", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Failed to log spend");
  }
  return res.json();
}

// ─── Query key factory ────────────────────────────────────────────────────────

export const trackerKeys = {
  all:       ["tracker"] as const,
  period:    (period: CapPeriod) => ["tracker", period] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns spending cap utilization data for all of the user's active cards
 * in the given period. Defaults to MONTHLY.
 *
 * @deprecated alias: useTracker (kept for backward compat)
 */
export function useSpendTracking(period: CapPeriod = "MONTHLY") {
  return useQuery<CapProgressItem[]>({
    queryKey: trackerKeys.period(period),
    queryFn:  () => fetchCapProgress(period),
    staleTime: 1000 * 60,
  });
}

/** @deprecated Use useSpendTracking */
export const useTracker = useSpendTracking;

/**
 * Mutation to manually log (upsert) spend for a userCard + offer.
 * Invalidates the tracker query for all periods on success.
 */
export function useUpdateSpend() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: postLogSpend,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trackerKeys.all });
      toast({ title: "Spend logged", description: "Cap progress has been updated." });
    },
    onError: (err: Error) => {
      toast({
        title:       "Failed to log spend",
        description: err.message,
        variant:     "destructive",
      });
    },
  });
}
