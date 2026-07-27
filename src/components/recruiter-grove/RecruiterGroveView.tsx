import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Newspaper, PlayCircle } from "lucide-react";
import FeedPostCard from "../dashboard/FeedPostCard";
import ExperienceList from "../grove/ExperienceList";
import EducationList from "../grove/EducationList";
import CertificationList from "../grove/CertificationList";
import type { CertificationEntry, EducationEntry, ExperienceEntry } from "../../types/grove";
import type { Job, VideoEntry } from "../../recruiter/types";
import type { FeedPost } from "../../types/feed";

const WORK_MODE_LABEL: Record<Job["work_mode"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

// The recruiter equivalent of a candidate's identity fields — deliberately
// just the slice both RecruiterProfile (owner) and the widened
// RecruiterProfilePublic (public view, see recruiter_grove_profile.sql)
// have in common, so this component never needs to know which one its
// caller fetched.
// displayName is the recruiter's own name for the owner (profiles.full_name,
// readable via the authenticated session) but the company name for every
// other viewer — profiles' RLS is own-row-only (see setup.sql), so a
// recruiter's personal name has never been publicly exposed anywhere in
// this app (JobDetail.tsx shows only company branding too). This mirrors
// that existing boundary rather than introducing a new one.
export interface RecruiterGroveIdentity {
  displayName: string;
  initials: string;
  jobTitle: string;
  companyName: string;
  companyLocation: string | null;
  companyLogoUrl: string | null;
  hiringRoles: string[];
  hiringLocations: string[];
  professionalBio: string;
  hiringPhilosophy: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  industry: string;
  teamOrDepartment: string;
  companyDescription: string;
  companyWebsite: string | null;
  hiringDomains: string[];
  hiringSkills: string[];
  hiringLevels: string[];
  videos: VideoEntry[];
}

interface RecruiterGroveViewProps {
  identity: RecruiterGroveIdentity;
  jobs: Job[] | null;
  posts: FeedPost[] | null;
  isOwner: boolean;
  // The current viewer's own account type — needed both by FeedPostCard
  // (to pick a route the viewer's own gated layout can actually render)
  // and by this component's Posted Jobs links (JobDetail is registered
  // under both AuthenticatedLayout and RecruiterLayout — see App.tsx).
  viewerAccountType: "candidate" | "recruiter";
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-canvas-elevated p-6">
      {children}
    </div>
  );
}

