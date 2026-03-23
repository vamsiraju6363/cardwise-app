"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Search, ArrowLeft, Loader2, PlusCircle, Fingerprint } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import { useAddCard, useUpdateCard, useAllCards } from "@/hooks/useCards";
import { useDebounce } from "@/hooks/useDebounce";
import {
  addCardSchema,
  addCustomCardSchema,
  updateCardSchema,
  type AddCardInput,
  type AddCustomCardInput,
  type UpdateCardInput,
} from "@/lib/validations/card.schema";
import { z } from "zod";
import { cn, formatPercent, getRewardTypeLabel } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogCard = {
  id:            string;
  issuer:        string;
  cardName:      string;
  network:       string;
  baseRewardPct: number;
  rewardType:    string;
  annualFee:     number;
};

const NETWORKS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER"] as const;
const REWARD_TYPES = [
  { value: "CASHBACK", label: "Cash back" },
  { value: "POINTS", label: "Points" },
  { value: "MILES", label: "Miles" },
] as const;

// ─── Network gradient (mirrors CardTile) ─────────────────────────────────────

const NETWORK_GRADIENT: Record<string, string> = {
  VISA:       "from-blue-600 via-blue-700 to-blue-900",
  MASTERCARD: "from-orange-500 via-orange-600 to-red-700",
  AMEX:       "from-emerald-600 via-emerald-700 to-teal-900",
  DISCOVER:   "from-purple-600 via-purple-700 to-indigo-900",
};

// ─── Mini card preview ────────────────────────────────────────────────────────

