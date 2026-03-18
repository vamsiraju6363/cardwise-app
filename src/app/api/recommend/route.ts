import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RankingService } from "@/services/ranking.service";
import { z } from "zod";

const recommendQuerySchema = z.object({
  storeId: z.string().min(1, "storeId is required"),
});

/**
 * GET /api/recommend?storeId=<id>
 *
 * Returns ranked card recommendations for the authenticated user at a given store.
 *
 * Response shape:
 *   { store, rankedCards: RankedCard[], totalOffersFound: number }
 *
 * Special cases:
 *   - No wallet cards → { rankedCards: [], totalOffersFound: 0, message: "no_cards" }
 *   - Store not found → 404
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = recommendQuerySchema.safeParse({
    storeId: searchParams.get("storeId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const result = await RankingService.getRankedCards(
      session.user.id,
      parsed.data.storeId,
    );

    if (!result) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Failed to generate recommendations" }, { status: 500 });
  }
}
