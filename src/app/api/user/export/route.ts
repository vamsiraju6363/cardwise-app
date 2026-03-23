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
            _count: { select: { offers: true } },
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
            customIssuer: true,
            customCardName: true,
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
    wallet: userCards.map((uc) => {
      if (uc.card) {
        const { _count, ...card } = uc.card;
        return {
          id: uc.id,
          nickname: uc.nickname,
          lastFour: uc.lastFour,
          isActive: uc.isActive,
          card,
          offersCount: _count.offers,
        };
      }
      return {
        id: uc.id,
        nickname: uc.nickname,
        lastFour: uc.lastFour,
        isActive: uc.isActive,
        card: {
          issuer: uc.customIssuer ?? "",
          cardName: uc.customCardName ?? "",
          network: uc.customNetwork ?? "VISA",
          annualFee: 0,
          rewardType: uc.customRewardType ?? "CASHBACK",
        },
        offersCount: 0,
      };
    }),
    spendTracking: tracking.map((t) => ({
      card: t.userCard.card ?? {
        issuer: t.userCard.customIssuer ?? "",
        cardName: t.userCard.customCardName ?? "",
      },
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
