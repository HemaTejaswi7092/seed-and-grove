import { Link } from "react-router-dom";
import { ArrowLeft, Sprout } from "lucide-react";

interface AuthHeaderProps {
  variant?: "recruiter";
}

export default function AuthHeader({ variant }: AuthHeaderProps) {
  return (
    <header className="px-6 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to Home
      </Link>
      <Link to="/" className="mt-4 flex w-fit items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Sprout className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          Seed &amp; Grove
        </span>
        {variant === "recruiter" && (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">
            Recruiter
          </span>
        )}
      </Link>
    </header>
  );
}
