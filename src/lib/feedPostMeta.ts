import {
  Rocket,
  Trophy,
  ShieldCheck,
  TrendingUp,
  PartyPopper,
  Award,
  Sprout,
  Megaphone,
  Users,
  Newspaper,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { FeedPostType } from "../types/feed";

interface FeedPostMeta {
  label: string;
  icon: LucideIcon;
}

// What each post_type reads as in a feed card's header line ("<name>
// started a new project") and which icon marks it — one lookup shared by
// every place a post_type needs to be displayed.
export const FEED_POST_META: Record<FeedPostType, FeedPostMeta> = {
  project_started: { label: "started a new project", icon: Rocket },
  milestone_completed: { label: "completed a milestone", icon: Trophy },
  evidence_shared: { label: "shared evidence", icon: ShieldCheck },
  skill_demonstrated: { label: "demonstrated a skill", icon: TrendingUp },
  project_completed: { label: "completed a project", icon: PartyPopper },
  achievement_added: { label: "added an achievement", icon: Award },
  grove_update: { label: "updated their Grove", icon: Sprout },
  company_award: { label: "earned a company award", icon: Trophy },
  hiring_announcement: { label: "shared a hiring announcement", icon: Megaphone },
  team_achievement: { label: "shared a team achievement", icon: Users },
  industry_update: { label: "shared an industry update", icon: Newspaper },
  company_news: { label: "shared company news", icon: Building2 },
};
