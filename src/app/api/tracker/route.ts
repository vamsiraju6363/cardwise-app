import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TrackerService } from "@/services/tracker.service";
import { TrackerQuerySchema } from "@/lib/validations/offer.schema";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { CapPeriod } from "@prisma/client";

// ─── GET /api/tracker ─────────────────────────────────────────────────────────

/**
 * GET /api/tracker?period=MONTHLY
 *
 * Returns all SpendTracking records for the authenticated user's active cards,
 * joined with full offer data (store, category) and card data.
 * Defaults to the MONTHLY period.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = TrackerQuerySchema.safeParse({
    period: searchParams.get("period") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    // getSpendTracking returns full records joined with userCard + card + offer relations
    const records = await TrackerService.getSpendTracking(
      session.user.id,
      parsed.data.period as CapPeriod,
    );
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ message: "Failed to fetch tracking data" }, { status: 500 });
  }
}

// ─── POST /api/tracker ────────────────────────────────────────────────────────

const logSpendSchema = z.object({
  userCardId: z.string().min(1, "userCardId is required"),
  offerId:    z.string().min(1, "offerId is required"),
  amountSpent: z
    .number({ required_error: "amountSpent is required" })
    .positive("Amount must be greater than zero")
    .multipleOf(0.01, "Amount must have at most 2 decimal places"),
});

/**
 * POST /api/tracker — manually log (upsert) spend for a userCard + offer.
 *
 * Validates that the userCardId belongs to the authenticated user (403 if not).
 * Returns the updated SpendTracking record.
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

  const parsed = logSpendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    // Ownership check — verify the userCard belongs to the authenticated user
    const userCard = await prisma.userCard.findFirst({
      where: { id: parsed.data.userCardId, userId: session.user.id, isActive: true },
      select: { id: true },
    });

    if (!userCard) {
      return NextResponse.json(
        { message: "Forbidden — card not in your wallet" },
        { status: 403 },
      );
    }

    const record = await TrackerService.upsertSpendTracking(
      parsed.data.userCardId,
      parsed.data.offerId,
      parsed.data.amountSpent,
    );

    if (!record) {
      return NextResponse.json({ message: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ message: "Failed to log spend" }, { status: 500 });
  }
}
