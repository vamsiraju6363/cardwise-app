import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const deleteSchema = z.object({
  password: z.string().optional(),
  confirmPhrase: z.literal("DELETE MY ACCOUNT"),
});

/** DELETE /api/user/delete — permanently delete the user account. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          'Type "DELETE MY ACCOUNT" exactly to confirm, and provide your password if you sign in with email.',
      },
      { status: 422 }
    );
  }

  if (user.password) {
    if (!parsed.data.password) {
      return NextResponse.json(
        { message: "Password required to delete account" },
        { status: 422 }
      );
    }
    const isValid = await bcrypt.compare(parsed.data.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ message: "Account deleted" });
}
