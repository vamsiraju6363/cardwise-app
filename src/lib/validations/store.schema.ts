import { z } from "zod";

// ─── Store search ─────────────────────────────────────────────────────────────

export const storeSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query must be 100 characters or fewer")
    .trim(),
});

/**
 * Extended search schema used by the API route (includes optional limit param
 * as a query-string string that gets coerced to a number).
 * @deprecated Use storeSearchSchema for form validation; this is for API routes only.
 */
export const StoreSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(200, "Search query is too long")
    .trim(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 10))
    .pipe(z.number().min(1).max(50)),
});

export const RecommendQuerySchema = z.object({
  storeId: z.string().cuid("Invalid store ID"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type StoreSearchInput = z.infer<typeof storeSearchSchema>;
export type RecommendInput   = z.infer<typeof RecommendQuerySchema>;
