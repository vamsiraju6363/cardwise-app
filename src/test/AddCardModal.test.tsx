"use client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCatalogCards = [
  {
    id:            "card-chase-flex",
    issuer:        "Chase",
    cardName:      "Freedom Flex",
    network:       "VISA",
    annualFee:     0,
    baseRewardPct: 0.01,
    rewardType:    "CASHBACK",
    isActive:      true,
  },
  {
    id:            "card-amex-gold",
    issuer:        "American Express",
    cardName:      "Gold Card",
    network:       "AMEX",
    annualFee:     250,
    baseRewardPct: 0.01,
    rewardType:    "POINTS",
    isActive:      true,
  },
];

const mockAddCardMutate    = vi.fn();
const mockUpdateCardMutate = vi.fn();

vi.mock("@/hooks/useCards", () => ({
  useAddCard: () => ({
    mutateAsync: mockAddCardMutate,
    isPending:   false,
  }),
  useUpdateCard: () => ({
    mutateAsync: mockUpdateCardMutate,
    isPending:   false,
  }),
  useAllCards: () => ({
    data:      mockCatalogCards,
    isLoading: false,
  }),
  useCards: () => ({
    data:      [],
    isLoading: false,
  }),
}));

const mockCloseModal = vi.fn();
let mockEditingCard: null | { id: string; nickname: string | null; lastFour: string | null } = null;

vi.mock("@/stores/useWalletStore", () => ({
  useWalletStore: () => ({
    isAddCardModalOpen: true,
    editingCard:        mockEditingCard,
    closeAddCardModal:  mockCloseModal,
    openAddCardModal:   vi.fn(),
    setEditingCard:     vi.fn(),
  }),
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    formatPercent:      (pct: number) => `${(pct * 100).toFixed(0)}%`,
    getRewardTypeLabel: (type: string) => type.toLowerCase(),
  };
});

// ─── Import after mocks ───────────────────────────────────────────────────────

import { AddCardModal } from "@/components/cards/AddCardModal";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AddCardModal — Add mode (step 1: pick)", () => {
  beforeEach(() => {
    mockEditingCard = null;
    mockAddCardMutate.mockClear();
    mockAddCardMutate.mockResolvedValue({ userCard: {}, linkedFromCatalog: false });
    mockCloseModal.mockClear();
  });

  it("renders the 'Add a card' title in pick step", () => {
    render(<AddCardModal />);
    expect(screen.getByText("Add a card")).toBeInTheDocument();
  });

  it("shows catalog cards grouped by issuer", () => {
    render(<AddCardModal />);
    expect(screen.getByText("Chase")).toBeInTheDocument();
    expect(screen.getByText("Freedom Flex")).toBeInTheDocument();
    expect(screen.getByText("American Express")).toBeInTheDocument();
    expect(screen.getByText("Gold Card")).toBeInTheDocument();
  });

  it("shows annual fee info for each card", () => {
    render(<AddCardModal />);
    expect(screen.getByText(/no annual fee/i)).toBeInTheDocument();
    expect(screen.getByText(/\$250\/yr/i)).toBeInTheDocument();
  });

  it("filters catalog by search query", async () => {
    render(<AddCardModal />);
    const searchInput = screen.getByPlaceholderText(/search cards/i);

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "chase" } });
    });

    expect(screen.getByText("Freedom Flex")).toBeInTheDocument();
    expect(screen.queryByText("Gold Card")).not.toBeInTheDocument();
  });

  it("advances to label step when a card is clicked", async () => {
    render(<AddCardModal />);

    await act(async () => {
      fireEvent.click(screen.getByText("Freedom Flex"));
    });

    await waitFor(() => {
      expect(screen.getByText("Label your card")).toBeInTheDocument();
    });
  });
});

