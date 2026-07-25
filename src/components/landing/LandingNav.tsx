import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sprout, Menu, X } from "lucide-react";

const anchorLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sprout className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Seed &amp; Grove
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {anchorLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/grove"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Explore Grove
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/signin"
            className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:block"
          >
            Sign In
          </Link>
          <Link
            to="/signin"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark md:block"
          >
            Get Started
          </Link>
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
              {anchorLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/grove"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
              >
                Explore Grove
              </Link>
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Link
                  to="/signin"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
                >
                  Sign In
                </Link>
                <Link
                  to="/signin"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
