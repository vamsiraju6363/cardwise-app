import { z } from "zod";

// ─── Shared field definitions ─────────────────────────────────────────────────

const nicknameField = z
  .union([
    z.literal(""),
    z.string().min(1, "Nickname cannot be empty").max(30, "Nickname must be 30 characters or fewer"),
  ])
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const lastFourField = z
  .union([
    z.literal(""),
    z.string().length(4, "Must be exactly 4 digits").regex(/^\d{4}$/, "Must be 4 numeric digits"),
  ])
  .optional()
  .transform((val) => (val === "" ? undefined : val));

// ─── Add card ─────────────────────────────────────────────────────────────────

export const addCardSchema = z.object({
  cardId:   z.string().min(1, "Card ID is required"),
  nickname: nicknameField,
  lastFour: lastFourField,
});

/** Schema for adding a custom card (not in catalog). */
export const addCustomCardSchema = z.object({
  issuer:        z.string().min(1, "Issuer is required").max(100),
  cardName:      z.string().min(1, "Card name is required").max(100),
  network:       z.enum(["VISA", "MASTERCARD", "AMEX", "DISCOVER"]),
  baseRewardPct: z.number().min(0).max(1),
  rewardType:    z.enum(["CASHBACK", "POINTS", "MILES"]),
  nickname:      nicknameField,
  lastFour:      lastFourField,
});

/** @deprecated Use addCardSchema */
export const AddUserCardSchema = z.object({
  cardId:   z.string().cuid("Invalid card ID"),
  nickname: z.string().max(100).optional(),
  lastFour: z
    .string()
    .length(4, "Must be exactly 4 digits")
    .regex(/^\d{4}$/, "Must be numeric")
    .optional(),
});

// ─── Update card ──────────────────────────────────────────────────────────────

export const updateCardSchema = z.object({
  nickname: z
    .union([
      z.literal(""),
      z.string().min(1, "Nickname cannot be empty").max(30, "Nickname must be 30 characters or fewer"),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  lastFour: z
    .union([
      z.literal(""),
      z.string().length(4, "Must be exactly 4 digits").regex(/^\d{4}$/, "Must be 4 numeric digits"),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  isActive: z.boolean().optional(),
});

/** @deprecated Use updateCardSchema */
export const UpdateUserCardSchema = z.object({
  nickname: z.string().max(100).nullable().optional(),
  lastFour: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

// ─── Param schemas ────────────────────────────────────────────────────────────

export const UserCardIdParamSchema = z.object({
  id: z.string().cuid("Invalid user-card ID"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type AddCardInput       = z.infer<typeof addCardSchema>;
export type AddCustomCardInput = z.infer<typeof addCustomCardSchema>;
export type UpdateCardInput    = z.infer<typeof updateCardSchema>;

/** @deprecated Use AddCardInput */
export type AddUserCardInput    = z.infer<typeof AddUserCardSchema>;
/** @deprecated Use UpdateCardInput */
export type UpdateUserCardInput = z.infer<typeof UpdateUserCardSchema>;
