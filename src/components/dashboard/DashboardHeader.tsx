import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { getDisplayName } from "../../lib/displayName";

export default function DashboardHeader() {
  const { user, profile } = useAuth();
  const displayName = getDisplayName(user, profile) || "there";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2 text-lg text-ink-soft">
          Keep building — your Grove is growing.
        </p>
      </div>
      <Link
        to="/seed/new"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
      >
        🌱 Plant a New Seed
      </Link>
    </div>
  );
}
