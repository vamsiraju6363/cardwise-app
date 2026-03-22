"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "./ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Pencil,
  Check,
  X,
  Lock,
  Download,
  Trash2,
  Mail,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface SettingsContentProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  hasPassword: boolean;
  providers: string[];
}

export function SettingsContent({
  user,
  hasPassword,
  providers,
}: SettingsContentProps) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(user.name ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Please enter a display name.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to save");
      await update();
      router.refresh();
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your name has been saved." });
    } catch (e) {
      toast({
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Re-enter your new password.",
        variant: "destructive",
      });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to change password");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "You can sign in with your new password." });
    } catch (e) {
      toast({
        title: "Couldn't update password",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="(.+)"/)?.[1] ?? "cardwise-export.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export started", description: "Your data is downloading." });
    } catch {
      toast({
        title: "Export failed",
        description: "Try again later.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteAccount() {
    if (deletePhrase !== "DELETE MY ACCOUNT") {
      toast({
        title: "Confirmation required",
        description: 'Type "DELETE MY ACCOUNT" exactly.',
        variant: "destructive",
      });
      return;
    }
    if (hasPassword && !deletePassword) {
      toast({
        title: "Password required",
        description: "Enter your password to delete your account.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: hasPassword ? deletePassword : undefined,
          confirmPhrase: deletePhrase,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to delete account");
      await signOut({ redirect: false });
      window.location.href = "/login";
    } catch (e) {
      toast({
        title: "Couldn't delete account",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  }

  const providerLabels: Record<string, string> = {
    credentials: "Email",
    google: "Google",
  };

  return (
    <div className="space-y-10">
      {/* ── Theme ───────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Theme</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose light, dark, or match your system.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* ── Account ─────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-foreground mb-5">Account</h2>

        <div className="space-y-2 mb-6">
          <Label className="text-muted-foreground">Email</Label>
          <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
            {user.email ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            Email is linked to your sign-in method and can&apos;t be changed
            here.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="max-w-xs"
                disabled={isSaving}
                autoFocus
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setName(user.name ?? "");
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-10 flex-1 max-w-xs items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground">
                {user.name || "—"}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Connected accounts ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-foreground mb-2">Sign-in methods</h2>
        <p className="text-sm text-muted-foreground mb-4">
          How you sign in to CardWise.
        </p>
        <ul className="space-y-2">
          {(hasPassword ? ["credentials", ...providers.filter((p) => p !== "credentials")] : providers).map((p) => (
            <li
              key={p}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50"
            >
              {p === "google" ? (
                <Shield className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Mail className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {providerLabels[p] ?? p}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Password ────────────────────────────────────────────────────────── */}
      {hasPassword && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Password</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Change your password for email sign-in.
          </p>
          {showPasswordForm ? (
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword}
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update password"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change password
            </Button>
          )}
        </section>
      )}

      {/* ── Privacy ─────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your data and account.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="font-medium text-foreground">Export your data</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of your wallet, spend tracking, and account info.
              </p>
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently remove your account and all data. This cannot be
                undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </Button>
          </div>
        </div>
      </section>

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete account</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently delete your account and all your data
              (wallet cards, spend tracking). You will need to sign up again to
              use CardWise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletePhrase">
                Type <strong>DELETE MY ACCOUNT</strong> to confirm
              </Label>
              <Input
                id="deletePhrase"
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Your password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                isDeleting ||
                deletePhrase !== "DELETE MY ACCOUNT" ||
                (hasPassword && !deletePassword)
              }
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete my account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
