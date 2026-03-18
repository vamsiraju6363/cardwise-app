import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CardService } from "@/services/card.service";

/**
 * GET /api/cards/catalog — returns all active cards in the global catalog,
 * grouped by issuer.
 *
 * Response is cached for 1 hour (s-maxage) since catalog data rarely changes.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const cards = await CardService.getAllCards();

    // Group by issuer, preserving the service's alphabetical ordering
    const grouped = cards.reduce<Record<string, typeof cards>>(
      (acc, card) => {
        if (!acc[card.issuer]) acc[card.issuer] = [];
        acc[card.issuer].push(card);
        return acc;
      },
      {},
    );

    return NextResponse.json(
      { cards, grouped },
      {
        headers: {
          "Cache-Control": "private, s-maxage=3600, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ message: "Failed to fetch catalog" }, { status: 500 });
  }
}
