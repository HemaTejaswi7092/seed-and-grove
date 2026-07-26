import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/useAuth";
import { getAuthErrorMessage } from "../auth/authErrors";
import { resolvePostLoginPath } from "../auth/postLoginRedirect";
import AuthHeader from "../components/auth/AuthHeader";
import RoleSwitchLink from "../components/auth/RoleSwitchLink";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

interface SignInProps {
  accountType?: "candidate" | "recruiter";
}

// One shared sign-in form for both account types — Supabase auth doesn't
// need to know which flow the user picked, since resolvePostLoginPath
// routes off the profile's real account_type after login regardless of
// which page they signed in from. accountType here only drives copy and
// the role-switch link, so candidates and recruiters never feel stuck in
// the wrong page without duplicating the form.
export default function SignIn({ accountType = "candidate" }: SignInProps) {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, signInWithGitHub, resetPasswordForEmail } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { profile } = await signInWithEmail(email, password);
      navigate(await resolvePostLoginPath(profile));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim() || resetStatus === "sending") return;
    setError("");
    setResetStatus("sending");
    try {
      await resetPasswordForEmail(email.trim());
      setResetStatus("sent");
    } catch (err) {
      setResetStatus("idle");
      setError(getAuthErrorMessage(err));
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setError("");
    try {
      await (provider === "google" ? signInWithGoogle() : signInWithGitHub());
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <AuthHeader variant={accountType === "recruiter" ? "recruiter" : undefined} />

      <main className="flex flex-1 justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-ink-soft">
              Sign in to continue growing your Grove.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
          >
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-sm font-medium text-ink"
                >
                  Email address
                </label>
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={`mt-2 ${inputClasses}`}
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-sm font-medium text-ink"
                >
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className={`mt-2 ${inputClasses}`}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={!email.trim() || resetStatus === "sending"}
                  className="text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetStatus === "sending" ? "Sending…" : "Forgot password?"}
                </button>
              </div>

              {resetStatus === "sent" && (
                <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-dark">
                  Check {email} for a link to reset your password.
                </p>
              )}

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
              {submitting ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-ink-faint">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
              >
                GitHub
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            New user?{" "}
            <Link
              to={accountType === "recruiter" ? "/recruiter/signup" : "/signup"}
              className="font-medium text-accent-dark hover:text-accent"
            >
              Sign up
            </Link>
          </p>

          <RoleSwitchLink
            prompt={
              accountType === "recruiter"
                ? "Looking for a candidate account?"
                : "Looking for a recruiter account?"
            }
            linkLabel={accountType === "recruiter" ? "Candidate Login" : "Recruiter Login"}
            to={accountType === "recruiter" ? "/signin" : "/recruiter/signin"}
          />
        </motion.div>
      </main>
    </div>
  );
}
