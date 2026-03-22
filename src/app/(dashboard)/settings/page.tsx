import { auth } from "@/lib/auth";

export const metadata = {
  title: "Settings — CardWise",
};

/**
 * Settings page — account and app preferences.
 */
export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Account</h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium text-gray-900">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium text-gray-900">{user?.name ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
