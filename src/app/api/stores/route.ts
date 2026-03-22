import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StoreService } from "@/services/store.service";
import { z } from "zod";

const storeQuerySchema = z.object({
  q: z.string().max(100).trim().optional(),
  category: z.string().max(50).trim().optional(),
});

/**
 * GET /api/stores — search stores or browse by category.
 * - ?q=Target — search by name/domain (min 2 chars)
 * - ?category=groceries — list stores in that category
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") ?? searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "";

  const parsed = storeQuerySchema.safeParse({ q: rawQuery, category });
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    if (parsed.data.category) {
      const results = await StoreService.getStoresByCategorySlug(
        parsed.data.category,
        12,
      );
      return NextResponse.json(results);
    }
    if (parsed.data.q && parsed.data.q.length >= 2) {
      const results = await StoreService.searchStores(parsed.data.q, 8);
      return NextResponse.json(results);
    }
    return NextResponse.json([]);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch stores" },
      { status: 500 },
    );
  }
}
