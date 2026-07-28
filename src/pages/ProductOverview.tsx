import { Link } from "react-router-dom";
import {
  Sprout,
  Bot,
  TreePine,
  Briefcase,
  Rocket,
  ArrowRight,
  X,
  Check,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  Compass,
  ShieldCheck,
  Printer,
} from "lucide-react";
import "./ProductOverview.css";

// Standalone, print-optimized one-page product brief for the AI Fellowship
// submission — a real physical document (US Letter, one page), not a
// scrollable marketing page. Deliberately has no shared layout/nav: it's
// mounted directly at the top level of App.tsx's <Routes>, outside
// AuthenticatedLayout/RecruiterLayout/LandingNav, so there is no app chrome
// to hide when printing. Content is fully static (no framer-motion) —
// scroll-triggered animation libraries can leave elements at their
// `initial` (often opacity: 0) state in a print/PDF render if the
// IntersectionObserver never fires, which would silently blank out
// sections. Export via the browser's native Print dialog → Save as PDF;
// see ProductOverview.css for the @page sizing that makes that produce
// exactly one US Letter page at 100% scale.

const problemTraditional = [
  "Previous experience",
  "Job titles",
  "Static résumés",
  "Keywords",
  "Connection counts",
];

const problemEmerging = [
  "Projects",
  "Hackathons",
  "Open-source contributions",
  "AI-assisted learning",
  "Independent experimentation",
  "Online communities",
];

const flowSteps = [
  {
    icon: Sprout,
    title: "Seed",
    description: "Start an idea, project, or learning journey.",
  },
  {
    icon: Bot,
    title: "AI Mentor",
    description: "Guide decisions, suggest improvements, identify achievements.",
  },
  {
    icon: TreePine,
    title: "Grove",
    description: "Turn projects and progress into a living professional identity.",
  },
  {
    icon: Briefcase,
    title: "Recruiter",
    description: "Create AI-assisted job descriptions and discover demonstrated capability.",
  },
  {
    icon: Rocket,
    title: "Opportunity",
    description: "Internships, jobs, mentorship, collaboration.",
  },
];

const differentiators = [
  {
    icon: BadgeCheck,
    title: "Project-first identity",
    description: "Real work becomes proof of capability.",
  },
  {
    icon: TrendingUp,
    title: "Living profiles",
    description: "Identity grows alongside every project.",
  },
  {
    icon: Sparkles,
    title: "AI-supported growth",
    description: "AI mentors candidates and assists recruiters throughout the journey.",
  },
  {
    icon: Compass,
    title: "Potential over pedigree",
    description: "Opportunity is created through demonstrated capability—not only experience.",
  },
];

const comparisonRows = [
  { traditional: "Resume-first", seedAndGrove: "Project-first" },
  { traditional: "Static profile", seedAndGrove: "Living professional identity" },
  { traditional: "Skills are listed", seedAndGrove: "Skills are demonstrated" },
  {
    traditional: "Keyword discovery",
    seedAndGrove: "Meaning + evidence-based discovery",
  },
  {
    traditional: "Experience determines visibility",
    seedAndGrove: "Potential creates visibility",
  },
  {
    traditional: "Connections & popularity",
    seedAndGrove: "Growth, work & contribution",
  },
];

const aiCandidates = [
  "AI project mentorship",
  "Personalized next steps",
  "Achievement identification",
  "Evidence organization",
];

const aiRecruiters = [
  "AI-assisted job description creation",
  "Structured responsibilities and qualifications",
  "Reduced repetitive writing",
  "Future semantic candidate matching",
];

const genZPoints = [
  "Project-based learning",
  "AI as a learning partner",
  "Visible progress",
  "Community participation",
  "Authentic self-expression",
  "Mobile-first interaction",
];

const footerDifferentiators = [
  "AI-native from day one",
  "Evidence-based credibility",
  "Candidate & recruiter ecosystem",
  "Built for continuous growth",
];

const footerFuture = [
  "Semantic candidate–opportunity matching",
  "Personalized learning paths",
  "Collaborative project spaces",
  "Verified contribution-based reputation",
];

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-[9.5px] font-bold tracking-[0.09em] text-accent-dark uppercase">
      {children}
    </h2>
  );
}

