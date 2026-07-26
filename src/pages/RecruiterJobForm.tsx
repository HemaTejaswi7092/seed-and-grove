import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { getJob, createJob, updateJob } from "../recruiter/recruiterStore";
import { parseCommaList } from "../recruiter/parseCommaList";
import type { EmploymentType, JobInput, JobStatus, WorkMode } from "../recruiter/types";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

// One page handles both Create and Edit (mirrors SeedNew.tsx's full-page-
// form pattern) — presence of :jobId in the route is the only difference.
// No AI extraction from a pasted description yet — every field is typed
// in directly.
export default function RecruiterJobForm() {
  const { jobId } = useParams<{ jobId?: string }>();
  const isEditMode = !!jobId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full_time");
  const [workMode, setWorkMode] = useState<WorkMode>("remote");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [education, setEducation] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState("");
  const [status, setStatus] = useState<JobStatus>("draft");

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !user || !jobId) return;
    let cancelled = false;
    getJob(user.id, jobId)
      .then((job) => {
        if (cancelled) return;
        if (!job) {
          navigate("/recruiter/jobs", { replace: true });
          return;
        }
        setTitle(job.title);
        setLocation(job.location ?? "");
        setEmploymentType(job.employment_type);
        setWorkMode(job.work_mode);
        setDescription(job.description);
        setRequiredSkills(job.required_skills.join(", "));
        setPreferredSkills(job.preferred_skills.join(", "));
        setExperienceLevel(job.experience_level ?? "");
        setEducation(job.education ?? "");
        setWorkAuthorization(job.work_authorization ?? "");
        setStatus(job.status);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load this job.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, user, jobId, navigate]);

  if (!user) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const input: JobInput = {
      title: title.trim(),
      location: location.trim() || null,
      employment_type: employmentType,
      work_mode: workMode,
      description: description.trim(),
      required_skills: parseCommaList(requiredSkills),
      preferred_skills: parseCommaList(preferredSkills),
      experience_level: experienceLevel.trim() || null,
      education: education.trim() || null,
      work_authorization: workAuthorization.trim() || null,
      status,
    };

    try {
      if (isEditMode && jobId) {
        await updateJob(jobId, input);
      } else {
        await createJob(user.id, input);
      }
      navigate("/recruiter/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this job.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl items-center justify-center px-6 py-24">
        <p className="text-sm text-ink-faint">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {isEditMode ? "Edit Job" : "Post a Job"}
        </h1>
        <p className="mt-2 text-ink-soft">
          {isEditMode
            ? "Update the role's details."
            : "Describe the role — candidates will be matched to it once discovery launches."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-ink">
              Title
            </label>
            <input
              id="job-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Senior Backend Engineer"
              className={`mt-2 ${inputClasses}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="job-location" className="block text-sm font-medium text-ink">
                Location
              </label>
              <input
                id="job-location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Austin, TX"
                className={`mt-2 ${inputClasses}`}
              />
            </div>
            <div>
              <label htmlFor="job-work-mode" className="block text-sm font-medium text-ink">
                Remote / Hybrid / Onsite
              </label>
              <select
                id="job-work-mode"
                value={workMode}
                onChange={(event) => setWorkMode(event.target.value as WorkMode)}
                className={`mt-2 ${inputClasses}`}
              >
                {WORK_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="job-employment-type" className="block text-sm font-medium text-ink">
                Employment type
              </label>
              <select
                id="job-employment-type"
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
                className={`mt-2 ${inputClasses}`}
              >
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="job-status" className="block text-sm font-medium text-ink">
                Status
              </label>
              <select
                id="job-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as JobStatus)}
                className={`mt-2 ${inputClasses}`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-ink">
              Description
            </label>
            <textarea
              id="job-description"
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this role owns, and what a great first six months looks like."
              className={`mt-2 resize-none ${inputClasses}`}
            />
          </div>

          <div>
            <label htmlFor="job-required-skills" className="block text-sm font-medium text-ink">
              Required skills{" "}
              <span className="text-ink-faint">(comma-separated)</span>
            </label>
            <input
              id="job-required-skills"
              type="text"
              value={requiredSkills}
              onChange={(event) => setRequiredSkills(event.target.value)}
              placeholder="Python, PostgreSQL, System Design"
              className={`mt-2 ${inputClasses}`}
            />
          </div>

          <div>
            <label htmlFor="job-preferred-skills" className="block text-sm font-medium text-ink">
              Preferred skills{" "}
              <span className="text-ink-faint">(comma-separated, optional)</span>
            </label>
            <input
              id="job-preferred-skills"
              type="text"
              value={preferredSkills}
              onChange={(event) => setPreferredSkills(event.target.value)}
              placeholder="Kubernetes, Rust"
              className={`mt-2 ${inputClasses}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="job-experience" className="block text-sm font-medium text-ink">
                Experience level{" "}
                <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="job-experience"
                type="text"
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
                placeholder="3+ years"
                className={`mt-2 ${inputClasses}`}
              />
            </div>
            <div>
              <label htmlFor="job-education" className="block text-sm font-medium text-ink">
                Education{" "}
                <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="job-education"
                type="text"
                value={education}
                onChange={(event) => setEducation(event.target.value)}
                placeholder="No degree required"
                className={`mt-2 ${inputClasses}`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-work-authorization" className="block text-sm font-medium text-ink">
              Work authorization{" "}
              <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="job-work-authorization"
              type="text"
              value={workAuthorization}
              onChange={(event) => setWorkAuthorization(event.target.value)}
              placeholder="Must be authorized to work in the US"
              className={`mt-2 ${inputClasses}`}
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
          disabled={submitting}
          className="mt-7 w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : isEditMode ? "Save changes" : "Post Job"}
        </button>
      </form>
    </main>
  );
}
