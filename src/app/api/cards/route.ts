import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CardService } from "@/services/card.service";
import { addCardSchema } from "@/lib/validations/card.schema";

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
 * POST /api/cards — adds a catalog card to the user's wallet.
 *
 * Validates the request body, confirms the card exists in the catalog (404),
 * rejects duplicates (409), and returns the new UserCard with 201.
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

  const parsed = addCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    // Confirm the card exists in the catalog
    const catalogCard = await CardService.getCatalogCardById(parsed.data.cardId);
    if (!catalogCard) {
      return NextResponse.json(
        { message: "Card not found in catalog" },
        { status: 404 },
      );
    }

    // Reject if the user already has this card active in their wallet
    const existingCards = await CardService.getUserCards(session.user.id);
    const duplicate = existingCards.find(
      (uc) => uc.card.id === parsed.data.cardId,
    );
    if (duplicate) {
      return NextResponse.json(
        { message: "Card already in your wallet" },
        { status: 409 },
      );
    }

    const userCard = await CardService.addUserCard(session.user.id, parsed.data);
    return NextResponse.json(userCard, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to add card" }, { status: 500 });
  }
}
