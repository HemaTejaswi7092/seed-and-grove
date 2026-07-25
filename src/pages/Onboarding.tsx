import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, Bot, TreeDeciduous, Briefcase, ArrowRight } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getDisplayName } from "../lib/displayName";

const steps = [
  {
    icon: Sprout,
    title: "Seed",
    description: "Plant a real project — the thing you're actually building.",
  },
  {
    icon: Bot,
    title: "Personalized AI Builder Companion",
    description:
      "It observes how you work and turns your process into structured evidence, automatically.",
  },
  {
    icon: TreeDeciduous,
    title: "Grove",
    description:
      "Every finished Seed grows your Grove — a living portfolio that speaks for itself.",
  },
  {
    icon: Briefcase,
    title: "Opportunities",
    description:
      "As your Grove grows, real opportunities that match your evidence find their way to you.",
  },
];

export default function Onboarding() {
  const { user, profile, completeOnboarding } = useAuth();
  const displayName = getDisplayName(user, profile);
  const firstName = displayName ? displayName.split(" ")[0] : "there";

  // Onboarding here is a one-time intro, not a gate — any of the three
  // actions below counts as "done with it" so the next sign-in goes
  // straight to /dashboard instead of showing this screen again.
  function finishOnboarding() {
    void completeOnboarding();
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sprout className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Seed &amp; Grove
          </span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold text-accent-dark">
            Getting started
          </p>
          <p className="mt-2 text-base font-medium text-ink">
            Welcome, {firstName}.
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            From your first Seed to a Grove that speaks for itself.
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Here&apos;s the whole loop, in four parts.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 flex w-full max-w-5xl flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-1 items-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: 0.15 + index * 0.12,
                }}
                className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-border bg-canvas-elevated px-6 py-8 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <step.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <h2 className="text-base font-semibold text-ink">
                  {step.title}
                </h2>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </motion.div>

              {index < steps.length - 1 && (
                <ArrowRight
                  className="hidden h-5 w-5 shrink-0 text-ink-faint lg:block"
                  strokeWidth={2}
                />
              )}
            </div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.55 }}
          className="mt-14 text-lg font-medium text-ink"
        >
          Every builder starts with one idea.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.65 }}
          className="mt-6 flex flex-col items-center gap-4"
        >
          <Link
            to="/dashboard"
            onClick={finishOnboarding}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            Go to Dashboard
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/seed/new"
              onClick={finishOnboarding}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas-elevated px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
            >
              🌱 Plant Your First Seed
            </Link>
            <Link
              to="/grove"
              onClick={finishOnboarding}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Explore Seed &amp; Grove
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
