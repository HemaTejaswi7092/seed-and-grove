import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./context";
import type { AccountType, Profile } from "./types";

async function loadOrCreateProfile(authUser: User): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!error && data) {
    return data as Profile;
  }

  // The database trigger (see supabase/setup.sql) should already have
  // created this row. Upsert defensively in case it hasn't run yet —
  // e.g. a race right after sign-up, or the trigger not installed. GitHub
  // OAuth doesn't always populate `full_name`, so fall back to `name` too.
  const metadata = authUser.user_metadata as
    | { full_name?: string; name?: string }
    | undefined;
  const fullName = metadata?.full_name ?? metadata?.name ?? null;

  const { data: upserted } = await supabase
    .from("profiles")
    .upsert({ id: authUser.id, full_name: fullName })
    .select()
    .maybeSingle();

  return (upserted as Profile | null) ?? null;
}

type OAuthProvider = "google" | "github";

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
};

// Supabase's /authorize endpoint redirects straight to the provider when
// it's enabled, but when it isn't, it responds with a direct JSON error
// instead of redirecting — and signInWithOAuth() itself never surfaces
// that, because it just does window.location.assign(url) and can't know
// what the server will do. So we probe the same URL ourselves first with
// a manual-redirect fetch, purely to *detect* that specific failure ahead
// of time. The probe is advisory only: any ambiguous or failed probe
// (network hiccup, CORS, unrecognized response) falls through to the
// normal, unmodified signInWithOAuth call rather than blocking sign-in.
async function probeProviderEnabled(
  provider: OAuthProvider,
  redirectTo: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return null;

    const response = await fetch(data.url, { redirect: "manual" });
    if (response.type === "opaqueredirect" || response.status < 400) {
      return null;
    }

    const body: { msg?: string; message?: string } | null = await response
      .json()
      .catch(() => null);
    const reason = body?.msg ?? body?.message ?? "";

    if (/provider is not enabled|unsupported provider/i.test(reason)) {
      return `${PROVIDER_LABEL[provider]} sign-in has not been configured yet.`;
    }
    return null;
  } catch {
    return null;
  }
}

async function startOAuthSignIn(provider: OAuthProvider) {
  const redirectTo = `${window.location.origin}/auth/callback`;

  const blockedReason = await probeProviderEnabled(provider, redirectTo);
  if (blockedReason) {
    throw new Error(blockedReason);
  }

  // The real, unmodified call — matches the required shape exactly.
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function applySession(nextSession: Session | null) {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        const nextProfile = await loadOrCreateProfile(nextSession.user);
        if (isMounted) setProfile(nextProfile);
      } else {
        setProfile(null);
      }
      if (isMounted) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Email/password auth. account_type rides in the same signUp() call as
  // full_name — the handle_new_user() trigger (see
  // supabase/recruiter_accounts.sql) reads it off auth.users' metadata the
  // moment the row is created, which happens immediately regardless of
  // whether email confirmation gates session issuance. That's what lets a
  // recruiter be correctly marked as one even before they confirm.
  async function signUpWithEmail(
    fullName: string,
    email: string,
    password: string,
    accountType: AccountType = "candidate",
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, account_type: accountType } },
    });
    if (error) throw error;
    // If email confirmation is required, Supabase returns a user but no
    // session yet — the caller checks for that and shows a "check your
    // email" message instead of navigating in.
    return { user: data.user, session: data.session };
  }

  async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const nextProfile = await loadOrCreateProfile(data.user);
    setProfile(nextProfile);
    return { user: data.user, session: data.session, profile: nextProfile };
  }

  async function signInWithGoogle() {
    await startOAuthSignIn("google");
  }

  async function signInWithGitHub() {
    await startOAuthSignIn("github");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  // Requires an active session — Supabase validates the new password
  // against the project's password policy server-side; that error (e.g.
  // "too short") surfaces to the caller as-is. No current-password
  // re-entry needed, same as Supabase's own recommended flow, since this
  // only works with an already-authenticated session.
  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  // For someone who can't sign in at all (forgot their password) — sends
  // a reset-link email; distinct from updatePassword above, which is for
  // an already-signed-in user changing their password from Profile.
  async function resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  }

  async function completeOnboarding() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id)
      .select()
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }

  async function updateFullName(fullName: string) {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) setProfile(data as Profile);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        completeOnboarding,
        updateFullName,
        updatePassword,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
