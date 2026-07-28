import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, Sprout, Check } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getAuthErrorMessage } from "../auth/authErrors";
import AuthHeader from "../components/auth/AuthHeader";
import RoleSwitchLink from "../components/auth/RoleSwitchLink";
import PasswordInput from "../components/auth/PasswordInput";
import { useRecruiterProfile } from "../recruiter/useRecruiterProfile";
import { createRecruiterProfile, updateRecruiterProfile } from "../recruiter/recruiterStore";
import { parseCommaList } from "../recruiter/parseCommaList";
import CompanyInfoForm, {
  type CompanyInfoValues,
} from "../recruiter/components/CompanyInfoForm";
import CompanyExtrasForm, {
  type CompanyExtrasValues,
} from "../recruiter/components/CompanyExtrasForm";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Your account",
  2: "Company information",
  3: "A few more details",
};

// Handles both fresh signup (Step 1 creates the auth account, then 2 → 3)
// and resuming: if this Supabase project requires email confirmation,
// there's no session between Step 1 and Step 2, so company info can't be
// written yet. Rather than stash it and hope, this same page detects
// "authenticated recruiter with no recruiter_profiles row" on mount and
// picks up at Step 2 directly — no separate resume page, no lost data
// beyond what genuinely couldn't be saved before confirmation.
export default function RecruiterSignUp() {
  const navigate = useNavigate();
  const { user, profile, signUpWithEmail } = useAuth();
  const { recruiterProfile, loading: recruiterLoading, refresh } = useRecruiterProfile();

  const [initializing, setInitializing] = useState(true);
  const [step, setStep] = useState<WizardStep>(1);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [companyInfo, setCompanyInfo] = useState<CompanyInfoValues>({
    companyName: "",
    jobTitle: "",
    companyWebsite: "",
    companyLocation: "",
  });
  const [extras, setExtras] = useState<CompanyExtrasValues>({
    companyLogoUrl: "",
    hiringLocations: "",
    hiringRoles: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (recruiterLoading) return;
    let cancelled = false;
    // Deferred a microtask so no setState call is reached synchronously
    // in the effect body itself (same fix as useRecruiterProfile.ts).
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (user && profile && profile.account_type !== "recruiter") {
        // An existing candidate account can't "become" a recruiter here.
        navigate("/dashboard", { replace: true });
        return;
      }
      if (user && recruiterProfile) {
        navigate("/recruiter/dashboard", { replace: true });
        return;
      }
      if (user && !recruiterProfile) {
        setStep(2);
      }
      setInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, profile, recruiterProfile, recruiterLoading, navigate]);

  async function handleStep1Submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { session } = await signUpWithEmail(fullName, email, password, "recruiter");
      if (session) {
        setStep(2);
      } else {
        // No session yet — confirmation required. Company info gets
        // collected on next login instead (see the effect above).
        setConfirmationSent(true);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep2Submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);
    try {
      await createRecruiterProfile(user.id, {
        work_email: user.email ?? email,
        company_name: companyInfo.companyName.trim(),
        job_title: companyInfo.jobTitle.trim(),
        company_website: companyInfo.companyWebsite.trim() || null,
        company_location: companyInfo.companyLocation.trim() || null,
        company_logo_url: null,
        hiring_locations: [],
        hiring_roles: [],
      });
      refresh();
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep3Submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);
    try {
      await updateRecruiterProfile(user.id, {
        company_logo_url: extras.companyLogoUrl.trim() || null,
        hiring_locations: parseCommaList(extras.hiringLocations),
        hiring_roles: parseCommaList(extras.hiringRoles),
      });
      refresh();
      navigate("/recruiter/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkipStep3() {
    navigate("/recruiter/dashboard", { replace: true });
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sprout className="h-5 w-5" strokeWidth={2.25} />
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <AuthHeader variant="recruiter" />

      <main className="flex flex-1 justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {confirmationSent ? (
            <div className="rounded-2xl border border-border bg-canvas-elevated p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <MailCheck className="h-6 w-6" strokeWidth={2} />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
                Check your email
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                We sent a confirmation link to <strong>{email}</strong>. Follow
                it, then sign in — we'll pick up right where you left off to
                finish setting up your company profile.
              </p>
              <Link
                to="/recruiter/signin"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm font-semibold text-accent-dark">
                  Step {step} of 3
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {STEP_LABELS[step]}
                </h1>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {([1, 2, 3] as const).map((s) => (
                  <div
                    key={s}
                    className={[
                      "h-1.5 flex-1 rounded-full",
                      s <= step ? "bg-accent" : "bg-border",
                    ].join(" ")}
                  />
                ))}
              </div>

              {step === 1 && (
                <form
                  onSubmit={handleStep1Submit}
                  className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
                >
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="rs-name" className="block text-sm font-medium text-ink">
                        Full name
                      </label>
                      <input
                        id="rs-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Jordan Lee"
                        className={`mt-2 ${inputClasses}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="rs-email" className="block text-sm font-medium text-ink">
                        Work email
                      </label>
                      <input
                        id="rs-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@company.com"
                        className={`mt-2 ${inputClasses}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="rs-password" className="block text-sm font-medium text-ink">
                        Password
                      </label>
                      <PasswordInput
                        id="rs-password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="rs-confirm" className="block text-sm font-medium text-ink">
                        Confirm password
                      </label>
                      <PasswordInput
                        id="rs-confirm"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="••••••••"
                        className="mt-2"
                      />
                    </div>
                    {error && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-7 w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Creating account…" : "Continue"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form
                  onSubmit={handleStep2Submit}
                  className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
                >
                  <CompanyInfoForm values={companyInfo} onChange={setCompanyInfo} />
                  {error && (
                    <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-7 w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving…" : "Continue"}
                  </button>
                </form>
              )}

              {step === 3 && (
                <form
                  onSubmit={handleStep3Submit}
                  className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
                >
                  <CompanyExtrasForm values={extras} onChange={setExtras} />
                  {error && (
                    <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <div className="mt-7 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSkipStep3}
                      disabled={submitting}
                      className="flex-1 rounded-full border border-border px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-60"
                    >
                      Skip for now
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} />
                      {submitting ? "Finishing…" : "Finish"}
                    </button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <>
                  <p className="mt-6 text-center text-sm text-ink-soft">
                    Already have an account?{" "}
                    <Link
                      to="/recruiter/signin"
                      className="font-medium text-accent-dark hover:text-accent"
                    >
                      Sign In
                    </Link>
                  </p>

                  <RoleSwitchLink
                    prompt="Looking for a candidate account?"
                    linkLabel="Candidate Sign Up"
                    to="/signup"
                  />
                </>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
