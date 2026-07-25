// Centralized mapping from raw Supabase Auth errors to messages a visitor
// can actually act on. Keeps error copy in one place instead of scattered
// across the sign-up/sign-in forms.
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("user already")
    ) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (message.includes("invalid login credentials")) {
      return "Incorrect email or password.";
    }
    if (message.includes("email not confirmed")) {
      return "Please confirm your email before signing in — check your inbox.";
    }
    if (message.includes("password") && /\d+ characters?/.test(message)) {
      return error.message;
    }
    if (
      message.includes("invalid email") ||
      message.includes("unable to validate email")
    ) {
      return "That doesn't look like a valid email address.";
    }
    if (message.includes("failed to fetch") || message.includes("network")) {
      return "Network error — check your connection and try again.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
