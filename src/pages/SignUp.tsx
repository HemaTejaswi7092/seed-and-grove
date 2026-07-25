import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, Sprout } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getAuthErrorMessage } from "../auth/authErrors";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

export default function SignUp() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle, signInWithGitHub } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { session } = await signUpWithEmail(name, email, password);
      if (session) {
        navigate("/onboarding");
      } else {
        // Email confirmation is required — no session yet.
        setConfirmationSent(true);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
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
      <header className="flex items-center px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sprout className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Seed &amp; Grove
          </span>
        </Link>
      </header>

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
                We sent a confirmation link to <strong>{email}</strong>.
                Follow it to activate your account, then sign in.
              </p>
              <Link
                to="/signin"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Create your account
                </h1>
                <p className="mt-2 text-ink-soft">
                  Start planting Seeds and growing your Grove.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
              >
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-sm font-medium text-ink"
                    >
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Jordan Lee"
                      className={`mt-2 ${inputClasses}`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-sm font-medium text-ink"
                    >
                      Email address
                    </label>
                    <input
                      id="signup-email"
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
                      htmlFor="signup-password"
                      className="block text-sm font-medium text-ink"
                    >
                      Password
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className={`mt-2 ${inputClasses}`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-confirm"
                      className="block text-sm font-medium text-ink"
                    >
                      Confirm password
                    </label>
                    <input
                      id="signup-confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="••••••••"
                      className={`mt-2 ${inputClasses}`}
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
                  {submitting ? "Creating account…" : "Create Account"}
                </button>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-ink-faint">
                    or continue with
                  </span>
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
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="font-medium text-accent-dark hover:text-accent"
                >
                  Sign In
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
