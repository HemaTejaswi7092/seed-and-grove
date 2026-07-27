import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getDisplayName } from "../lib/displayName";
import {
  getCandidateProfile,
  buildCandidateProfilePatch,
  updateCandidateProfileFields,
  candidateRowToFields,
} from "../state/candidateProfileStore";
import { EMPTY_GROVE_PROFILE_FIELDS } from "../lib/groveProfile";
import { useUnsavedChangesGuard } from "../lib/useUnsavedChangesGuard";
import ProfessionalProfileSection from "../components/settings/ProfessionalProfileSection";
import CareerPreferencesSection from "../components/settings/CareerPreferencesSection";
import PublicLinksSection from "../components/settings/PublicLinksSection";
import AccountSecuritySection from "../components/settings/AccountSecuritySection";
import type { GroveProfileFields } from "../types/grove";

type SectionKey = "professional" | "career" | "links" | "security";
type SectionStatus = "idle" | "saving" | "error";

const TABS: { key: SectionKey; label: string }[] = [
  { key: "professional", label: "Professional Profile" },
  { key: "career", label: "Career Preferences" },
  { key: "links", label: "Public Links and Contact" },
  { key: "security", label: "Account Security" },
];

// Comparable (JSON-serializable) slices of GroveProfileFields, one per
// section — used only to answer "is this section dirty," never sent to
// the server directly (buildCandidateProfilePatch + a snake_case key
// list below does that). Kept as explicit slice functions rather than a
// generic path-picker so each section's exact field ownership stays easy
// to read in one place.
function professionalSlice(f: GroveProfileFields) {
  return {
    avatarUrl: f.avatarUrl,
    headline: f.headline,
    professionalSummary: f.professionalSummary,
    location: f.location,
    education: f.education,
    experience: f.experience,
    certifications: f.certifications,
    professionalSkills: f.professionalSkills,
  };
}

function careerSlice(f: GroveProfileFields) {
  return {
    openToOpportunities: f.opportunities.openToOpportunities,
    rolesOfInterest: f.opportunities.rolesOfInterest,
    collaborationInterests: f.opportunities.collaborationInterests,
    areasOfInterest: f.areasOfInterest,
    availability: f.availability,
    preferredJobTypes: f.preferredJobTypes,
    workMode: f.opportunities.workMode,
    availabilityDate: f.availabilityDate,
    preferredLocations: f.preferredLocations,
    workAuthorization: f.workAuthorization,
    yearsOfExperience: f.yearsOfExperience,
    requiresSponsorship: f.requiresSponsorship,
  };
}

function linksSlice(f: GroveProfileFields) {
  return {
    contactVisible: f.opportunities.contactVisible,
    contactEmail: f.opportunities.contactEmail,
    resumeUrl: f.resumeUrl,
    resumeVisible: f.resumeVisible,
    linkedinUrl: f.linkedinUrl,
    githubUrl: f.githubUrl,
    portfolioUrl: f.portfolioUrl,
    websiteUrl: f.websiteUrl,
  };
}

const PROFESSIONAL_DB_KEYS = [
  "avatar_url",
  "headline",
  "bio",
  "location",
  "education",
  "experience",
  "certifications",
  "professional_skills",
] as const;

const CAREER_DB_KEYS = [
  "open_to_opportunities",
  "roles_of_interest",
  "collaboration_interests",
  "about_interests",
  "availability",
  "preferred_job_types",
  "work_mode",
  "availability_date",
  "preferred_locations",
  "work_authorization",
  "years_of_experience",
  "requires_sponsorship",
] as const;

const LINKS_DB_KEYS = [
  "contact_visible",
  "contact_email",
  "resume_url",
  "resume_visible",
  "linkedin_url",
  "github_url",
  "portfolio_url",
  "website_url",
] as const;

function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) result[key] = obj[key];
  return result;
}

