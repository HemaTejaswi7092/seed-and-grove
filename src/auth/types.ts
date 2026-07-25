import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUpWithEmail: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ user: User | null; session: Session | null }>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ user: User; session: Session; profile: Profile | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}
