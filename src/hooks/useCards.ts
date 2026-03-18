"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { AddUserCardInput, UpdateUserCardInput } from "@/lib/validations/card.schema";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const USER_CARDS_KEY           = ["userCards"] as const;
export const USER_CARDS_INACTIVE_KEY  = ["userCards", "includeInactive"] as const;
export const ALL_CARDS_KEY            = ["allCards"]  as const;

// Keep legacy keys as aliases so any existing consumers don't break
export const WALLET_KEY  = USER_CARDS_KEY;
export const CATALOG_KEY = ALL_CARDS_KEY;

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchUserCards(includeInactive = false) {
  const url = includeInactive ? "/api/cards?includeInactive=true" : "/api/cards";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch wallet");
  return res.json();
}

async function fetchAllCards() {
  const res = await fetch("/api/cards/catalog");
  if (!res.ok) throw new Error("Failed to fetch card catalog");
  return res.json();
}

async function addCardFn(data: AddUserCardInput) {
  const res = await fetch("/api/cards", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(err.message ?? "Failed to add card");
  }
  return res.json();
}

async function updateCardFn(id: string, data: UpdateUserCardInput) {
  const res = await fetch(`/api/cards/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(err.message ?? "Failed to update card");
  }
  return res.json();
}

async function removeCardFn(id: string) {
  const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    throw new Error(err.message ?? "Failed to remove card");
  }
}

// ─── Query hooks ──────────────────────────────────────────────────────────────

/** Returns the authenticated user's wallet (active UserCards with nested card + offers). */
export function useUserCards() {
  return useQuery({ queryKey: USER_CARDS_KEY, queryFn: () => fetchUserCards(false) });
}

/** Returns all UserCards including inactive (for Archived section). */
export function useUserCardsIncludingInactive() {
  return useQuery({
    queryKey: USER_CARDS_INACTIVE_KEY,
    queryFn:  () => fetchUserCards(true),
  });
}

/** Returns all active cards in the global catalog (for the add-card picker). */
export function useAllCards() {
  return useQuery({
    queryKey: ALL_CARDS_KEY,
    queryFn:  fetchAllCards,
    staleTime: 1000 * 60 * 10, // catalog rarely changes
  });
}

// ─── Legacy aliases (kept for backwards-compatibility) ────────────────────────

/** @deprecated Use useUserCards() */
export const useWallet  = useUserCards;
/** @deprecated Use useAllCards() */
export const useCatalog = useAllCards;

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/** Adds a catalog card to the user's wallet. */
export function useAddCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCardFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_CARDS_KEY });
      toast({ title: "Card added", description: "The card has been added to your wallet." });
    },
    onError: (err: Error) => {
      toast({
        title:       "Failed to add card",
        description: err.message,
        variant:     "destructive",
      });
    },
  });
}

/** Updates a UserCard's nickname, lastFour, or isActive. */
export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserCardInput }) =>
      updateCardFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_CARDS_KEY });
      toast({ title: "Card updated", description: "Your changes have been saved." });
    },
    onError: (err: Error) => {
      toast({
        title:       "Failed to update card",
        description: err.message,
        variant:     "destructive",
      });
    },
  });
}

/** Soft-removes a card from the user's wallet (sets isActive = false). Optimistic update. */
export function useRemoveCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCardFn,
    onMutate: async (userCardId) => {
      await queryClient.cancelQueries({ queryKey: USER_CARDS_KEY });
      const previous = queryClient.getQueryData(USER_CARDS_KEY);
      queryClient.setQueryData(USER_CARDS_KEY, (old: unknown) => {
       if (!Array.isArray(old)) return old;
       return old.filter((uc: { id: string }) => uc.id !== userCardId);
      });
      return { previous };
    },
    onError: (err: Error, _userCardId, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(USER_CARDS_KEY, context.previous);
      }
      toast({
        title:       "Failed to remove card",
        description: err.message,
        variant:     "destructive",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USER_CARDS_KEY });
      void queryClient.invalidateQueries({ queryKey: USER_CARDS_INACTIVE_KEY });
    },
    onSuccess: () => {
      toast({ title: "Card removed", description: "The card has been removed from your wallet." });
    },
  });
}

/** Toggles a card's isActive status. Optimistic update. */
export function useToggleCardActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCardFn(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: USER_CARDS_KEY });
      await queryClient.cancelQueries({ queryKey: USER_CARDS_INACTIVE_KEY });
      const prevActive = queryClient.getQueryData(USER_CARDS_KEY) as unknown[] | undefined;
      const prevAll    = queryClient.getQueryData(USER_CARDS_INACTIVE_KEY) as unknown[] | undefined;

      if (!isActive) {
        // Hiding: optimistically remove from active list
        queryClient.setQueryData(USER_CARDS_KEY, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((uc: { id: string }) => uc.id !== id);
        });
      }
      // Restoring: no optimistic add (we'd need full card data from archived)
      return { prevActive, prevAll };
    },
    onError: (err: Error, _vars, context) => {
      if (context?.prevActive != null) {
        queryClient.setQueryData(USER_CARDS_KEY, context.prevActive);
      }
      if (context?.prevAll != null) {
        queryClient.setQueryData(USER_CARDS_INACTIVE_KEY, context.prevAll);
      }
      toast({
        title:       "Failed to update card",
        description: err.message,
        variant:     "destructive",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USER_CARDS_KEY });
      void queryClient.invalidateQueries({ queryKey: USER_CARDS_INACTIVE_KEY });
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title:        isActive ? "Card restored" : "Card hidden",
        description:  isActive ? "The card is back in your wallet." : "The card has been hidden from your wallet.",
      });
    },
  });
}
