import type { Session, User } from "@supabase/supabase-js";

export type AccountType = "candidate" | "recruiter";

export interface Profile {
  id: string;
  full_name: string | null;
  onboarding_completed: boolean;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  // accountType defaults to "candidate" — every existing call site (the
  // candidate SignUp page) is unaffected by this addition. Only recruiter
  // signup passes "recruiter" explicitly. This is still the one Supabase
  // auth system, not a second stack — see supabase/recruiter_accounts.sql.
  signUpWithEmail: (
    fullName: string,
    email: string,
    password: string,
    accountType?: AccountType,
  ) => Promise<{ user: User | null; session: Session | null }>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ user: User; session: Session; profile: Profile | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateFullName: (fullName: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}
