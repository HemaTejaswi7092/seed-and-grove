import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, TriangleAlert } from "lucide-react";
import { useAuth } from "../auth/useAuth";

function readOAuthError(): string | null {
  // Supabase/GitHub deliver OAuth failures (denied access, misconfigured
  // app, etc.) as error params on the callback URL — in the hash for the
  // implicit flow this app uses, but we check the query string too just in
  // case. The client's own session parsing swallows this internally, so we
  // read it ourselves before it's gone.
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  const description =
    hashParams.get("error_description") ||
    searchParams.get("error_description") ||
    hashParams.get("error") ||
    searchParams.get("error");

  if (!description) return null;
  return decodeURIComponent(description.replace(/\+/g, " "));
}

export default function AuthCallback() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  // Read synchronously on first render — before the SDK's own URL parsing
  // (triggered by getSession()/onAuthStateChange in AuthContext) has a
  // chance to run and strip the params out from under us.
  const [oauthError] = useState<string | null>(() => readOAuthError());

  useEffect(() => {
    if (oauthError) {
      // Clear the error out of the URL bar — never leave auth params visible.
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [oauthError]);

  useEffect(() => {
    if (oauthError) return;
    if (loading) return;

    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }

    navigate(profile?.onboarding_completed ? "/dashboard" : "/onboarding", {
      replace: true,
    });
  }, [oauthError, loading, user, profile, navigate]);

  if (oauthError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <TriangleAlert className="h-6 w-6" strokeWidth={2} />
        </span>
        <div>
          <p className="text-base font-semibold text-ink">
            Sign-in didn&apos;t complete
          </p>
          <p className="mt-1 max-w-sm text-sm text-ink-soft">{oauthError}</p>
        </div>
        <Link
          to="/signin"
          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas">
      <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Sprout className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <p className="text-sm text-ink-soft">Signing you in…</p>
    </div>
  );
}
