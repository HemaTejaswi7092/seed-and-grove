// Field names match the `feed_posts` Postgres columns verbatim (snake_case)
// — same convention as auth/types.ts's Profile, since this is a real
// Supabase-backed table (unlike Seed/Achievement in types/seed.ts, which
// are camelCase because they're localStorage-only, no DB schema to match
// — except Achievement's published counterpart, PublishedAchievement in
// types/grove.ts, which is itself snake_case for the same reason). See
// supabase/feed_posts.sql.
export type FeedPostType =
  | "project_started"
  | "milestone_completed"
  | "evidence_shared"
  | "skill_demonstrated"
  | "project_completed"
  | "achievement_added"
  | "grove_update";

export type FeedPostVisibility = "public" | "private";

export interface FeedPost {
  id: string;
  user_id: string;
  // Informational only, not a real foreign key — Seeds/evidence live in
  // localStorage, not Postgres. See supabase/feed_posts.sql.
  seed_id: string | null;
  evidence_id: string | null;
  post_type: FeedPostType;
  caption: string;
  // Snapshotted at publish time, not joined from `profiles` — that
  // table's RLS only allows reading your own row, so a cross-user feed
  // has no other way to show who posted. See feed_posts.sql.
  author_name: string;
  project_title: string | null;
  evidence_summary: string | null;
  skills: string[];
  visibility: FeedPostVisibility;
  created_at: string;
  updated_at: string;
}

// What the publish flow sends — user_id is supplied separately by
// feedStore.ts (from the authenticated caller), never taken from here.
export interface CreateFeedPostInput {
  seed_id: string | null;
  evidence_id: string | null;
  post_type: FeedPostType;
  caption: string;
  author_name: string;
  project_title: string | null;
  evidence_summary: string | null;
  skills: string[];
  visibility: FeedPostVisibility;
}
