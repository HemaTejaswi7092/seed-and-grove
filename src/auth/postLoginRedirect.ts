import { getRecruiterProfile } from "../recruiter/recruiterStore";
import type { Profile } from "./types";

// The one place that decides where an authenticated user lands —
// SignIn.tsx and AuthCallback.tsx both call this instead of each
// hardcoding their own branching, so candidate and recruiter routing
// can never drift apart between the two entry points.
export async function resolvePostLoginPath(
  profile: Profile | null,
): Promise<string> {
  if (!profile) return "/onboarding";

  if (profile.account_type === "recruiter") {
    // No recruiter_profiles row yet means either: this is their first
    // login after confirming an email that was required before company
    // info (Step 2/3) could be written, or something else interrupted
    // signup. Either way, /recruiter/signup itself detects "authenticated
    // but no recruiter profile yet" and resumes at Step 2 — never Step 1
    // again, since the account already exists.
    const recruiterProfile = await getRecruiterProfile(profile.id);
    return recruiterProfile ? "/recruiter/dashboard" : "/recruiter/signup";
  }

  return profile.onboarding_completed ? "/dashboard" : "/onboarding";
}
