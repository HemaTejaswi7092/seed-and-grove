import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useRecruiterProfile } from "../recruiter/useRecruiterProfile";
import { updateRecruiterProfile } from "../recruiter/recruiterStore";
import { normalizeRecruiterGroveFields } from "../recruiter/groveProfileDefaults";
import ExperienceEditor from "../components/settings/ExperienceEditor";
import EducationEditor from "../components/settings/EducationEditor";
import CertificationEditor from "../components/settings/CertificationEditor";
import CommaListInput from "../components/settings/CommaListInput";
import VideoEditor from "../components/recruiter-grove/VideoEditor";
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
} from "../types/grove";
import type { VideoEntry } from "../recruiter/types";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

// The recruiter's public professional profile editor — everything shown
// on Recruiter Grove (RecruiterGroveView.tsx) is edited here, and only
// here. Deliberately NOT in RecruiterSettings.tsx: Settings stays limited
// to account/security, Grove owns professional identity (see this
// session's ownership-model instructions). One shared draft object, one
// Save action — simpler than CandidateProfile.tsx's per-tab independent
// saves, appropriate for a single (non-tabbed) page.
export default function RecruiterGroveEditor() {
  const { user } = useAuth();
  const { recruiterProfile, loading, refresh } = useRecruiterProfile();
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [professionalBio, setProfessionalBio] = useState("");
  const [hiringPhilosophy, setHiringPhilosophy] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamOrDepartment, setTeamOrDepartment] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);
  const [hiringDomains, setHiringDomains] = useState<string[]>([]);
  const [hiringSkills, setHiringSkills] = useState<string[]>([]);
  const [hiringLevels, setHiringLevels] = useState<string[]>([]);
  const [hiringLocations, setHiringLocations] = useState<string[]>([]);
  const [videos, setVideos] = useState<VideoEntry[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Deferred a microtask so no setState call is reached synchronously in
  // the effect body itself — same fix used throughout this codebase (see
  // useRecruiterProfile.ts).
  useEffect(() => {
    if (!recruiterProfile) return;
    let cancelled = false;
    const grove = normalizeRecruiterGroveFields(recruiterProfile);
    Promise.resolve().then(() => {
      if (cancelled) return;
      setJobTitle(recruiterProfile.job_title);
      setProfessionalBio(grove.professional_bio);
      setHiringPhilosophy(grove.hiring_philosophy);
      setExperience(grove.experience);
      setEducation(grove.education);
      setCertifications(grove.certifications);
      setCompanyName(recruiterProfile.company_name);
      setIndustry(grove.industry);
      setTeamOrDepartment(grove.team_or_department);
      setCompanyDescription(grove.company_description);
      setCompanyWebsite(grove.company_website ?? "");
      setCompanyLocation(recruiterProfile.company_location ?? "");
      setCompanyLogoUrl(recruiterProfile.company_logo_url ?? "");
      setHiringRoles(recruiterProfile.hiring_roles);
      setHiringDomains(grove.hiring_domains);
      setHiringSkills(grove.hiring_skills);
      setHiringLevels(grove.hiring_levels);
      setHiringLocations(recruiterProfile.hiring_locations);
      setVideos(grove.videos);
    });
    return () => {
      cancelled = true;
    };
  }, [recruiterProfile]);

  if (!user) return null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateRecruiterProfile(user!.id, {
        job_title: jobTitle.trim(),
        professional_bio: professionalBio.trim(),
        hiring_philosophy: hiringPhilosophy.trim(),
        experience,
        education,
        certifications,
        company_name: companyName.trim(),
        industry: industry.trim(),
        team_or_department: teamOrDepartment.trim(),
        company_description: companyDescription.trim(),
        company_website: companyWebsite.trim() || null,
        company_location: companyLocation.trim() || null,
        company_logo_url: companyLogoUrl.trim() || null,
        hiring_roles: hiringRoles,
        hiring_domains: hiringDomains,
        hiring_skills: hiringSkills,
        hiring_levels: hiringLevels,
        hiring_locations: hiringLocations,
        videos,
      });
      refresh();
      showToast("Grove updated");
      navigate("/recruiter/grove");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your Grove.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Edit Grove</h1>
      <p className="mt-2 text-ink-soft">
        Your public professional profile — how candidates and other
        recruiters see you.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
          <p className="text-sm text-ink-faint">Loading…</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-8 space-y-8">
          <div className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Hero
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Professional title
              </span>
              <input
                className={`mt-1.5 ${inputClasses}`}
                placeholder="e.g. Senior Technical Recruiter"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              About
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Professional bio
              </span>
              <textarea
                rows={4}
                className={`mt-1.5 resize-none ${inputClasses}`}
                placeholder="A short introduction candidates will see first."
                value={professionalBio}
                onChange={(e) => setProfessionalBio(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Hiring philosophy
              </span>
              <textarea
                rows={3}
                className={`mt-1.5 resize-none ${inputClasses}`}
                placeholder="What you look for, or how you approach hiring."
                value={hiringPhilosophy}
                onChange={(e) => setHiringPhilosophy(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Professional Background
            </p>
            <div>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Experience
              </p>
              <div className="mt-3">
                <ExperienceEditor entries={experience} onChange={setExperience} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Education
              </p>
              <div className="mt-3">
                <EducationEditor entries={education} onChange={setEducation} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Certifications
              </p>
              <div className="mt-3">
                <CertificationEditor entries={certifications} onChange={setCertifications} />
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Current Company
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Company name
              </span>
              <input
                className={`mt-1.5 ${inputClasses}`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Industry
                </span>
                <input
                  className={`mt-1.5 ${inputClasses}`}
                  placeholder="e.g. Healthcare Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Team / department
                </span>
                <input
                  className={`mt-1.5 ${inputClasses}`}
                  placeholder="e.g. Talent Acquisition"
                  value={teamOrDepartment}
                  onChange={(e) => setTeamOrDepartment(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Company description
              </span>
              <textarea
                rows={3}
                className={`mt-1.5 resize-none ${inputClasses}`}
                placeholder="A short description of the company."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Website
                </span>
                <input
                  type="url"
                  className={`mt-1.5 ${inputClasses}`}
                  placeholder="https://..."
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Location
                </span>
                <input
                  className={`mt-1.5 ${inputClasses}`}
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Logo URL
              </span>
              <input
                type="url"
                className={`mt-1.5 ${inputClasses}`}
                placeholder="https://..."
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Hiring Interests
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Roles you recruit for
              </span>
              <CommaListInput
                value={hiringRoles}
                onChange={setHiringRoles}
                placeholder="Data Analyst, Backend Engineer"
                className={`mt-1.5 ${inputClasses}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Professional domains
              </span>
              <CommaListInput
                value={hiringDomains}
                onChange={setHiringDomains}
                placeholder="Healthcare, Fintech"
                className={`mt-1.5 ${inputClasses}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Skills or industries you follow
              </span>
              <CommaListInput
                value={hiringSkills}
                onChange={setHiringSkills}
                placeholder="SQL, Machine Learning"
                className={`mt-1.5 ${inputClasses}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Hiring levels
              </span>
              <CommaListInput
                value={hiringLevels}
                onChange={setHiringLevels}
                placeholder="Internship, New Grad, Mid Level"
                className={`mt-1.5 ${inputClasses}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                Hiring locations
              </span>
              <CommaListInput
                value={hiringLocations}
                onChange={setHiringLocations}
                placeholder="Remote, Austin TX"
                className={`mt-1.5 ${inputClasses}`}
              />
            </label>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-canvas-elevated p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-accent-dark uppercase">
              Featured Videos
            </p>
            <VideoEditor entries={videos} onChange={setVideos} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Grove"}
            </button>
          </div>
        </form>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
