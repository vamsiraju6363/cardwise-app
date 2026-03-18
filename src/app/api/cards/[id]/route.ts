import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CardService } from "@/services/card.service";
import { updateCardSchema, UserCardIdParamSchema } from "@/lib/validations/card.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/cards/[id] — returns a single UserCard owned by the authenticated user */
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UserCardIdParamSchema.safeParse({ id }).success) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  try {
    const userCard = await CardService.getUserCardById(id, session.user.id);
    if (!userCard) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }
    return NextResponse.json(userCard);
  } catch {
    return NextResponse.json({ message: "Failed to fetch card" }, { status: 500 });
  }
}

/** PUT /api/cards/[id] — alias for PATCH */
export async function PUT(request: Request, ctx: RouteContext) {
  return PATCH(request, ctx);
}

/**
 * PATCH /api/cards/[id] — updates a UserCard's nickname, lastFour, or isActive.
 *
 * Verifies the card belongs to the authenticated user (403 if not).
 * Validates the body with updateCardSchema.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UserCardIdParamSchema.safeParse({ id }).success) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    // Ownership check before mutating — returns null for both not-found and wrong-owner.
    // We return 403 in both cases to avoid leaking the existence of other users' cards.
    const existing = await CardService.getUserCardById(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { message: "Forbidden — card not in your wallet" },
        { status: 403 },
      );
    }

    const updated = await CardService.updateUserCard(id, session.user.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Failed to update card" }, { status: 500 });
  }
}

/**
 * DELETE /api/cards/[id] — soft-removes a card from the user's wallet (isActive=false).
 *
 * Verifies ownership (403 if not theirs). Returns 204 No Content on success.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UserCardIdParamSchema.safeParse({ id }).success) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  try {
    // Ownership check before mutating
    const existing = await CardService.getUserCardById(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { message: "Forbidden — card not in your wallet" },
        { status: 403 },
      );
    }

    await CardService.removeUserCard(id, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "Failed to remove card" }, { status: 500 });
  }
}
