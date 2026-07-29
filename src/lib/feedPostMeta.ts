import {
  PartyPopper,
  Bot,
  ShieldCheck,
  Zap,
  TrendingUp,
  Trophy,
  Sparkles,
  Award,
  Megaphone,
  Users,
  Newspaper,
  Building2,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { FeedPostType } from "../types/feed";

interface FeedPostMeta {
  label: string;
  icon: LucideIcon;
}

// What each post_type reads as in a feed card's header line ("<name>
// started a new project") and which icon marks it — one lookup shared by
// every place a post_type needs to be displayed, including the small
// circular badge on every feed card (see FeedPostCard.tsx).
export const FEED_POST_META: Record<FeedPostType, FeedPostMeta> = {
  project_started: { label: "published a project to Grove", icon: PartyPopper },
  milestone_completed: { label: "reached an AI milestone", icon: Bot },
  evidence_shared: { label: "shared evidence", icon: ShieldCheck },
  skill_demonstrated: { label: "demonstrated a skill", icon: Zap },
  project_completed: { label: "completed a project", icon: TrendingUp },
  achievement_added: { label: "added a new achievement", icon: Trophy },
  grove_update: { label: "updated their Grove profile", icon: Sparkles },
  company_award: { label: "earned a company award", icon: Award },
  hiring_announcement: { label: "shared a hiring announcement", icon: Megaphone },
  team_achievement: { label: "shared a team achievement", icon: Users },
  industry_update: { label: "shared an industry update", icon: Newspaper },
  company_news: { label: "shared company news", icon: Building2 },
  job_posted: { label: "posted a new job", icon: FileText },
};
