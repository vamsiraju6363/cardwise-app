import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CardService } from "@/services/card.service";
import { addCardSchema, addCustomCardSchema } from "@/lib/validations/card.schema";

/** GET /api/cards — returns all UserCards for the authenticated user. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const userCards = includeInactive
      ? await CardService.getUserCardsIncludingInactive(session.user.id)
      : await CardService.getUserCards(session.user.id);
    return NextResponse.json(userCards);
  } catch {
    return NextResponse.json({ message: "Failed to fetch wallet" }, { status: 500 });
  }
}

/**
 * POST /api/cards — adds a card to the user's wallet.
 *
 * Catalog: { cardId, nickname?, lastFour? }
 * Custom:  { issuer, cardName, network, baseRewardPct, rewardType, nickname?, lastFour? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const catalogParsed = addCardSchema.safeParse(body);
  const customParsed = addCustomCardSchema.safeParse(body);

  if (catalogParsed.success) {
    try {
      const catalogCard = await CardService.getCatalogCardById(catalogParsed.data.cardId);
      if (!catalogCard) {
        return NextResponse.json(
          { message: "Card not found in catalog" },
          { status: 404 },
        );
      }
      const existingCards = await CardService.getUserCards(session.user.id);
      const duplicate = existingCards.find(
        (uc) => uc.cardId && uc.card.id === catalogParsed.data.cardId,
      );
      if (duplicate) {
        return NextResponse.json(
          { message: "Card already in your wallet" },
          { status: 409 },
        );
      }
      const userCard = await CardService.addUserCard(session.user.id, catalogParsed.data);
      return NextResponse.json(userCard, { status: 201 });
    } catch {
      return NextResponse.json({ message: "Failed to add card" }, { status: 500 });
    }
  }

  if (customParsed.success) {
    try {
      const userCard = await CardService.addCustomUserCard(session.user.id, customParsed.data);
      return NextResponse.json(userCard, { status: 201 });
    } catch {
      return NextResponse.json({ message: "Failed to add card" }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      message: "Validation error",
      errors: catalogParsed.error?.flatten().fieldErrors ?? customParsed.error?.flatten().fieldErrors,
    },
    { status: 422 },
  );
}
