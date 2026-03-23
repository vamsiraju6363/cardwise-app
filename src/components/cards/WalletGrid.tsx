"use client";

import { useState } from "react";
import { CardTile, CardTileSkeleton, type CardTileUserCard } from "./CardTile";
import { CardOffersSheet } from "./CardOffersSheet";
import { AddCardModal } from "./AddCardModal";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, RefreshCw, Wallet, ChevronDown, ChevronUp, Archive } from "lucide-react";
import { useUserCards, useUserCardsIncludingInactive } from "@/hooks/useCards";
import { useWalletStore } from "@/stores/useWalletStore";

// ─── Summary bar ──────────────────────────────────────────────────────────────

interface WalletSummaryProps {
  cards:  CardTileUserCard[];
  onAdd:  () => void;
}

function WalletSummary({ cards, onAdd }: WalletSummaryProps) {
  const totalOffers = cards.reduce(
    (sum, uc) => sum + (uc.card._count?.offers ?? 0),
    0,
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100">
            <CreditCard className="h-4.5 w-4.5 text-slate-600" />
          </div>
          <div>
            <p className="text-xl font-bold leading-none">{cards.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cards.length === 1 ? "card" : "cards"}
            </p>
          </div>
        </div>

        {totalOffers > 0 && (
          <>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50">
                <span className="text-emerald-600 text-sm font-bold">%</span>
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{totalOffers}</p>
                <p className="text-xs text-muted-foreground mt-0.5">active offers</p>
              </div>
            </div>
          </>
        )}
      </div>

      <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
        <Plus className="h-4 w-4" />
        Add card
      </Button>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function WalletLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-9 w-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardTileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function WalletError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
      <p className="text-sm font-medium text-red-700">
        We couldn&apos;t load your wallet.
      </p>
      <p className="text-xs text-red-500">Check your connection and try again.</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-red-300 text-red-700 hover:bg-red-100"
      >
        <RefreshCw className="h-3.5 w-3.5 mr-2" />
        Retry
      </Button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function WalletEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center space-y-4">
      <div className="flex items-center justify-center mx-auto w-16 h-16 rounded-2xl bg-slate-100">
        <Wallet className="h-8 w-8 text-slate-400" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-gray-900">Your wallet is empty</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Add your credit cards to start getting personalized reward recommendations for every store.
        </p>
      </div>
      <Button
        onClick={onAdd}
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
      >
        <Plus className="h-4 w-4" />
        Add your first card
      </Button>
    </div>
  );
}

// ─── Archived section ────────────────────────────────────────────────────────

interface ArchivedSectionProps {
  cards: CardTileUserCard[];
  onOffersClick?: (userCard: CardTileUserCard) => void;
}

function ArchivedSection({ cards, onOffersClick }: ArchivedSectionProps) {
  const [expanded, setExpanded] = useState(false);
  if (cards.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Archive className="h-4 w-4" />
          Archived ({cards.length})
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 pt-0">
          {cards.map((uc) => (
            <CardTile key={uc.id} userCard={uc} archived onOffersClick={onOffersClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WalletGrid ───────────────────────────────────────────────────────────────

/**
 * Renders the full wallet: summary bar, responsive card grid, archived section, and the add/edit modal.
 * Handles loading, error, and empty states.
 */
export function WalletGrid() {
  const { data: userCards, isLoading, isError, refetch } = useUserCards();
  const { data: allCards } = useUserCardsIncludingInactive();
  const openAddModal = useWalletStore((s) => s.openAddModal);
  const [offersForCard, setOffersForCard] = useState<CardTileUserCard | null>(null);

  const handleOffersClick = (userCard: CardTileUserCard) => {
    setOffersForCard(userCard);
  };

  if (isLoading) return <WalletLoading />;
  if (isError)   return <WalletError onRetry={() => refetch()} />;

  const cards = (userCards ?? []) as CardTileUserCard[];
  const archivedCards = ((allCards ?? []) as CardTileUserCard[]).filter((uc) => !uc.isActive);

  return (
    <div className="space-y-6">
      {cards.length > 0 && (
        <WalletSummary cards={cards} onAdd={openAddModal} />
      )}

      {cards.length === 0 ? (
        <WalletEmpty onAdd={openAddModal} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((uc) => (
            <CardTile
              key={uc.id}
              userCard={uc}
              onOffersClick={handleOffersClick}
            />
          ))}
        </div>
      )}

      {archivedCards.length > 0 && (
        <ArchivedSection cards={archivedCards} onOffersClick={handleOffersClick} />
      )}

      <CardOffersSheet
        userCard={offersForCard}
        open={offersForCard != null}
        onOpenChange={(open) => !open && setOffersForCard(null)}
      />
      <AddCardModal />
    </div>
  );
}
