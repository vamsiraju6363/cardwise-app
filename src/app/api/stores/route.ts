import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StoreService } from "@/services/store.service";
import { z } from "zod";

// Inline schema: accepts both "q" and "query" for client flexibility,
// enforces min 2 chars per spec, caps at 100.
const storeQuerySchema = z.object({
  q: z
    .string()
    .min(2, "Query must be at least 2 characters")
    .max(100, "Query must be 100 characters or fewer")
    .trim(),
});

/**
 * GET /api/stores?q=Target — searches stores by name and domain.
 * Returns up to 8 StoreSearchResult items sorted by relevance.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Accept "q" (spec) or "query" (legacy client alias)
  const rawQuery = searchParams.get("q") ?? searchParams.get("query") ?? "";

  const parsed = storeQuerySchema.safeParse({ q: rawQuery });
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const results = await StoreService.searchStores(parsed.data.q, 8);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ message: "Failed to search stores" }, { status: 500 });
  }
}
