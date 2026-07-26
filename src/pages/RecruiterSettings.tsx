import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useRecruiterProfile } from "../recruiter/useRecruiterProfile";
import { updateRecruiterProfile } from "../recruiter/recruiterStore";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

type SectionStatus = "idle" | "saving" | "error";

// Not an ATS settings page — three plain sections (Account, Company,
// Security), no hiring-workflow configuration of any kind.
export default function RecruiterSettings() {
  const { user, profile, updateFullName, updatePassword, resetPasswordForEmail, signOut } =
    useAuth();
  const { recruiterProfile, loading, refresh } = useRecruiterProfile();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [accountStatus, setAccountStatus] = useState<SectionStatus>("idle");
  const [accountError, setAccountError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyStatus, setCompanyStatus] = useState<SectionStatus>("idle");
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<SectionStatus>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [resetSent, setResetSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Deferred a microtask so no setState call is reached synchronously in
  // the effect body itself — same fix used throughout this codebase (see
  // e.g. useRecruiterProfile.ts, RecruiterProfile.tsx).
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setFullName(profile.full_name ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!recruiterProfile) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setWorkEmail(recruiterProfile.work_email);
      setJobTitle(recruiterProfile.job_title);
      setCompanyName(recruiterProfile.company_name);
      setCompanyWebsite(recruiterProfile.company_website ?? "");
      setCompanyLocation(recruiterProfile.company_location ?? "");
      setCompanyLogoUrl(recruiterProfile.company_logo_url ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [recruiterProfile]);

  if (!user) return null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleSaveAccount(event: FormEvent) {
    event.preventDefault();
    if (accountStatus === "saving") return;
    setAccountStatus("saving");
    setAccountError(null);
    try {
      await updateFullName(fullName.trim());
      await updateRecruiterProfile(user!.id, {
        work_email: workEmail.trim(),
        job_title: jobTitle.trim(),
      });
      refresh();
      setAccountStatus("idle");
      showToast("Account updated");
    } catch (err) {
      setAccountStatus("error");
      setAccountError(err instanceof Error ? err.message : "Couldn't save changes.");
    }
  }

  async function handleSaveCompany(event: FormEvent) {
    event.preventDefault();
    if (companyStatus === "saving") return;
    setCompanyStatus("saving");
    setCompanyError(null);
    try {
      await updateRecruiterProfile(user!.id, {
        company_name: companyName.trim(),
        company_website: companyWebsite.trim() || null,
        company_location: companyLocation.trim() || null,
        company_logo_url: companyLogoUrl.trim() || null,
      });
      refresh();
      setCompanyStatus("idle");
      showToast("Company updated");
    } catch (err) {
      setCompanyStatus("error");
      setCompanyError(err instanceof Error ? err.message : "Couldn't save changes.");
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordStatus === "saving") return;
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
      showToast("Password updated");
    } catch (err) {
      setPasswordStatus("error");
      setPasswordError(err instanceof Error ? err.message : "Couldn't update password.");
    }
  }

  async function handleSendResetLink() {
    if (!user?.email) return;
    try {
      await resetPasswordForEmail(user.email);
      setResetSent(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't send reset email.");
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
      <p className="mt-2 text-ink-soft">Manage your account, company, and security.</p>

      {loading ? (
        <div className="mt-8 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Loading…</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <form
            onSubmit={handleSaveAccount}
            className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
          >
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Account
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Full name
              </span>
              <input
                className={`mt-1.5 ${inputClasses}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Work email
              </span>
              <input
                type="email"
                className={`mt-1.5 ${inputClasses}`}
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Recruiter title
              </span>
              <input
                className={`mt-1.5 ${inputClasses}`}
                placeholder="e.g. Technical Recruiter"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </label>
            {accountStatus === "error" && accountError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {accountError}
              </p>
            )}
            <div className="flex justify-end border-t border-border pt-5">
              <button
                type="submit"
                disabled={accountStatus === "saving"}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {accountStatus === "saving" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleSaveCompany}
            className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
          >
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Company
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Company name
              </span>
              <input
                className={`mt-1.5 ${inputClasses}`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Website
                </span>
                <input
                  type="url"
                  className={`mt-1.5 ${inputClasses}`}
                  placeholder="https://..."
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Location
                </span>
                <input
                  className={`mt-1.5 ${inputClasses}`}
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Logo URL
              </span>
              <input
                type="url"
                className={`mt-1.5 ${inputClasses}`}
                placeholder="https://..."
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
              />
            </label>
            {companyStatus === "error" && companyError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {companyError}
              </p>
            )}
            <div className="flex justify-end border-t border-border pt-5">
              <button
                type="submit"
                disabled={companyStatus === "saving"}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {companyStatus === "saving" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          <div className="space-y-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Security
            </p>

            <form onSubmit={handleChangePassword} className="space-y-5">
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
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              {passwordStatus === "error" && passwordError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {passwordError}
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
                  disabled={
                    passwordStatus === "saving" || !newPassword || !confirmPassword
                  }
                  className="shrink-0 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordStatus === "saving" ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div>
                <p className="text-sm font-medium text-ink">Sign out</p>
                <p className="text-xs text-ink-faint">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