describe("AddCardModal — Add mode (step 2: label)", () => {
  beforeEach(() => {
    mockEditingCard = null;
    mockAddCardMutate.mockClear();
    mockAddCardMutate.mockResolvedValue({ userCard: {}, linkedFromCatalog: false });
    mockCloseModal.mockClear();
  });

  async function advanceToLabelStep() {
    render(<AddCardModal />);
    await act(async () => {
      fireEvent.click(screen.getByText("Freedom Flex"));
    });
    await waitFor(() => {
      expect(screen.getByText("Label your card")).toBeInTheDocument();
    });
  }

  it("shows nickname and lastFour inputs", async () => {
    await advanceToLabelStep();
    expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last 4 digits/i)).toBeInTheDocument();
  });

  it("shows Back and 'Add to wallet' buttons", async () => {
    await advanceToLabelStep();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Add to wallet")).toBeInTheDocument();
  });

  it("goes back to pick step when Back is clicked", async () => {
    await advanceToLabelStep();
    fireEvent.click(screen.getByText("Back"));
    await waitFor(() => {
      expect(screen.getByText("Add a card")).toBeInTheDocument();
    });
  });

  it("shows the selected card name in the label step", async () => {
    await advanceToLabelStep();
    // The placeholder for nickname includes the selected card name
    const nicknameInput = screen.getByLabelText(/nickname/i);
    expect(nicknameInput).toHaveAttribute("placeholder", expect.stringContaining("Freedom Flex"));
  });

  it("shows the card preview with issuer name", async () => {
    await advanceToLabelStep();
    // The card preview shows the issuer
    expect(screen.getByText("Chase")).toBeInTheDocument();
  });

  it("validates lastFour must be exactly 4 digits", async () => {
    await advanceToLabelStep();

    const lastFourInput = screen.getByLabelText(/last 4 digits/i);
    fireEvent.change(lastFourInput, { target: { value: "12" } });

    const submitBtn = screen.getByText("Add to wallet");
    const form = submitBtn.closest("form")!;
    await act(async () => { fireEvent.submit(form); });

    await waitFor(() => {
      expect(screen.getByText(/must be exactly 4 digits/i)).toBeInTheDocument();
    });
  });

  it("accepts valid 4-digit lastFour without validation error", async () => {
    await advanceToLabelStep();

    const lastFourInput = screen.getByLabelText(/last 4 digits/i);
    fireEvent.change(lastFourInput, { target: { value: "1234" } });

    // No validation error should appear for valid input
    expect(screen.queryByText(/must be exactly 4 digits/i)).not.toBeInTheDocument();
  });
});

describe("AddCardModal — Edit mode", () => {
  beforeEach(() => {
    mockEditingCard = { id: "uc-chase-flex", nickname: "Old Nickname", lastFour: "1234" };
    mockUpdateCardMutate.mockClear();
    mockCloseModal.mockClear();
  });

  it("renders 'Edit card' title in edit mode", () => {
    render(<AddCardModal />);
    expect(screen.getByText("Edit card")).toBeInTheDocument();
  });

  it("pre-fills nickname and lastFour from editingCard", () => {
    render(<AddCardModal />);
    expect(screen.getByDisplayValue("Old Nickname")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1234")).toBeInTheDocument();
  });

  it("shows Cancel and 'Save changes' buttons", () => {
    render(<AddCardModal />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save changes")).toBeInTheDocument();
  });

  it("calls updateCard.mutateAsync with updated values on submit", async () => {
    mockUpdateCardMutate.mockResolvedValueOnce({});
    render(<AddCardModal />);

    const nicknameInput = screen.getByDisplayValue("Old Nickname");
    fireEvent.change(nicknameInput, { target: { value: "New Nickname" } });

    const form = document.querySelector("form")!;
    await act(async () => { fireEvent.submit(form); });

    await waitFor(() => {
      expect(mockUpdateCardMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id:   "uc-chase-flex",
          data: expect.objectContaining({ nickname: "New Nickname" }),
        })
      );
    }, { timeout: 10000 });
  });

  it("closes modal on Cancel click", () => {
    render(<AddCardModal />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockCloseModal).toHaveBeenCalled();
  });

  it("closes modal after successful update", async () => {
    mockUpdateCardMutate.mockResolvedValueOnce({});
    render(<AddCardModal />);

    const form = document.querySelector("form")!;
    await act(async () => { fireEvent.submit(form); });

    await waitFor(() => {
      expect(mockCloseModal).toHaveBeenCalled();
    }, { timeout: 10000 });
  });
});