// Four independently-saved sections (see this component's section
// children) over ONE shared draft object — switching tabs never loses
// data, since the draft lives here for the whole page's lifetime, not
// per-section. See lib/useUnsavedChangesGuard.ts for what "confirm
// before navigating away" does and does not cover in this app's router
// setup.
export default function CandidateProfile() {
  const { user, profile, updatePassword, resetPasswordForEmail, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SectionKey>("professional");
  const [fullName, setFullName] = useState("");
  const [savedFullName, setSavedFullName] = useState("");
  const [savedFields, setSavedFields] = useState<GroveProfileFields | null>(null);
  const [draft, setDraft] = useState<GroveProfileFields | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [sectionStatus, setSectionStatus] = useState<Record<SectionKey, SectionStatus>>({
    professional: "idle",
    career: "idle",
    links: "idle",
    security: "idle",
  });
  const [sectionError, setSectionError] = useState<Record<SectionKey, string | null>>({
    professional: null,
    career: null,
    links: null,
    security: null,
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getCandidateProfile(user.id)
      .then((row) => {
        if (cancelled) return;
        const fields = row ? candidateRowToFields(row) : EMPTY_GROVE_PROFILE_FIELDS;
        const name = row?.full_name || getDisplayName(user, profile) || "";
        setSavedFields(fields);
        setDraft(fields);
        setSavedFullName(name);
        setFullName(name);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Couldn't load your settings.");
        }
      });

    return () => {
      cancelled = true;
    };
    // profile is only used as a display-name fallback for a brand-new
    // row — omitted so a profile refresh elsewhere doesn't re-trigger a
    // reload that would clobber in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const professionalDirty =
    !!draft &&
    !!savedFields &&
    JSON.stringify(professionalSlice(draft)) !== JSON.stringify(professionalSlice(savedFields));
  const nameDirty = fullName.trim() !== savedFullName;
  const careerDirty =
    !!draft &&
    !!savedFields &&
    JSON.stringify(careerSlice(draft)) !== JSON.stringify(careerSlice(savedFields));
  const linksDirty =
    !!draft &&
    !!savedFields &&
    JSON.stringify(linksSlice(draft)) !== JSON.stringify(linksSlice(savedFields));

  useUnsavedChangesGuard(professionalDirty || nameDirty || careerDirty || linksDirty);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function updateDraft(patch: Partial<GroveProfileFields>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  async function handleSaveProfessional() {
    if (!user || !draft) return;
    if (sectionStatus.professional === "saving") return;
    setSectionStatus((s) => ({ ...s, professional: "saving" }));
    setSectionError((e) => ({ ...e, professional: null }));
    try {
      const trimmedName = fullName.trim();
      const fullPatch = buildCandidateProfilePatch(user.id, trimmedName, draft);
      const patch = pick(fullPatch, PROFESSIONAL_DB_KEYS);
      await updateCandidateProfileFields(user.id, trimmedName, patch);
      setSavedFields((prev) =>
        prev ? { ...prev, ...pick(draft, Object.keys(professionalSlice(draft)) as (keyof GroveProfileFields)[]) } : prev,
      );
      setSavedFullName(trimmedName);
      setSectionStatus((s) => ({ ...s, professional: "idle" }));
      showToast("Professional Profile saved");
    } catch (err) {
      setSectionStatus((s) => ({ ...s, professional: "error" }));
      setSectionError((e) => ({
        ...e,
        professional: err instanceof Error ? err.message : "Couldn't save changes.",
      }));
    }
  }

  async function handleSaveCareer() {
    if (!user || !draft) return;
    if (sectionStatus.career === "saving") return;
    setSectionStatus((s) => ({ ...s, career: "saving" }));
    setSectionError((e) => ({ ...e, career: null }));
    try {
      const fullPatch = buildCandidateProfilePatch(user.id, fullName.trim(), draft);
      const patch = pick(fullPatch, CAREER_DB_KEYS);
      await updateCandidateProfileFields(user.id, fullName.trim(), patch);
      setSavedFields((prev) =>
        prev
          ? {
              ...prev,
              opportunities: {
                ...prev.opportunities,
                openToOpportunities: draft.opportunities.openToOpportunities,
                rolesOfInterest: draft.opportunities.rolesOfInterest,
                workMode: draft.opportunities.workMode,
                collaborationInterests: draft.opportunities.collaborationInterests,
              },
              areasOfInterest: draft.areasOfInterest,
              availability: draft.availability,
              preferredJobTypes: draft.preferredJobTypes,
              preferredLocations: draft.preferredLocations,
              availabilityDate: draft.availabilityDate,
              workAuthorization: draft.workAuthorization,
              yearsOfExperience: draft.yearsOfExperience,
              requiresSponsorship: draft.requiresSponsorship,
            }
          : prev,
      );
      setSectionStatus((s) => ({ ...s, career: "idle" }));
      showToast("Career Preferences saved");
    } catch (err) {
      setSectionStatus((s) => ({ ...s, career: "error" }));
      setSectionError((e) => ({
        ...e,
        career: err instanceof Error ? err.message : "Couldn't save changes.",
      }));
    }
  }

  async function handleSaveLinks() {
    if (!user || !draft) return;
    if (sectionStatus.links === "saving") return;
    setSectionStatus((s) => ({ ...s, links: "saving" }));
    setSectionError((e) => ({ ...e, links: null }));
    try {
      const fullPatch = buildCandidateProfilePatch(user.id, fullName.trim(), draft);
      const patch = pick(fullPatch, LINKS_DB_KEYS);
      await updateCandidateProfileFields(user.id, fullName.trim(), patch);
      setSavedFields((prev) =>
        prev
          ? {
              ...prev,
              opportunities: {
                ...prev.opportunities,
                contactVisible: draft.opportunities.contactVisible,
                contactEmail: draft.opportunities.contactEmail,
              },
              resumeUrl: draft.resumeUrl,
              resumeVisible: draft.resumeVisible,
              linkedinUrl: draft.linkedinUrl,
              githubUrl: draft.githubUrl,
              portfolioUrl: draft.portfolioUrl,
              websiteUrl: draft.websiteUrl,
            }
          : prev,
      );
      setSectionStatus((s) => ({ ...s, links: "idle" }));
      showToast("Public Links and Contact saved");
    } catch (err) {
      setSectionStatus((s) => ({ ...s, links: "error" }));
      setSectionError((e) => ({
        ...e,
        links: err instanceof Error ? err.message : "Couldn't save changes.",
      }));
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (!user) return null;

  const dirtyByTab: Record<SectionKey, boolean> = {
    professional: professionalDirty || nameDirty,
    career: careerDirty,
    links: linksDirty,
    security: false,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>
          <p className="mt-2 text-ink-soft">
            Everything here is the single source of truth for your public Grove — edit it here,
            and it appears there automatically.
          </p>
        </div>
        <Link
          to={`/candidates/${user.id}/preview`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
          Preview Public Profile
        </Link>
      </div>

      {loadError && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      )}

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "text-ink-soft hover:bg-accent-soft hover:text-ink",
            ].join(" ")}
          >
            {tab.label}
            {dirtyByTab[tab.key] && (
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {!draft ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas-elevated px-6 py-16">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : (
          <>
            {activeTab === "professional" && (
              <ProfessionalProfileSection
                userId={user.id}
                fullName={fullName}
                onFullNameChange={setFullName}
                draft={draft}
                onChange={updateDraft}
                isDirty={dirtyByTab.professional}
                status={sectionStatus.professional}
                error={sectionError.professional}
                onSave={handleSaveProfessional}
              />
            )}
            {activeTab === "career" && (
              <CareerPreferencesSection
                draft={draft}
                onChange={updateDraft}
                isDirty={dirtyByTab.career}
                status={sectionStatus.career}
                error={sectionError.career}
                onSave={handleSaveCareer}
              />
            )}
            {activeTab === "links" && (
              <PublicLinksSection
                userId={user.id}
                draft={draft}
                onChange={updateDraft}
                isDirty={dirtyByTab.links}
                status={sectionStatus.links}
                error={sectionError.links}
                onSave={handleSaveLinks}
              />
            )}
            {activeTab === "security" && (
              <AccountSecuritySection
                email={user.email ?? ""}
                updatePassword={updatePassword}
                resetPasswordForEmail={resetPasswordForEmail}
                onSignOut={handleSignOut}
              />
            )}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
