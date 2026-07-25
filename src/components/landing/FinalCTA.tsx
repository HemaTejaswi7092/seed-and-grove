import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="bg-dot-grid relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ink-950 px-8 py-20 text-center sm:px-16"
        style={{ backgroundBlendMode: "soft-light" }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 -top-24 mx-auto h-64 w-64 rounded-full bg-accent/30 blur-3xl"
        />
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start building a story that's actually yours.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
            Join builders who are done writing resumes and ready to start
            showing their work.
          </p>
          <div className="mt-9">
            <Link
              to="/signin"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-ink-950 shadow-lg transition-colors hover:bg-accent-soft"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
