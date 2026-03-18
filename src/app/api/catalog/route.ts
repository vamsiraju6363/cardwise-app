import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CardService } from "@/services/card.service";

/** GET /api/catalog — returns all active cards in the global catalog */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const cards = await CardService.getAllCatalogCards();
  return NextResponse.json(cards);
}
