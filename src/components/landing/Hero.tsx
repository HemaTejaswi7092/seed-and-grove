import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, User, Briefcase } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-8 text-center sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-accent-soft-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
          AI-native professional identity
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
          className="text-4xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-6xl"
        >
          Your work becomes your professional identity.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft"
        >
          Seed &amp; Grove captures how you build, solve problems, and make
          decisions—then transforms that journey into credible professional
          evidence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
          className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-border bg-canvas-elevated p-6 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <User className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <p className="mt-3 text-base font-semibold text-ink">
              I&apos;m a Candidate
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Build a Grove from your real, demonstrated work.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/signin"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
              >
                Sign Up
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-canvas-elevated p-6 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-soft/10 text-ink">
              <Briefcase className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <p className="mt-3 text-base font-semibold text-ink">
              I&apos;m a Recruiter
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Post roles and discover evidence-backed candidates.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/recruiter/signin"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
              >
                Recruiter Login
              </Link>
              <Link
                to="/recruiter/signup"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink-800"
              >
                Recruiter Sign Up
              </Link>
            </div>
          </div>
        </motion.div>

        <Link
          to="/grove"
          className="mt-6 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          Explore Grove
        </Link>
      </div>
    </section>
  );
}
