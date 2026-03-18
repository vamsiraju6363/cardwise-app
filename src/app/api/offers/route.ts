import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OfferService } from "@/services/offer.service";
import { SpendTrackingUpsertSchema } from "@/lib/validations/offer.schema";

/** GET /api/offers — returns all spend tracking records for the user */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const records = await OfferService.getSpendTracking(session.user.id);
  return NextResponse.json(records);
}

/** POST /api/offers — upserts a spend tracking record */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = SpendTrackingUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const record = await OfferService.upsertSpendTracking(parsed.data);
  return NextResponse.json(record, { status: 201 });
}
