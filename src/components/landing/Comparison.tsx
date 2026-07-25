import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { comparisonRows } from "../../data/landing";

export default function Comparison() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Not another profile to fill out
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Traditional platforms ask you to describe your work. Seed &amp;
            Grove shows it.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-2xl border border-border bg-canvas-elevated p-8"
          >
            <h3 className="text-sm font-semibold text-ink-faint">
              Traditional Platforms
            </h3>
            <ul className="mt-6 space-y-5">
              {comparisonRows.map((row) => (
                <li key={row.label} className="flex gap-3">
                  <X
                    className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="text-xs text-ink-faint">{row.label}</p>
                    <p className="text-sm text-ink-soft">{row.traditional}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="rounded-2xl border-2 border-accent bg-accent-soft/50 p-8 shadow-[0_20px_50px_-25px_rgba(63,109,82,0.5)]"
          >
            <h3 className="text-sm font-semibold text-accent-dark">
              Seed &amp; Grove
            </h3>
            <ul className="mt-6 space-y-5">
              {comparisonRows.map((row) => (
                <li key={row.label} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.25}
                  />
                  <div>
                    <p className="text-xs text-accent-dark/70">{row.label}</p>
                    <p className="text-sm font-medium text-ink">
                      {row.seedAndGrove}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
