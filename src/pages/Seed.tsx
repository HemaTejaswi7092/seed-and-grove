import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import WorkspaceTopbar from "../components/workspace/WorkspaceTopbar";
import ProjectHeader from "../components/workspace/ProjectHeader";
import CopilotChat from "../components/workspace/CopilotChat";
import EvidenceFeed from "../components/workspace/EvidenceFeed";
import SkillGrowth from "../components/workspace/SkillGrowth";
import ActivityTimeline from "../components/workspace/ActivityTimeline";
import EvidenceGrid from "../components/workspace/EvidenceGrid";
import { useAuth } from "../auth/useAuth";
import { isDemoAccount, isDemoSeed } from "../config/demoAccount";
import {
  DEMO_SEED,
  demoProjectStats,
  demoCopilotMessages,
  demoEvidenceFeed,
  demoSkillLevels,
  demoActivityGroups,
} from "../data/mockData";
import {
  getSeed,
  listSeeds,
  getSeedMessages,
  getSeedActivity,
  getSeedEvidence,
} from "../state/seedStore";
import { daysSince } from "../lib/dates";
import { toDisplayEvidence } from "../lib/evidenceDisplay";
import type { WorkspaceTab } from "../components/workspace/tabs";
import type { ProjectStat, EvidenceItem, ActivityGroup, SkillLevel } from "../types/mockData";
import type { SeedActivityItem, SeedEvidenceItem } from "../types/seed";

export default function Seed() {
  const { seedId } = useParams<{ seedId: string }>();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("workspace");
  // Bumped whenever the Copilot writes new evidence/activity, so this page
  // re-reads the store and the Evidence panel/stats reflect it — they're
  // plain reads at render time, not otherwise reactive to storage writes.
  const [, forceRefresh] = useState(0);
  const { user } = useAuth();

  // No fallback to any other Seed — a missing id, a demo id requested by a
  // non-demo account, or a real id this user doesn't own all resolve the
  // same way: back to the list, never a substitute Seed's data.
  if (!seedId || !user) {
    return <Navigate to="/seeds" replace />;
  }

  const wantsDemoSeed = isDemoSeed(seedId);
  const isDemo = wantsDemoSeed && isDemoAccount(user.email);

  if (wantsDemoSeed && !isDemo) {
    return <Navigate to="/seeds" replace />;
  }

  const seed = isDemo ? DEMO_SEED : getSeed(user.id, seedId);
  if (!seed) {
    return <Navigate to="/seeds" replace />;
  }

  const seeds = isDemo ? [DEMO_SEED] : listSeeds(user.id);

  // The raw, seedId-scoped store records — fed to the Copilot as context
  // and, for real Seeds, mapped into the display shapes below. Demo
  // content lives only in the curated mockData arrays, never in this store.
  const rawActivity: SeedActivityItem[] = isDemo ? [] : getSeedActivity(user.id, seed.id);
  const rawEvidence: SeedEvidenceItem[] = isDemo ? [] : getSeedEvidence(user.id, seed.id);

  const evidence: EvidenceItem[] = isDemo
    ? demoEvidenceFeed
    : toDisplayEvidence(rawEvidence);
  // Activity-timeline display (day-grouped, one icon per entry) doesn't yet
  // have a mapping from freeform chat-derived SeedActivityItem records —
  // real activity is captured (rawActivity, fed to the Copilot and stats)
  // but not yet rendered in the Activity tab. See final report.
  const activityGroups: ActivityGroup[] = isDemo ? demoActivityGroups : [];
  const skillLevels: SkillLevel[] = isDemo ? demoSkillLevels : [];

  const stats: ProjectStat[] = isDemo
    ? demoProjectStats
    : [
        { label: "Days building", value: String(daysSince(seed.createdAt)) },
        { label: "Commits logged", value: "0" },
        { label: "Evidence points", value: String(evidence.length) },
        {
          label: "Skills demonstrated",
          value: String(new Set(evidence.map((item) => item.skill)).size),
        },
      ];

  const initialMessages = isDemo
    ? demoCopilotMessages
    : getSeedMessages(user.id, seed.id);

  return (
    <div className="flex h-full bg-canvas">
      <WorkspaceSidebar
        seeds={seeds}
        activeSeedId={seed.id}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        daysBuilding={daysSince(seed.createdAt)}
        isDemo={isDemo}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar seedTitle={seed.title} />
        <ProjectHeader
          seed={seed}
          stats={stats}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 overflow-y-auto">
          {activeTab === "workspace" && (
            <div className="space-y-6 px-8 py-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <CopilotChat
                    key={seed.id}
                    seed={seed}
                    userId={isDemo ? null : user.id}
                    initialMessages={initialMessages}
                    activity={rawActivity}
                    evidence={rawEvidence}
                    persist={!isDemo}
                    onDataCaptured={() => forceRefresh((n) => n + 1)}
                  />
                </div>
                <div className="lg:col-span-2">
                  <EvidenceFeed
                    evidence={evidence}
                    onViewAll={() => setActiveTab("evidence")}
                  />
                </div>
              </div>
              {skillLevels.length > 0 && (
                <SkillGrowth skillLevels={skillLevels} />
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <ActivityTimeline activityGroups={activityGroups} />
          )}
          {activeTab === "evidence" && <EvidenceGrid evidence={evidence} />}
        </div>
      </div>
    </div>
  );
}