function CardPreview({
  card,
  nickname,
  lastFour,
}: {
  card:     CatalogCard;
  nickname: string;
  lastFour: string;
}) {
  const gradient    = NETWORK_GRADIENT[card.network] ?? "from-slate-600 to-slate-900";
  const displayName = nickname.trim() || card.cardName;
  const digits      = lastFour.trim() || "••••";

  return (
    <div className={cn("rounded-xl bg-gradient-to-br p-4 h-[120px] flex flex-col justify-between shadow-md", gradient)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center">
            <CreditCard className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-white/75 text-[11px] font-medium">{card.issuer}</span>
        </div>
        <Badge variant="outline" className="text-[10px] border-white/30 text-white/80 px-1.5 py-0">
          {card.network}
        </Badge>
      </div>
      <div>
        <p className="text-white font-semibold text-sm truncate">{displayName}</p>
        <p className="text-white/50 text-[11px] font-mono tracking-widest mt-0.5">
          •••• •••• •••• {digits}
        </p>
      </div>
    </div>
  );
}

// ─── AddCardModal ─────────────────────────────────────────────────────────────

/**
 * Two-step modal for adding a card to the wallet, or editing an existing one.
 *
 * Step 1 (add mode): Searchable catalog grouped by issuer. Select a card to proceed.
 * Step 2 (add mode): Optional nickname + last-four fields with a live card preview.
 * Edit mode:         Directly shows nickname + last-four fields.
 */
export function AddCardModal() {
  const { isAddCardModalOpen, editingCard, closeAddCardModal } = useWalletStore();
  const { data: catalogCards, isLoading: isCatalogLoading }   = useAllCards();
  const addCard    = useAddCard();
  const updateCard = useUpdateCard();

  const isEditing = !!editingCard;
  const [step, setStep]               = useState<"pick" | "label" | "custom">("pick");
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [binInput, setBinInput]         = useState("");
  const [binLookupPending, setBinLookupPending] = useState(false);
  const [binLookupHint, setBinLookupHint]       = useState<string | null>(null);

  // ── Forms ──
  const addForm = useForm<AddCardInput>({
    resolver:      zodResolver(addCardSchema),
    defaultValues: { cardId: "", nickname: "", lastFour: "" },
  });

  const editForm = useForm<UpdateCardInput>({
    resolver:      zodResolver(updateCardSchema),
    defaultValues: { nickname: "", lastFour: "" },
  });

  type CustomFormValues = Omit<AddCustomCardInput, "baseRewardPct"> & { baseRewardPctInput: number };
  const customForm = useForm<CustomFormValues>({
    resolver: zodResolver(
      addCustomCardSchema.omit({ baseRewardPct: true }).extend({
        baseRewardPctInput: z.coerce.number().min(0, "Enter 0 or more").max(100, "Enter 100 or less"),
      }),
    ),
    defaultValues: {
      issuer: "",
      cardName: "",
      network: "VISA",
      baseRewardPctInput: 1,
      rewardType: "CASHBACK",
      nickname: "",
      lastFour: "",
    },
  });

  // Reset state whenever the modal opens/closes or switches between add/edit
  useEffect(() => {
    if (isAddCardModalOpen) {
      if (isEditing) {
        setStep("label");
        editForm.reset({
          nickname: editingCard.nickname ?? "",
          lastFour: editingCard.lastFour ?? "",
        });
      } else {
        setStep("pick");
        setSelectedCard(null);
        setSearchQuery("");
        addForm.reset({ cardId: "", nickname: "", lastFour: "" });
        customForm.reset({
          issuer: "",
          cardName: "",
          network: "VISA",
          baseRewardPctInput: 1,
          rewardType: "CASHBACK",
          nickname: "",
          lastFour: "",
        });
        setBinInput("");
        setBinLookupHint(null);
      }
    }
  }, [isAddCardModalOpen, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBinLookup() {
    const digits = binInput.replace(/\D/g, "").slice(0, 6);
    setBinLookupHint(null);
    if (digits.length !== 6) {
      setBinLookupHint("Enter exactly 6 digits (first numbers on your card—not the full number).");
      return;
    }
    setBinLookupPending(true);
    try {
      const res = await fetch(`/api/cards/bin-lookup?bin=${digits}`);
      const data = (await res.json()) as { issuer?: string | null; network?: string | null };
      if (data.issuer) customForm.setValue("issuer", data.issuer);
      if (data.network && NETWORKS.includes(data.network as (typeof NETWORKS)[number])) {
        customForm.setValue("network", data.network as AddCustomCardInput["network"]);
      }
      setBinLookupHint(
        data.issuer
          ? "Bank name filled from BIN—add your card product name, then save."
          : "No bank name returned for this BIN. Enter issuer manually.",
      );
    } catch {
      setBinLookupHint("Lookup failed. Enter your bank name manually.");
    } finally {
      setBinLookupPending(false);
    }
  }

  const watchIssuer   = customForm.watch("issuer") ?? "";
  const watchCardName = customForm.watch("cardName") ?? "";
  const debouncedIssuer   = useDebounce(watchIssuer.trim(), 300);
  const debouncedCardName = useDebounce(watchCardName.trim(), 300);

  /** Catalog matches when in custom step — search as user types issuer + card name. */
  const catalogMatchesInCustom = useMemo(() => {
    if (step !== "custom") return [];
    const cards = (catalogCards ?? []) as CatalogCard[];
    const i = debouncedIssuer.toLowerCase();
    const n = debouncedCardName.toLowerCase();
    if (i.length < 2 && n.length < 2) return [];
    return cards.filter((c) => {
      const ci = c.issuer.toLowerCase();
      const cn = c.cardName.toLowerCase();
      const issuerMatch  = i.length >= 2 && (ci.includes(i) || i.includes(ci));
      const cardNameMatch = n.length >= 2 && (cn.includes(n) || n.includes(cn));
      return issuerMatch && cardNameMatch;
    });
  }, [step, catalogCards, debouncedIssuer, debouncedCardName]);

  // ── Catalog grouped by issuer ──
  const groupedCatalog = useMemo(() => {
    const cards = (catalogCards ?? []) as CatalogCard[];
    const q     = searchQuery.trim().toLowerCase();

    const filtered = q
      ? cards.filter(
          (c) =>
            c.issuer.toLowerCase().includes(q) ||
            c.cardName.toLowerCase().includes(q),
        )
      : cards;

    return filtered.reduce<Record<string, CatalogCard[]>>((acc, card) => {
      (acc[card.issuer] ??= []).push(card);
      return acc;
    }, {});
  }, [catalogCards, searchQuery]);

  // ── Handlers ──
  function handlePickCard(card: CatalogCard) {
    setSelectedCard(card);
    addForm.setValue("cardId", card.id);
    setStep("label");
  }

  async function handleAdd(values: AddCardInput) {
    await addCard.mutateAsync({
      cardId:   selectedCard!.id,
      nickname: values.nickname || undefined,
      lastFour: values.lastFour || undefined,
    });
    closeAddCardModal();
  }

  async function handleAddCustom(values: CustomFormValues) {
    await addCard.mutateAsync({
      issuer:        values.issuer,
      cardName:      values.cardName,
      network:       values.network,
      baseRewardPct: values.baseRewardPctInput / 100,
      rewardType:    values.rewardType,
      nickname:      values.nickname || undefined,
      lastFour:      values.lastFour || undefined,
    });
    closeAddCardModal();
  }

  async function handleUpdate(values: UpdateCardInput) {
    await updateCard.mutateAsync({
      id:   editingCard!.id,
      data: {
        nickname: values.nickname || null,
        lastFour: values.lastFour || null,
      },
    });
    closeAddCardModal();
  }

  // Live preview values
  const watchNickname = addForm.watch("nickname") ?? "";
  const watchLastFour = addForm.watch("lastFour") ?? "";

  return (
    <Dialog open={isAddCardModalOpen} onOpenChange={(open) => !open && closeAddCardModal()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {isEditing
              ? "Edit card"
              : step === "pick"
              ? "Add a card"
              : step === "custom"
              ? "Add a custom card"
              : "Label your card"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEditing
              ? "Update your card's nickname or last four digits."
              : step === "pick"
              ? "Choose a card from the catalog or add one not listed."
              : step === "custom"
              ? "Enter bank and card name (optional: first 6 digits to suggest bank). We match to our catalog when possible—no full card number or bank login."
              : "Optionally give your card a nickname and enter the last 4 digits."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">

          {/* ── Step 1: Pick from catalog ── */}
          {!isEditing && step === "pick" && (
            <>
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {/* Catalog list */}
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {isCatalogLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))
                  : Object.entries(groupedCatalog).length === 0
                  ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No cards match &ldquo;{searchQuery}&rdquo;
                    </p>
                  )
                  : Object.entries(groupedCatalog).map(([issuer, cards]) => (
                      <div key={issuer}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                          {issuer}
                        </p>
                        <div className="space-y-1">
                          {cards.map((card) => (
                            <button
                              key={card.id}
                              onClick={() => handlePickCard(card)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl border text-left",
                                "transition-all duration-150",
                                "hover:border-emerald-300 hover:bg-emerald-50",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg bg-gradient-to-br shrink-0",
                                  NETWORK_GRADIENT[card.network] ?? "from-slate-600 to-slate-900",
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{card.cardName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatPercent(card.baseRewardPct)} base ·{" "}
                                  {getRewardTypeLabel(card.rewardType as "CASHBACK" | "POINTS" | "MILES")} ·{" "}
                                  {card.annualFee === 0 ? "No annual fee" : `$${card.annualFee}/yr`}
                                </p>
                              </div>
                              <Check className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                <button
                  type="button"
                  onClick={() => setStep("custom")}
                  className="w-full flex items-center gap-2 py-3 px-3 rounded-xl border border-dashed border-gray-300 text-sm text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add a card not in our list
                </button>
              </div>
            </>
          )}

          {/* ── Custom card form ── */}
          {!isEditing && step === "custom" && (
            <form onSubmit={customForm.handleSubmit(handleAddCustom)} className="space-y-4">
              {/* Catalog match hint — when user's typing matches a catalog card, offer to add from catalog for full offers */}
              {catalogMatchesInCustom.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-2">
                  <p className="text-sm font-medium text-emerald-800">
                    We have this card in our catalog
                  </p>
                  <p className="text-xs text-emerald-700">
                    Tap Add from catalog, or submit the form—we also auto-match on save when the name matches.
                  </p>
                  <div className="space-y-1.5">
                    {catalogMatchesInCustom.slice(0, 3).map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handlePickCard(card)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200/80",
                          "bg-white hover:bg-emerald-50 hover:border-emerald-300",
                          "text-left transition-colors",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg bg-gradient-to-br shrink-0",
                            NETWORK_GRADIENT[card.network] ?? "from-slate-600 to-slate-900",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.cardName}</p>
                          <p className="text-xs text-muted-foreground">
                            {card.issuer} · {formatPercent(card.baseRewardPct)} base
                          </p>
                        </div>
                        <Button type="button" size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                          Add from catalog
                        </Button>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-emerald-600 pt-1">
                    Or add as a custom card below if this isn&apos;t the right one.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-3 space-y-2">
                <Label htmlFor="custom-bin" className="flex items-center gap-2 text-sm">
                  <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                  First 6 digits (BIN) — optional
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Public bank identifier only. We never ask for your full card number, CVV, or bank password.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="custom-bin"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="424242"
                    value={binInput}
                    onChange={(e) => setBinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="font-mono tracking-widest max-w-[9rem]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={binLookupPending}
                    onClick={() => void handleBinLookup()}
                  >
                    {binLookupPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up bank"}
                  </Button>
                </div>
                {binLookupHint && <p className="text-[11px] text-muted-foreground">{binLookupHint}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-issuer">Issuer / Bank</Label>
                <Input
                  id="custom-issuer"
                  placeholder="e.g. Chase, American Express, Wells Fargo"
                  {...customForm.register("issuer")}
                />
                {customForm.formState.errors.issuer && (
                  <p className="text-xs text-destructive">{customForm.formState.errors.issuer.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-cardName">Card name</Label>
                <Input
                  id="custom-cardName"
                  placeholder="e.g. Preferred Rewards, Custom Cash"
                  {...customForm.register("cardName")}
                />
                {customForm.formState.errors.cardName && (
                  <p className="text-xs text-destructive">{customForm.formState.errors.cardName.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Network</Label>
                  <Select
                    value={customForm.watch("network")}
                    onValueChange={(v) => customForm.setValue("network", v as AddCustomCardInput["network"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NETWORKS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-baseRewardPct">Base reward %</Label>
                  <p className="text-[11px] text-muted-foreground -mt-1">
                    Used only if we can&apos;t match this card to our catalog—your everyday base earn rate.
                  </p>
                  <Input
                    id="custom-baseRewardPct"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder="e.g. 2"
                    {...customForm.register("baseRewardPctInput", { valueAsNumber: true })}
                  />
                  {customForm.formState.errors.baseRewardPctInput && (
                    <p className="text-xs text-destructive">{customForm.formState.errors.baseRewardPctInput.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reward type</Label>
                <Select
                  value={customForm.watch("rewardType")}
                  onValueChange={(v) => customForm.setValue("rewardType", v as AddCustomCardInput["rewardType"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-nickname">Nickname <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="custom-nickname"
                  placeholder="e.g. My work card"
                  {...customForm.register("nickname")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-lastFour">Last 4 digits <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="custom-lastFour"
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  {...customForm.register("lastFour")}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("pick")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={addCard.isPending}
                >
                  {addCard.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</>
                  ) : (
                    "Add to wallet"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ── Step 2: Label (add mode) ── */}
          {!isEditing && step === "label" && selectedCard && (
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              {/* Live preview */}
              <CardPreview
                card={selectedCard}
                nickname={watchNickname}
                lastFour={watchLastFour}
              />

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="nickname"
                  placeholder={`e.g. "My ${selectedCard.cardName}"`}
                  maxLength={30}
                  {...addForm.register("nickname")}
                />
                {addForm.formState.errors.nickname && (
                  <p className="text-xs text-destructive">{addForm.formState.errors.nickname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastFour">Last 4 digits <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="lastFour"
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  {...addForm.register("lastFour")}
                />
                {addForm.formState.errors.lastFour && (
                  <p className="text-xs text-destructive">{addForm.formState.errors.lastFour.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("pick")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={addCard.isPending}
                >
                  {addCard.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</>
                  ) : (
                    "Add to wallet"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ── Edit mode ── */}
          {isEditing && (
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nickname">Nickname</Label>
                <Input
                  id="edit-nickname"
                  placeholder="e.g. My Blue Amex"
                  maxLength={30}
                  {...editForm.register("nickname")}
                />
                {editForm.formState.errors.nickname && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.nickname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-lastFour">Last 4 digits</Label>
                <Input
                  id="edit-lastFour"
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  {...editForm.register("lastFour")}
                />
                {editForm.formState.errors.lastFour && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.lastFour.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeAddCardModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={updateCard.isPending}
                >
                  {updateCard.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
