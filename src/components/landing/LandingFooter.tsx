import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sprout className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Seed &amp; Grove
          </span>
        </Link>
        <p className="text-xs text-ink-faint">
          © 2026 Seed &amp; Grove. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
