"use client";

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableUserCard {
  id:       string;
  nickname: string | null;
  lastFour: string | null;
}

interface WalletState {
  // ── Spec fields ──
  selectedCardId: string | null;
  isAddModalOpen: boolean;

  // ── Extended fields (used by AddCardModal for edit mode) ──
  isAddCardModalOpen: boolean;  // alias for isAddModalOpen
  editingCard:        EditableUserCard | null;

  // ── Actions ──
  setSelectedCard:   (id: string | null) => void;
  openAddModal:      () => void;
  closeAddModal:     () => void;

  // ── Extended actions (used by existing components) ──
  openAddCardModal:  () => void;   // alias for openAddModal
  closeAddCardModal: () => void;   // alias for closeAddModal
  setEditingCard:    (card: EditableUserCard | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Zustand store for wallet/card management UI state.
 * Manages the selected card, the add-card modal, and the edit-card modal.
 */
export const useWalletStore = create<WalletState>((set) => ({
  selectedCardId:     null,
  isAddModalOpen:     false,
  isAddCardModalOpen: false,
  editingCard:        null,

  setSelectedCard: (id) =>
    set({ selectedCardId: id }),

  openAddModal: () =>
    set({ isAddModalOpen: true, isAddCardModalOpen: true, editingCard: null }),

  closeAddModal: () =>
    set({ isAddModalOpen: false, isAddCardModalOpen: false, editingCard: null }),

  // Aliases
  openAddCardModal:  () =>
    set({ isAddModalOpen: true, isAddCardModalOpen: true, editingCard: null }),

  closeAddCardModal: () =>
    set({ isAddModalOpen: false, isAddCardModalOpen: false, editingCard: null }),

  setEditingCard: (card) =>
    set({
      editingCard:        card,
      isAddModalOpen:     !!card,
      isAddCardModalOpen: !!card,
    }),
}));
