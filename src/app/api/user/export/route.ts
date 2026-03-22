import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/user/export — export user data as JSON. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const [user, userCards, tracking] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        createdAt: true,
      },
    }),
    prisma.userCard.findMany({
      where: { userId },
      include: {
        card: {
          select: {
            issuer: true,
            cardName: true,
            network: true,
            annualFee: true,
            rewardType: true,
          },
        },
        offers: {
          include: {
            store: { select: { name: true, category: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.spendTracking.findMany({
      where: { userCard: { userId } },
      include: {
        offer: {
          select: {
            rewardPct: true,
            store: { select: { name: true } },
          },
        },
        userCard: {
          select: {
            card: { select: { issuer: true, cardName: true } },
            nickname: true,
            lastFour: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: user
      ? {
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        }
      : null,
    wallet: userCards.map((uc) => ({
      id: uc.id,
      nickname: uc.nickname,
      lastFour: uc.lastFour,
      isActive: uc.isActive,
      card: uc.card,
      offersCount: uc.offers.length,
    })),
    spendTracking: tracking.map((t) => ({
      card: t.userCard.card,
      store: t.offer.store?.name ?? null,
      rewardPct: Number(t.offer.rewardPct),
      amountSpent: Number(t.amountSpent),
      periodStart: t.periodStart,
      periodEnd: t.periodEnd,
    })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cardwise-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
