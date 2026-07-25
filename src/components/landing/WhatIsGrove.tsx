import { motion } from "framer-motion";
import { TreeDeciduous, TrendingUp, ShieldCheck, Share2 } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Always growing",
    description:
      "Every finished Seed adds to Grove automatically — no re-writing your story from scratch.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, not self-reported",
    description:
      "Every claim in your Grove traces back to real evidence, not a bullet point you wrote yourself.",
  },
  {
    icon: Share2,
    title: "Built to be shared",
    description:
      "Send a link. Let the work speak — to recruiters, collaborators, or future you.",
  },
];

export default function WhatIsGrove() {
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
            <TreeDeciduous className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-accent-dark">
            What is Grove?
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Grove is what your Seeds grow into.
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            As your Seeds mature, Grove becomes a living, evolving record of
            what you&apos;ve built and how you think — the kind of evidence a
            resume can&apos;t fake and a portfolio site can&apos;t keep up to
            date.
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
