import type { User } from "@supabase/supabase-js";
import type { Profile } from "../auth/types";

// Centralized name-resolution fallback so every screen agrees on how to
// greet the authenticated user: our own profile row first (fastest and
// most likely to be right), then whatever the OAuth/email provider gave
// us in user_metadata (GitHub in particular doesn't always set full_name),
// then the email as a last resort. Never a mock name.
export function getDisplayName(
  user: User | null | undefined,
  profile: Profile | null | undefined,
): string {
  const metadata = user?.user_metadata as
    | { full_name?: string; name?: string }
    | undefined;

  return (
    profile?.full_name?.trim() ||
    metadata?.full_name?.trim() ||
    metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    ""
  );
}
