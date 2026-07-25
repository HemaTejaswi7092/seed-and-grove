import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/useAuth";
import { createSeed } from "../state/seedStore";

const stages = ["Idea", "Planning", "Building", "Scaling"] as const;

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

export default function SeedNew() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [stage, setStage] = useState<(typeof stages)[number]>("Idea");
  const [technologies, setTechnologies] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Mock creation — Seeds aren't in the backend yet (see state/seedStore.ts).
    // Each submission creates its own isolated Seed record for this user,
    // never overwriting or reusing another Seed's data.
    if (!user) return;
    const seed = createSeed(user.id, {
      name,
      goal,
      stage,
      technologies,
      description,
    });
    await completeOnboarding();
    navigate(`/seeds/${seed.id}`);
  }

  return (
    <main className="flex justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            What are you growing today?
          </h1>
          <p className="mt-2 text-ink-soft">
            Every Seed starts with a real project. Tell your companion what
            you&apos;re building.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="seed-name"
                className="block text-sm font-medium text-ink"
              >
                Seed or project name
              </label>
              <input
                id="seed-name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Nightingale, Atlas, Fieldnote"
                className={`mt-2 ${inputClasses}`}
              />
            </div>

            <div>
              <label
                htmlFor="seed-goal"
                className="block text-sm font-medium text-ink"
              >
                What is your goal?
              </label>
              <textarea
                id="seed-goal"
                required
                rows={2}
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="What are you hoping to build, learn, or prove?"
                className={`mt-2 resize-none ${inputClasses}`}
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-ink">
                Current stage
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {stages.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStage(option)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      stage === option
                        ? "border-accent bg-accent text-white"
                        : "border-border text-ink-soft hover:border-ink-faint",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="seed-tech"
                className="block text-sm font-medium text-ink"
              >
                Preferred technologies
              </label>
              <input
                id="seed-tech"
                type="text"
                value={technologies}
                onChange={(event) => setTechnologies(event.target.value)}
                placeholder="e.g. Python, React, PyTorch"
                className={`mt-2 ${inputClasses}`}
              />
            </div>

            <div>
              <label
                htmlFor="seed-description"
                className="block text-sm font-medium text-ink"
              >
                Short description{" "}
                <span className="text-ink-faint">(optional)</span>
              </label>
              <textarea
                id="seed-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add any extra context for your AI companion."
                className={`mt-2 resize-none ${inputClasses}`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            🌱 Plant Seed
          </button>
        </form>
      </motion.div>
    </main>
  );
}
