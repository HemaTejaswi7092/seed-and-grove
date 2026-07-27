import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getDisplayName } from "../lib/displayName";
import { createFeedPost } from "../state/feedStore";
import { generateCompanyPost, type CompanyPostType } from "../services/ai/generateRecruiterContent";
import type { CreateFeedPostInput } from "../types/feed";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

const POST_TYPE_OPTIONS: { value: CompanyPostType; label: string }[] = [
  { value: "company_award", label: "Company Award" },
  { value: "hiring_announcement", label: "Hiring Announcement" },
  { value: "team_achievement", label: "Team Achievement" },
  { value: "industry_update", label: "Industry Update" },
  { value: "company_news", label: "Company News" },
];

// A recruiter's version of Seed.tsx's "share to feed" flow — same
// underlying feed_posts write via createFeedPost, but starting from an
// AI-generated draft instead of a Seed's own activity. "AI drafts, human
// confirms": the caption is always editable before Publish, and generation
// is a fully separate step from publishing (see generate-recruiter-content
// Edge Function's header comment).
export default function RecruiterPostComposer() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [postType, setPostType] = useState<CompanyPostType>("company_news");
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const draft = await generateCompanyPost(postType, prompt.trim());
      setCaption(draft.caption);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate a draft.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !caption.trim()) return;
    setSubmitting(true);
    setError(null);

    const input: CreateFeedPostInput = {
      seed_id: null,
      evidence_id: null,
      post_type: postType,
      caption: caption.trim(),
      author_name: getDisplayName(user, profile) || "A recruiter",
      author_account_type: "recruiter",
      project_title: null,
      achievement_title: null,
      evidence_summary: null,
      skills: [],
      visibility: "public",
    };

    try {
      await createFeedPost(user.id, input);
      navigate("/recruiter/grove");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't publish this post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Draft a Company Post
        </h1>
        <p className="mt-2 text-ink-soft">
          Share a company award, hiring update, team milestone, or industry
          news to your Grove and the shared Feed.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="post-type" className="block text-sm font-medium text-ink">
              Post category
            </label>
            <select
              id="post-type"
              value={postType}
              onChange={(event) => setPostType(event.target.value as CompanyPostType)}
              className={`mt-2 ${inputClasses}`}
            >
              {POST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-accent-soft-border bg-accent-soft p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" strokeWidth={2.25} />
              <p className="text-sm font-semibold text-ink">Generate with AI</p>
            </div>
            <label htmlFor="post-prompt" className="mt-3 block text-sm font-medium text-ink">
              What happened?
            </label>
            <textarea
              id="post-prompt"
              rows={3}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. Our team just shipped v2 of the onboarding flow, cutting setup time in half."
              className={`mt-2 resize-none bg-canvas-elevated ${inputClasses}`}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Generating…" : "Generate with AI"}
            </button>
          </div>

          <div>
            <label htmlFor="post-caption" className="block text-sm font-medium text-ink">
              Caption
            </label>
            <textarea
              id="post-caption"
              required
              rows={4}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Write your own, or generate a draft above — either way, review before publishing."
              className={`mt-2 resize-none ${inputClasses}`}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !caption.trim()}
          className="mt-7 w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Publishing…" : "Publish"}
        </button>
      </form>
    </main>
  );
}