// Pure presentation, mirroring candidate GroveView.tsx's owner/read-only
// split. Hierarchy: Hero, About, Professional Experience, Education,
// Certifications, Current Company, Hiring Interests, Professional Posts,
// Posted Jobs — Experience/Education/Certifications are each their own
// top-level section (not bundled under one "Background" heading) so the
// recruiter's career journey reads with the same weight a candidate's
// Grove gives it, via the exact same ExperienceList/EducationList/
// CertificationList components (see components/grove/) — one shared
// implementation, not a parallel copy. Current Company is deliberately
// just one section among several, not the page's identity. Posted Jobs
// comes last and stays a single, plain section — Jobs itself owns
// creation/editing/publishing (see RecruiterJobs.tsx).
export default function RecruiterGroveView({
  identity,
  jobs,
  posts,
  isOwner,
  viewerAccountType,
}: RecruiterGroveViewProps) {
  const jobDetailBase = viewerAccountType === "recruiter" ? "/recruiter/opportunities" : "/opportunities";
  const hasHiringInterests =
    identity.hiringRoles.length > 0 ||
    identity.hiringDomains.length > 0 ||
    identity.hiringSkills.length > 0 ||
    identity.hiringLevels.length > 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex flex-col items-start gap-5 rounded-3xl border border-border bg-canvas-elevated p-6 sm:flex-row sm:items-center sm:p-8">
        {identity.companyLogoUrl ? (
          <img
            src={identity.companyLogoUrl}
            alt={identity.companyName}
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
            {identity.initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {identity.displayName}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isOwner ? `${identity.jobTitle} @ ${identity.companyName}` : identity.jobTitle}
          </p>
          {identity.companyLocation && (
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
              <MapPin className="h-3 w-3" strokeWidth={2} />
              {identity.companyLocation}
            </p>
          )}
          {(identity.hiringRoles.length > 0 || identity.hiringLocations.length > 0) && (
            <p className="mt-2.5 text-xs text-ink-faint">
              Hiring for{" "}
              {identity.hiringRoles.length > 0 && (
                <span className="font-medium text-ink-soft">
                  {identity.hiringRoles.join(", ")}
                </span>
              )}
              {identity.hiringRoles.length > 0 && identity.hiringLocations.length > 0 && " in "}
              {identity.hiringLocations.length > 0 && (
                <span className="font-medium text-ink-soft">
                  {identity.hiringLocations.join(", ")}
                </span>
              )}
            </p>
          )}
        </div>
        {isOwner && (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Link
              to="/recruiter/grove/edit"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              Edit Grove
            </Link>
            <Link
              to="/recruiter/jobs"
              className="text-center text-xs font-medium text-ink-faint transition-colors hover:text-ink-soft"
            >
              Manage Jobs
            </Link>
          </div>
        )}
      </div>

      {(identity.professionalBio.trim() || identity.hiringPhilosophy.trim()) && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">About</h2>
          <SectionCard>
            {identity.professionalBio.trim() && (
              <p className="text-sm leading-relaxed text-ink">{identity.professionalBio}</p>
            )}
            {identity.hiringPhilosophy.trim() && (
              <div className={identity.professionalBio.trim() ? "mt-4" : undefined}>
                <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Hiring philosophy
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {identity.hiringPhilosophy}
                </p>
              </div>
            )}
          </SectionCard>
        </section>
      )}

      {identity.experience.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Professional Experience
          </h2>
          <SectionCard>
            <ExperienceList entries={identity.experience} />
          </SectionCard>
        </section>
      )}

      {identity.education.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Education
          </h2>
          <SectionCard>
            <EducationList entries={identity.education} />
          </SectionCard>
        </section>
      )}

      {identity.certifications.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Certifications
          </h2>
          <SectionCard>
            <CertificationList entries={identity.certifications} />
          </SectionCard>
        </section>
      )}

      {(identity.industry.trim() ||
        identity.teamOrDepartment.trim() ||
        identity.companyDescription.trim() ||
        identity.companyWebsite) && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Current Company
          </h2>
          <SectionCard>
            <p className="text-sm font-semibold text-ink">{identity.companyName}</p>
            {(identity.industry.trim() || identity.teamOrDepartment.trim()) && (
              <p className="mt-1 text-xs text-ink-faint">
                {[identity.industry, identity.teamOrDepartment].filter((v) => v.trim()).join(" · ")}
              </p>
            )}
            {identity.companyDescription.trim() && (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {identity.companyDescription}
              </p>
            )}
            {identity.companyWebsite && (
              <a
                href={identity.companyWebsite}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-medium text-accent-dark transition-colors hover:text-accent"
              >
                {identity.companyWebsite}
              </a>
            )}
          </SectionCard>
        </section>
      )}

      {hasHiringInterests && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Hiring Interests
          </h2>
          <SectionCard>
            {identity.hiringRoles.length > 0 && (
              <div>
                <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Roles
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {identity.hiringRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-dark"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {identity.hiringDomains.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Domains
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {identity.hiringDomains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {identity.hiringSkills.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Skills &amp; industries followed
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {identity.hiringSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {identity.hiringLevels.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Hiring levels
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {identity.hiringLevels.map((level) => (
                    <span
                      key={level}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Professional Posts
        </h2>

        {identity.videos.length > 0 && (
          <SectionCard>
            <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">Videos</p>
            <div className="mt-3 space-y-2.5">
              {identity.videos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm font-medium text-ink transition-colors hover:text-accent-dark"
                >
                  <PlayCircle className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                  {video.title || video.url}
                </a>
              ))}
            </div>
          </SectionCard>
        )}

        {posts === null ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas p-10">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : posts.length === 0 && identity.videos.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas p-8 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Newspaper className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm text-ink-soft">No professional posts yet.</p>
            {isOwner && (
              <Link
                to="/recruiter/posts/new"
                className="mt-3 text-xs font-medium text-accent-dark transition-colors hover:text-accent"
              >
                Draft a post
              </Link>
            )}
          </div>
        ) : (
          posts.length > 0 && (
            <div className="mt-4 space-y-4">
              {posts.map((post, index) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  isOwnPost={isOwner}
                  viewerAccountType={viewerAccountType}
                  index={index}
                />
              ))}
            </div>
          )
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Posted Jobs
        </h2>

        {jobs === null ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas p-8">
            <p className="text-sm text-ink-faint">Loading…</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-ink-faint/40 bg-canvas p-8 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Briefcase className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="ml-3 text-sm text-ink-soft">No published jobs yet.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`${jobDetailBase}/${job.id}`}
                className="rounded-2xl border border-border bg-canvas-elevated p-4 transition-colors hover:border-ink-faint/50"
              >
                <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                  {job.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" strokeWidth={2} />
                      {job.location}
                    </span>
                  )}
                  <span>{WORK_MODE_LABEL[job.work_mode]}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
