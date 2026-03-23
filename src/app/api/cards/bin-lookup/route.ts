import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const querySchema = z.object({
  bin: z.string().regex(/^\d{6}$/, "BIN must be exactly 6 digits"),
});

type BinlistResponse = {
  scheme?: string;
  bank?: { name?: string };
};

function schemeToNetwork(scheme: string | undefined): string | null {
  if (!scheme) return null;
  const s = scheme.toLowerCase();
  if (s === "visa") return "VISA";
  if (s === "mastercard") return "MASTERCARD";
  if (s === "amex" || s === "american express") return "AMEX";
  if (s === "discover") return "DISCOVER";
  return null;
}

/**
 * GET /api/cards/bin-lookup?bin=424242
 *
 * Looks up the first 6 digits of a card (public BIN) to suggest issuer name and network.
 * Does not store the BIN. Third-party data may be incomplete; user should confirm.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bin = new URL(request.url).searchParams.get("bin") ?? "";
  const parsed = querySchema.safeParse({ bin });
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid BIN", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const res = await fetch(`https://lookup.binlist.net/${parsed.data.bin}`, {
      headers: { Accept: "application/json" },
      next:    { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ issuer: null, network: null });
    }
    const data = (await res.json()) as BinlistResponse;
    const issuer = data.bank?.name?.trim() || null;
    const network = schemeToNetwork(data.scheme);
    return NextResponse.json({ issuer, network });
  } catch {
    return NextResponse.json({ issuer: null, network: null });
  }
}
