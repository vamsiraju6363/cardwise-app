import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StoreService } from "@/services/store.service";
import { z } from "zod";

const querySchema = z.object({
  category: z.string().min(1, "category is required"),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

/**
 * GET /api/recommend/stores?category=<slug>
 *
 * Returns stores in the category ranked by the best reward the user can get
 * with their wallet cards. Enables "I need gas" → "best gas stations for my cards".
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    category: searchParams.get("category"),
    limit: searchParams.get("limit"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const results = await StoreService.getStoresRankedByUserCards(
      session.user.id,
      parsed.data.category,
      parsed.data.limit,
    );
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch ranked stores" },
      { status: 500 },
    );
  }
}
