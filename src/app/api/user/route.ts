import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
});

/** PATCH /api/user — update the current user's profile (e.g. name). */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });
    return NextResponse.json({ name: user.name });
  } catch {
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
