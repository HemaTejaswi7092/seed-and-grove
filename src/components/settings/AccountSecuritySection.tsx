import { useState, type FormEvent } from "react";
import { LogOut, Trash2 } from "lucide-react";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

type Status = "idle" | "saving" | "error";

interface AccountSecuritySectionProps {
  email: string;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  onSignOut: () => void;
}

// Entirely self-contained — unlike the other three sections, nothing
// here touches candidate_profiles, so there's no draft/dirty tracking to
// coordinate with the parent page. Mirrors RecruiterSettings.tsx's
// Security block (same AuthContext methods, same UX), plus a delete-
// account placeholder that intentionally does nothing yet.
export default function AccountSecuritySection({
  email,
  updatePassword,
  resetPasswordForEmail,
  onSignOut,
}: AccountSecuritySectionProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<Status>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordStatus === "saving") return;
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordStatus("saving");
    setPasswordError(null);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus("idle");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordStatus("error");
      setPasswordError(err instanceof Error ? err.message : "Couldn't update password.");
    }
  }

  async function handleSendResetLink() {
    setResetError(null);
    try {
      await resetPasswordForEmail(email);
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Couldn't send reset email.");
    }
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
        Account Security
      </p>

      <div>
        <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
          Account email
        </p>
        <p className="mt-1.5 text-sm text-ink">{email}</p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-5 border-t border-border pt-6">
        <p className="text-sm font-medium text-ink">Change password</p>
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            New password
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={`mt-1.5 ${inputClasses}`}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordSuccess(false);
            }}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            Confirm new password
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            className={`mt-1.5 ${inputClasses}`}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordSuccess(false);
            }}
          />
        </label>
        {passwordStatus === "error" && passwordError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-dark">
            Password updated.
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSendResetLink}
            className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
          >
            {resetSent ? "Reset link sent — check your email" : "Can't sign in? Send a reset link"}
          </button>
          <button
            type="submit"
            disabled={passwordStatus === "saving" || !newPassword || !confirmPassword}
            className="shrink-0 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordStatus === "saving" ? "Updating…" : "Update password"}
          </button>
        </div>
        {resetError && <p className="text-xs text-red-600">{resetError}</p>}
      </form>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div>
          <p className="text-sm font-medium text-ink">Sign out</p>
          <p className="text-xs text-ink-faint">{email}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          Sign out
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div>
          <p className="text-sm font-medium text-ink">Delete account</p>
          <p className="text-xs text-ink-faint">Not available yet.</p>
        </div>
        <button
          type="button"
          disabled
          title="Account deletion isn't implemented yet"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-faint opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Delete account
        </button>
      </div>
    </div>
  );
}
