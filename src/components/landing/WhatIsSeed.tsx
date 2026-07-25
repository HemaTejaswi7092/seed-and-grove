import { motion } from "framer-motion";
import { Sprout, GitCommit, Bot, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: GitCommit,
    title: "Captured as you go",
    description:
      "Every commit, decision, and course-correction is logged automatically as you build.",
  },
  {
    icon: Bot,
    title: "An AI that's actually watching",
    description:
      "Your companion asks the right questions and turns raw effort into structured evidence.",
  },
  {
    icon: ShieldCheck,
    title: "No extra work",
    description: "You keep building. Seed & Grove keeps the record.",
  },
];

export default function WhatIsSeed() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sprout className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-accent-dark">
            What is Seed?
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Seed is where real work becomes a record.
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Every Seed starts with an actual project — a build, a case
            study, a problem worth solving. From the moment you start,
            Seed &amp; Grove is there, quietly capturing your decisions,
            iterations, and the reasoning behind them.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: index * 0.1,
              }}
              className="rounded-2xl border border-border bg-canvas-elevated p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <feature.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
