import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { getDisplayName } from "../lib/displayName";
import { getInitials } from "../lib/initials";
import { getRecruiterProfile, listPublishedJobsByRecruiter } from "../recruiter/recruiterStore";
import { normalizeRecruiterGroveFields } from "../recruiter/groveProfileDefaults";
import { getUserFeedPosts } from "../state/feedStore";
import RecruiterGroveView from "../components/recruiter-grove/RecruiterGroveView";
import type { RecruiterGroveIdentity } from "../components/recruiter-grove/RecruiterGroveView";
import type { Job } from "../recruiter/types";
import type { FeedPost } from "../types/feed";

// The recruiter's own Grove — owner view. RecruiterLayout's RecruiterGate
// already guarantees a recruiter_profiles row exists by the time this
// page can render (it redirects to /recruiter/signup otherwise), so
// `profile === null` here is a genuine, unexpected loading edge case, not
// the "no profile yet" case.
export default function RecruiterGrove() {
  const { user, profile } = useAuth();
  const [identity, setIdentity] = useState<RecruiterGroveIdentity | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getRecruiterProfile(user.id)
      .then((row) => {
        if (cancelled || !row) return;
        const grove = normalizeRecruiterGroveFields(row);
        setIdentity({
          displayName: getDisplayName(user, profile) || "Recruiter",
          initials: getInitials(getDisplayName(user, profile)),
          jobTitle: row.job_title,
          companyName: row.company_name,
          companyLocation: row.company_location,
          companyLogoUrl: row.company_logo_url,
          hiringRoles: row.hiring_roles,
          hiringLocations: row.hiring_locations,
          professionalBio: grove.professional_bio,
          hiringPhilosophy: grove.hiring_philosophy,
          experience: grove.experience,
          education: grove.education,
          certifications: grove.certifications,
          industry: grove.industry,
          teamOrDepartment: grove.team_or_department,
          companyDescription: grove.company_description,
          companyWebsite: grove.company_website,
          hiringDomains: grove.hiring_domains,
          hiringSkills: grove.hiring_skills,
          hiringLevels: grove.hiring_levels,
          videos: grove.videos,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load your Grove.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([listPublishedJobsByRecruiter(user.id), getUserFeedPosts(user.id)])
      .then(([jobRows, postRows]) => {
        if (cancelled) return;
        setJobs(jobRows);
        setPosts(postRows);
      })
      .catch(() => {
        if (!cancelled) {
          setJobs([]);
          setPosts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </main>
    );
  }

  if (!identity) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-ink-faint">Loading…</p>
      </main>
    );
  }

  return (
    <RecruiterGroveView
      identity={identity}
      jobs={jobs}
      posts={posts}
      isOwner
      viewerAccountType="recruiter"
    />
  );
}
