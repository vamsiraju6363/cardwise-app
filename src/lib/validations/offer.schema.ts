import { z } from "zod";

// ─── Shared enum schemas ──────────────────────────────────────────────────────

export const RewardTypeSchema = z.enum(["CASHBACK", "POINTS", "MILES"]);
export const CapPeriodSchema  = z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]);
export const DataSourceSchema = z.enum(["MANUAL", "SCRAPED", "USER_SUBMITTED"]);

// ─── createOfferSchema (human-facing: rewardPct as a percentage 0.1–100) ─────

/**
 * Schema for the public/form-facing offer creation payload.
 * rewardPct is expressed as a percentage (e.g. 5 = 5%, 0.5 = 0.5%).
 * The service layer converts it to a decimal fraction before persisting.
 */
export const createOfferSchema = z.object({
  cardId:           z.string().min(1, "Card ID is required"),
  storeId:          z.string().min(1).nullable().optional(),
  categoryId:       z.string().min(1).nullable().optional(),
  rewardPct:        z
    .number({ required_error: "Reward percentage is required" })
    .min(0.1,  "Reward must be at least 0.1%")
    .max(100,  "Reward cannot exceed 100%"),
  rewardType:       RewardTypeSchema,
  capAmount:        z
    .number()
    .positive("Cap amount must be greater than zero")
    .nullable()
    .optional(),
  capPeriod:        CapPeriodSchema.nullable().optional(),
  bonusDescription: z.string().max(500).nullable().optional(),
  validFrom:        z.string().datetime().optional(),
  validUntil:       z.string().datetime().nullable().optional(),
  dataSource:       DataSourceSchema.optional().default("MANUAL"),
}).refine(
  (d) => d.storeId != null || d.categoryId != null,
  { message: "At least one of storeId or categoryId must be provided" }
).refine(
  (d) => !(d.capAmount != null && d.capPeriod == null),
  { message: "capPeriod is required when capAmount is set", path: ["capPeriod"] }
);

// ─── updateOfferSchema (human-facing: rewardPct as a percentage) ─────────────

export const updateOfferSchema = z.object({
  rewardPct:        z.number().min(0.1).max(100).optional(),
  rewardType:       RewardTypeSchema.optional(),
  capAmount:        z.number().positive().nullable().optional(),
  capPeriod:        CapPeriodSchema.nullable().optional(),
  bonusDescription: z.string().max(500).nullable().optional(),
  validUntil:       z.string().datetime().nullable().optional(),
  isActive:         z.boolean().optional(),
  dataSource:       DataSourceSchema.optional(),
  lastVerifiedAt:   z.string().datetime().nullable().optional(),
});

// ─── CreateOfferSchema / UpdateOfferSchema (internal: rewardPct as decimal) ──
// Used by offer.service.ts — rewardPct is a decimal fraction (e.g. 0.05 = 5%).

/** @deprecated Prefer createOfferSchema (percentage-based) for form/API use. */
export const CreateOfferSchema = z.object({
  cardId:           z.string().cuid("Invalid card ID"),
  storeId:          z.string().cuid().optional().nullable(),
  categoryId:       z.string().cuid().optional().nullable(),
  rewardPct:        z.number().positive().max(1, "rewardPct must be a decimal fraction ≤ 1"),
  rewardType:       RewardTypeSchema,
  capAmount:        z.number().positive().optional().nullable(),
  capPeriod:        CapPeriodSchema.optional().nullable(),
  bonusDescription: z.string().max(500).optional().nullable(),
  validFrom:        z.string().datetime().optional(),
  validUntil:       z.string().datetime().optional().nullable(),
  dataSource:       DataSourceSchema.optional().default("MANUAL"),
}).refine(
  (d) => d.storeId != null || d.categoryId != null,
  { message: "At least one of storeId or categoryId must be provided" }
);

/** @deprecated Prefer updateOfferSchema (percentage-based) for form/API use. */
export const UpdateOfferSchema = z.object({
  rewardPct:        z.number().positive().max(1).optional(),
  rewardType:       RewardTypeSchema.optional(),
  capAmount:        z.number().positive().nullable().optional(),
  capPeriod:        CapPeriodSchema.nullable().optional(),
  bonusDescription: z.string().max(500).nullable().optional(),
  validUntil:       z.string().datetime().nullable().optional(),
  isActive:         z.boolean().optional(),
  dataSource:       DataSourceSchema.optional(),
  lastVerifiedAt:   z.string().datetime().nullable().optional(),
});

// ─── Spend tracking ───────────────────────────────────────────────────────────

export const SpendTrackingUpsertSchema = z.object({
  userCardId:  z.string().cuid("Invalid user-card ID"),
  offerId:     z.string().cuid("Invalid offer ID"),
  periodStart: z.string().datetime(),
  periodEnd:   z.string().datetime(),
  amountSpent: z
    .number()
    .nonnegative("Amount must be non-negative")
    .multipleOf(0.01, "Amount must have at most 2 decimal places"),
});

export const TrackerQuerySchema = z.object({
  period: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]).optional().default("MONTHLY"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateOfferFormInput     = z.infer<typeof createOfferSchema>;
export type UpdateOfferFormInput     = z.infer<typeof updateOfferSchema>;
export type SpendTrackingUpsertInput = z.infer<typeof SpendTrackingUpsertSchema>;
export type TrackerQueryInput        = z.infer<typeof TrackerQuerySchema>;

/** @deprecated Use CreateOfferFormInput */
export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;
/** @deprecated Use UpdateOfferFormInput */
export type UpdateOfferInput = z.infer<typeof UpdateOfferSchema>;
