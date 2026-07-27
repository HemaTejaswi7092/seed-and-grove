import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sprout, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getInitials } from "../lib/initials";
import { getDisplayName } from "../lib/displayName";

// "Seed" is the recruiter's private workspace (still served at the
// /recruiter/dashboard URL — only the nav label changed, see App.tsx's
// comment on why), "Grove" their public professional profile, "Feed" the
// shared candidate+recruiter activity stream. No Shortlists/pipeline
// items — this is not an ATS. Candidate discovery lives in the Feed +
// per-job matching, not as a standalone "Candidates" destination.
const links = [
  { label: "Seed", to: "/recruiter/dashboard" },
  { label: "Jobs", to: "/recruiter/jobs" },
  { label: "Feed", to: "/recruiter/feed" },
  { label: "Grove", to: "/recruiter/grove" },
  { label: "Settings", to: "/recruiter/settings" },
];

export default function RecruiterNav() {
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = getInitials(getDisplayName(user, profile));

  async function handleSignOut() {
    setAvatarOpen(false);
    setOpen(false);
    await signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/recruiter/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sprout className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Seed &amp; Grove
          </span>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">
            Recruiter
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-accent-dark"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setAvatarOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={avatarOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {initials}
            </button>

            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-canvas-elevated py-1.5 shadow-[0_12px_32px_-16px_rgba(26,28,25,0.35)]"
                >
                  <p className="truncate px-3 py-1.5 text-xs text-ink-faint">
                    {user?.email}
                  </p>
                  <Link
                    to="/recruiter/settings"
                    onClick={() => setAvatarOpen(false)}
                    className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={2} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent-soft text-accent-dark"
                        : "text-ink-soft hover:bg-accent-soft hover:text-ink",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 flex items-center gap-2 rounded-lg border-t border-border px-3 pt-4 text-left text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
