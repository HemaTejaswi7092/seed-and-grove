import { motion } from "framer-motion";
import { howItWorksSteps } from "../../data/landing";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Three steps between doing the work and having something real to
            show for it.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {howItWorksSteps.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
              className="rounded-2xl border border-border bg-canvas-elevated p-7 shadow-[0_1px_2px_rgba(26,28,25,0.04)] transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(26,28,25,0.25)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-xs font-medium text-ink-faint">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
