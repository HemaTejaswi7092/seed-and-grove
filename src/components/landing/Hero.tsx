import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

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
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            to="/signin"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/grove"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas-elevated px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
          >
            Explore Grove
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