export default function ProductOverview() {
  return (
    <div className="min-h-screen bg-[#e8e6dd] py-8 print:min-h-0 print:bg-white print:py-0">
      <div className="po-screen-toolbar mx-auto mb-5 flex w-[8.5in] items-center justify-between px-1 print:hidden">
        <Link
          to="/"
          className="text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← Back to Seed &amp; Grove
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          <Printer className="h-4 w-4" strokeWidth={2.25} />
          Print / Save as PDF
        </button>
      </div>

      {/* The sheet — exactly 8.5in x 11in when printed (see
          ProductOverview.css). On screen it's rendered at true physical
          size with a shadow so it previews like a document, not a webpage. */}
      <div className="po-sheet mx-auto flex flex-col bg-white p-[0.4in] text-ink shadow-[0_12px_48px_rgba(20,22,15,0.22)] print:p-[0.4in] print:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-[0.1in]">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Sprout className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="text-[13px] font-semibold tracking-tight text-ink">
              Seed &amp; Grove
            </span>
          </div>
          <span className="text-[8.5px] font-medium tracking-wide text-ink-faint uppercase">
            Product Overview — AI Fellowship Submission
          </span>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-[1.55fr_1fr] gap-[0.3in] border-b border-border py-[0.14in]">
          <div>
            <h1 className="text-[22px] leading-[1.05] font-bold tracking-tight text-ink">
              Build it. Prove it. Grow it.
            </h1>
            <p className="mt-[0.05in] text-[9.5px] leading-snug text-ink-soft">
              An AI-native platform where projects become proof, progress
              becomes identity, and potential becomes opportunity.
            </p>
            <p className="mt-[0.08in] text-[8.5px] leading-relaxed text-ink-soft">
              Seed &amp; Grove reimagines professional identity for the next
              generation. Instead of defining people by résumés, titles, or
              years of experience, it empowers people to build credibility
              through projects, continuous progress, and demonstrated
              capability.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-xl border border-accent-soft-border bg-accent-soft px-[0.14in] py-[0.1in]">
            <p className="text-center text-[13px] leading-[1.2] font-bold tracking-tight text-accent-dark">
              &ldquo;Your work should speak louder than your résumé.&rdquo;
            </p>
          </div>
        </div>

        {/* Problem */}
        <div className="grid grid-cols-[1fr_1fr_0.9fr] gap-[0.22in] border-b border-border py-[0.13in]">
          <div>
            <SectionLabel>The Problem</SectionLabel>
            <p className="mt-[0.04in] text-[8.5px] leading-snug text-ink-soft">
              Traditional platforms prioritize:
            </p>
            <ul className="mt-[0.04in] space-y-[2px]">
              {problemTraditional.map((item) => (
                <li key={item} className="flex items-center gap-[5px]">
                  <X className="h-[9px] w-[9px] shrink-0 text-ink-faint" strokeWidth={2.25} />
                  <span className="text-[8.5px] text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9.5px] font-bold text-transparent select-none">.</p>
            <p className="mt-[0.04in] text-[8.5px] leading-snug text-ink-soft">
              But emerging talent builds credibility through:
            </p>
            <ul className="mt-[0.04in] space-y-[2px]">
              {problemEmerging.map((item) => (
                <li key={item} className="flex items-center gap-[5px]">
                  <Check className="h-[9px] w-[9px] shrink-0 text-accent" strokeWidth={2.5} />
                  <span className="text-[8.5px] font-medium text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center rounded-xl border border-border bg-canvas px-[0.12in] py-[0.1in]">
            <p className="text-[8.5px] leading-relaxed text-ink-soft italic">
              Talented students and self-taught builders often have real
              capability before they have formal experience&mdash;but
              traditional professional profiles rarely make that potential
              visible.
            </p>
          </div>
        </div>

        {/* Flow diagram — the visual centerpiece */}
        <div className="border-b border-border py-[0.16in]">
          <SectionLabel>How It Works</SectionLabel>
          <div className="mt-[0.09in] grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch">
            {flowSteps.map((step, index) => {
              const isDestination = index === flowSteps.length - 1;
              return (
                <div key={step.title} className="contents">
                  <div
                    className={
                      isDestination
                        ? "flex flex-col items-center rounded-xl border-2 border-accent bg-accent-soft px-[0.06in] py-[0.1in] text-center shadow-[0_8px_22px_-12px_rgba(63,109,82,0.55)]"
                        : "flex flex-col items-center rounded-xl border border-border bg-canvas px-[0.06in] py-[0.1in] text-center shadow-[0_1px_2px_rgba(20,22,15,0.04)]"
                    }
                  >
                    <span
                      className={
                        isDestination
                          ? "flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white"
                          : "flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"
                      }
                    >
                      <step.icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <p
                      className={
                        isDestination
                          ? "mt-[0.05in] text-[9.5px] font-bold text-accent-dark"
                          : "mt-[0.05in] text-[9.5px] font-bold text-ink"
                      }
                    >
                      {step.title}
                    </p>
                    <p className="mt-[0.02in] text-[7.5px] leading-tight text-ink-soft">
                      {step.description}
                    </p>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className="flex items-center justify-center px-[0.03in]">
                      <ArrowRight className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Seed & Grove */}
        <div className="border-b border-border py-[0.13in]">
          <SectionLabel>Why Seed &amp; Grove?</SectionLabel>
          <div className="mt-[0.08in] grid grid-cols-4 gap-[0.14in]">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-canvas px-[0.1in] py-[0.09in]"
              >
                <item.icon className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
                <p className="mt-[0.04in] text-[8.5px] font-bold text-ink">
                  {item.title}
                </p>
                <p className="mt-[0.01in] text-[7.5px] leading-snug text-ink-soft">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison + AI value — side by side to use width efficiently */}
        <div className="grid grid-cols-[1.15fr_1fr] gap-[0.24in] border-b border-border py-[0.13in]">
          <div>
            <SectionLabel>Traditional Platforms vs. Seed &amp; Grove</SectionLabel>
            <div className="mt-[0.06in] overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-2 bg-canvas">
                <p className="border-r border-border px-[0.08in] py-[0.035in] text-[7.5px] font-bold tracking-wide text-ink-faint uppercase">
                  Traditional Platforms
                </p>
                <p className="px-[0.08in] py-[0.035in] text-[7.5px] font-bold tracking-wide text-accent-dark uppercase">
                  Seed &amp; Grove
                </p>
              </div>
              {comparisonRows.map((row, i) => (
                <div
                  key={row.traditional}
                  className={`grid grid-cols-2 ${i % 2 === 1 ? "bg-canvas/50" : ""}`}
                >
                  <p className="border-t border-r border-border px-[0.08in] py-[0.032in] text-[8px] text-ink-soft">
                    {row.traditional}
                  </p>
                  <p className="border-t border-border px-[0.08in] py-[0.032in] text-[8px] font-medium text-ink">
                    {row.seedAndGrove}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>AI-Native Value</SectionLabel>
            <div className="mt-[0.06in] grid grid-cols-2 gap-[0.12in]">
              <div>
                <div className="flex items-center gap-[4px]">
                  <Bot className="h-3 w-3 text-accent" strokeWidth={2.25} />
                  <p className="text-[8px] font-bold text-ink">Candidates</p>
                </div>
                <ul className="mt-[0.03in] space-y-[2px]">
                  {aiCandidates.map((item) => (
                    <li key={item} className="text-[7.5px] leading-snug text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-[4px]">
                  <Sparkles className="h-3 w-3 text-accent" strokeWidth={2.25} />
                  <p className="text-[8px] font-bold text-ink">Recruiters</p>
                </div>
                <ul className="mt-[0.03in] space-y-[2px]">
                  {aiRecruiters.map((item) => (
                    <li key={item} className="text-[7.5px] leading-snug text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-[0.08in] text-[7.5px] leading-relaxed text-ink-soft italic">
              AI is not added as a chatbot. It supports the decisions users
              make throughout their entire journey.
            </p>
          </div>
        </div>

        {/* Gen Z / Gen Alpha */}
        <div className="border-b border-border py-[0.12in]">
          <div className="flex items-center justify-between rounded-xl border border-accent-soft-border bg-accent-soft px-[0.14in] py-[0.08in]">
            <div>
              <p className="text-[10px] font-bold text-accent-dark">
                Designed for a Generation That Learns by Creating
              </p>
              <p className="mt-[0.03in] text-[8px] leading-snug text-ink-soft">
                {genZPoints.join("  ·  ")}
              </p>
            </div>
            <ShieldCheck
              className="ml-[0.14in] h-6 w-6 shrink-0 text-accent"
              strokeWidth={1.75}
            />
          </div>
          <p className="mt-[0.05in] text-[7.5px] leading-relaxed text-ink-soft">
            For younger users, identity is built around projects and
            achievements while privacy, moderation, consent, and
            age-appropriate controls protect personal information.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto grid grid-cols-[1fr_1fr_auto] items-start gap-[0.24in] pt-[0.13in]">
          <div>
            <p className="text-[8px] font-bold tracking-wide text-ink-faint uppercase">
              Key Differentiators
            </p>
            <ul className="mt-[0.03in] space-y-[1px]">
              {footerDifferentiators.map((item) => (
                <li key={item} className="flex items-start gap-[4px]">
                  <Check className="mt-[2px] h-[8px] w-[8px] shrink-0 text-accent" strokeWidth={2.5} />
                  <span className="text-[7.5px] text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[8px] font-bold tracking-wide text-ink-faint uppercase">
              Future Vision
            </p>
            <ul className="mt-[0.03in] space-y-[1px]">
              {footerFuture.map((item) => (
                <li key={item} className="flex items-start gap-[4px]">
                  <ArrowRight className="mt-[2px] h-[8px] w-[8px] shrink-0 text-accent" strokeWidth={2.5} />
                  <span className="text-[7.5px] text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex h-full flex-col items-end justify-end">
            <p className="text-[11px] font-bold tracking-tight text-ink">
              Seed &amp; Grove
            </p>
            <p className="text-[8px] font-medium text-accent-dark">
              Build it. Prove it. Grow it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
