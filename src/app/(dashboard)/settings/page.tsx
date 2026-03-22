import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsContent } from "@/components/settings/SettingsContent";

export const metadata = {
  title: "Settings — CardWise",
};

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user ?? { name: null, email: null };

  let hasPassword = false;
  let providers: string[] = [];
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        accounts: { select: { provider: true } },
      },
    });
    hasPassword = !!dbUser?.password;
    providers = dbUser?.accounts?.map((a) => a.provider) ?? [];
    if (hasPassword && !providers.includes("credentials")) {
      providers = ["credentials", ...providers];
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account, privacy, and preferences.
        </p>
      </div>

      <SettingsContent
        user={user}
        hasPassword={hasPassword}
        providers={providers}
      />
    </div>
  );
}
