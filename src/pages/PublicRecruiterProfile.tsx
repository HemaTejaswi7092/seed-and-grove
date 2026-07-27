import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  getRecruiterProfilePublic,
  listPublishedJobsByRecruiter,
} from "../recruiter/recruiterStore";
import { normalizeRecruiterGroveFields } from "../recruiter/groveProfileDefaults";
import { getUserFeedPosts } from "../state/feedStore";
import { getInitials } from "../lib/initials";
import RecruiterGroveView from "../components/recruiter-grove/RecruiterGroveView";
import type { RecruiterGroveIdentity } from "../components/recruiter-grove/RecruiterGroveView";
import type { Job } from "../recruiter/types";
import type { FeedPost } from "../types/feed";

// Read-only Recruiter Grove — viewable by candidates and other recruiters
// alike (see App.tsx's /recruiters/:recruiterId route, outside
// RecruiterLayout's candidate-blocking gate). Sourced only from
// recruiter_profiles_public + this recruiter's published jobs + their own
// feed posts (RLS naturally resolves the latter to "public only" for
// anyone but the owner — see feed_posts.sql). No personal name is shown
// here — see RecruiterGroveView's identity comment for why.
export default function PublicRecruiterProfile() {
  const { recruiterId } = useParams<{ recruiterId: string }>();
  // Registered under both AuthenticatedLayout and RecruiterLayout (see
  // App.tsx) — the viewer can be either type, and FeedPostCard rendered
  // below needs to know which. Defaults to "candidate" while profile is
  // still resolving, same convention CandidateGate/RecruiterGate use.
  const { profile } = useAuth();
  const viewerAccountType = profile?.account_type === "recruiter" ? "recruiter" : "candidate";
  const [identity, setIdentity] = useState<RecruiterGroveIdentity | null | undefined>(undefined);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recruiterId) return;
    let cancelled = false;

    Promise.all([
      getRecruiterProfilePublic(recruiterId),
      listPublishedJobsByRecruiter(recruiterId),
      getUserFeedPosts(recruiterId),
    ])
      .then(([row, jobRows, postRows]) => {
        if (cancelled) return;
        const grove = row ? normalizeRecruiterGroveFields(row) : null;
        setIdentity(
          row && grove
            ? {
                displayName: row.company_name,
                initials: getInitials(row.company_name),
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
              }
            : null,
        );
        setJobs(jobRows);
        setPosts(postRows.filter((post) => post.visibility === "public"));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load this recruiter.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [recruiterId]);

  if (!recruiterId) return <Navigate to="/recruiter/feed" replace />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </main>
    );
  }

  if (identity === undefined) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-ink-faint">Loading…</p>
      </main>
    );
  }

  if (identity === null) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <p className="text-sm leading-relaxed text-ink-soft">
          This recruiter doesn&apos;t have a public Grove profile yet.
        </p>
      </main>
    );
  }

  return (
    <RecruiterGroveView
      identity={identity}
      jobs={jobs}
      posts={posts}
      isOwner={false}
      viewerAccountType={viewerAccountType}
    />
  );
}
