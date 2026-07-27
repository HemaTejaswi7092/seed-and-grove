import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import WorkspaceTopbar from "../components/workspace/WorkspaceTopbar";
import ProjectHeader from "../components/workspace/ProjectHeader";
import CopilotChat from "../components/workspace/CopilotChat";
import EvidenceFeed from "../components/workspace/EvidenceFeed";
import SkillGrowth from "../components/workspace/SkillGrowth";
import Timeline from "../components/workspace/Timeline";
import EvidenceGrid from "../components/workspace/EvidenceGrid";
import ShareToFeedModal from "../components/feed/ShareToFeedModal";
import AchievementReviewModal, {
  type AchievementReviewFormValues,
} from "../components/workspace/AchievementReviewModal";
import ProjectCompletionWorkflow from "../components/workspace/ProjectCompletionWorkflow";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../auth/useAuth";
import { isDemoAccount, isDemoSeed } from "../config/demoAccount";
import {
  DEMO_SEED,
  demoHeaderMetadata,
  demoCopilotMessages,
  demoEvidenceFeed,
  demoSkillLevels,
  demoTimelineEvents,
} from "../data/mockData";
import {
  getSeed,
  listSeeds,
  getSeedMessages,
  getSeedActivity,
  getSeedAchievements,
  getSeedTimeline,
} from "../state/seedStore";
import {
  setSeedPublishedAndSync,
  completeSeedAndSync,
  reopenSeedAndSync,
  archiveSeedAndSync,
  unarchiveSeedAndSync,
  updateSeedLinksAndSync,
} from "../state/seedPublishing";
import { createAchievement, updateAchievement, deleteAchievement } from "../state/achievements";
import { createFeedPost } from "../state/feedStore";
import { generateAchievementSuggestions } from "../services/ai/aiClient";
import { buildEmptyAchievementFormValues } from "../lib/evidenceSuggestion";
import { daysSince } from "../lib/dates";
import { toDisplayAchievements } from "../lib/evidenceDisplay";
import { getDisplayName } from "../lib/displayName";
import type { WorkspaceTab } from "../components/workspace/tabs";
import type { ProjectHeaderMetadataItem, EvidenceItem, SkillLevel } from "../types/mockData";
import type { Achievement, SeedActivityItem } from "../types/seed";
import type { FeedPostType, FeedPostVisibility } from "../types/feed";
import type { EvidenceSuggestion } from "../services/ai/types";

// What's carried from "Share to feed" being opened through to the actual
// createFeedPost call — a snapshot of exactly what will be copied into
// the public feed_posts row, decided once when the button is clicked so
// the modal itself never needs to know about Seeds/achievements at all.
interface ShareState {
  postType: FeedPostType;
  seedId: string;
  evidenceId: string | null;
  projectTitle: string;
  achievementTitle: string | null;
  evidenceSummary: string | null;
  skills: string[];
  defaultCaption: string;
}

function toFormValues(achievement: Achievement): AchievementReviewFormValues {
  return {
    title: achievement.title,
    shortDescription: achievement.shortDescription,
    achievementType: achievement.achievementType,
    skillsDemonstrated: achievement.skillsDemonstrated.join(", "),
    technologiesUsed: achievement.technologiesUsed.join(", "),
    projectDomain: achievement.projectDomain,
    candidateContribution: achievement.candidateContribution,
    outcomeOrImpact: achievement.outcomeOrImpact,
    proofUrl: achievement.proofUrl ?? "",
    proofLabel: achievement.proofLabel ?? "",
    relevantRoles: achievement.relevantRoles.join(", "),
    visibility: achievement.visibility,
  };
}

export default function Seed() {
  const { seedId } = useParams<{ seedId: string }>();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("workspace");
  // Bumped whenever the Copilot or an achievement/lifecycle action writes
  // to the store, so this page re-reads it and everything downstream
  // reflects it — these are plain reads at render time, not otherwise
  // reactive to storage writes.
  const [, forceRefresh] = useState(0);
  const [shareState, setShareState] = useState<ShareState | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deletingAchievement, setDeletingAchievement] = useState<Achievement | null>(null);
  const [manualAchievementOpen, setManualAchievementOpen] = useState(false);
  // Drives ProjectCompletionWorkflow. Opened by "Complete Project" — the
  // project itself is NOT marked complete at that point, only once the
  // candidate has logged >=1 achievement from inside the workflow and
  // explicitly confirms there. completionSuggestions null = AI generation
  // still in flight; completionAiUnavailable true = the call failed, so
  // the workflow skips straight to manual-only mode instead of blocking.
  const [completionWorkflowOpen, setCompletionWorkflowOpen] = useState(false);
  const [completionSuggestions, setCompletionSuggestions] = useState<
    EvidenceSuggestion[] | null
  >(null);
  const [completionAiUnavailable, setCompletionAiUnavailable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { user, profile } = useAuth();

  // No fallback to any other Seed — a missing id, a demo id requested by a
  // non-demo account, or a real id this user doesn't own all resolve the
  // same way: back to the list, never a substitute Seed's data.
  if (!seedId || !user) {
    return <Navigate to="/seeds" replace />;
  }
  // Captured as its own const so TS narrows it as non-null inside the
  // nested handlers below (closures aren't narrowed by the
  // `if (!user)` guard above on their own).
  const currentUser = user;

  const wantsDemoSeed = isDemoSeed(seedId);
  const isDemo = wantsDemoSeed && isDemoAccount(user.email);

  if (wantsDemoSeed && !isDemo) {
    return <Navigate to="/seeds" replace />;
  }

  const seed = isDemo ? DEMO_SEED : getSeed(user.id, seedId);
  if (!seed) {
    return <Navigate to="/seeds" replace />;
  }
  // Same closure-narrowing reason as currentUser above.
  const currentSeed = seed;

  const seeds = isDemo ? [DEMO_SEED] : listSeeds(user.id);

  // The raw, seedId-scoped store records — fed to the Copilot as context
  // and, for real Seeds, mapped into the display shapes below. Demo
  // content lives only in the curated mockData arrays, never in this store.
  const rawActivity: SeedActivityItem[] = isDemo ? [] : getSeedActivity(user.id, seed.id);
  const rawAchievements: Achievement[] = isDemo ? [] : getSeedAchievements(user.id, seed.id);
  // The Timeline tab's entire data source — meaningful, system-recognized
  // project events only (see types/seed.ts's TimelineEvent and the
  // writers that log them: state/seedStore.ts, state/achievements.ts,
  // CopilotChat.tsx). Never chat messages or manual entries.
  const timelineEvents = isDemo ? demoTimelineEvents : getSeedTimeline(user.id, seed.id);

  const evidence: EvidenceItem[] = isDemo
    ? demoEvidenceFeed
    : toDisplayAchievements(rawAchievements);
  const skillLevels: SkillLevel[] = isDemo ? demoSkillLevels : [];

  // The header's single compact "📅 2 Days · 🏆 3 Achievements · ..."
  // row — lifecycle/publish state already has its own dedicated,
  // non-redundant home elsewhere in the header (the title-line badges
  // and the Complete/Reopen/Publish buttons), so this stays plain
  // build/evidence counts instead of duplicating that state again.
  const headerMetadata: ProjectHeaderMetadataItem[] = isDemo
    ? demoHeaderMetadata
    : [
        { emoji: "📅", value: String(daysSince(seed.createdAt)), label: "Days" },
        { emoji: "🏆", value: String(rawAchievements.length), label: "Achievements" },
        {
          emoji: "🌱",
          value: String(
            new Set(rawAchievements.flatMap((item) => item.skillsDemonstrated)).size,
          ),
          label: "Verified Skills",
        },
        { emoji: "💻", value: "0", label: "Commits" },
      ];

  const initialMessages = isDemo
    ? demoCopilotMessages
    : getSeedMessages(user.id, seed.id);

  async function handleTogglePublish() {
    const nextPublished = !currentSeed.isPublished;
    try {
      await setSeedPublishedAndSync(currentUser.id, currentSeed.id, nextPublished);
      forceRefresh((n) => n + 1);
      showToast(nextPublished ? "Published to Grove" : "Made private");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Couldn't update this Seed's publish state.",
      );
    }
  }

  async function handleSaveProjectLinks(links: { repoUrl: string; demoUrl: string }) {
    await updateSeedLinksAndSync(currentUser.id, currentSeed.id, links);
    forceRefresh((n) => n + 1);
    showToast("Project links saved");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function handleEditAchievement(achievementId: string) {
    const achievement = rawAchievements.find((item) => item.id === achievementId);
    if (achievement) setEditingAchievement(achievement);
  }

  async function handleSaveEditedAchievement(
    input: Parameters<typeof updateAchievement>[2],
  ) {
    if (!editingAchievement) return;
    await updateAchievement(currentUser.id, editingAchievement.id, input);
    setEditingAchievement(null);
    forceRefresh((n) => n + 1);
    showToast("Achievement updated");
  }

  // Manual "Add Achievement" — deliberately AI-free, always available
  // (including before completion), so a candidate can record a milestone
  // themselves whenever they want rather than waiting for completion or
  // relying on the AI to have noticed it in chat.
  async function handleSaveManualAchievement(
    input: Parameters<typeof createAchievement>[2],
  ) {
    await createAchievement(currentUser.id, currentSeed.id, input);
    setManualAchievementOpen(false);
    forceRefresh((n) => n + 1);
    showToast(
      input.visibility === "published" ? "Achievement published to Grove" : "Achievement saved",
    );
  }

  // Used by ProjectCompletionWorkflow for every achievement it can save —
  // AI-suggestion quick actions (Publish/Save as Draft), the suggestion
  // Edit form, and its own built-in manual-add form all go through this
  // one path. The workflow owns its own per-suggestion resolved/error
  // state, so there's no toast or modal-closing here; a thrown error
  // surfaces inline in the workflow instead. forceRefresh is what makes
  // rawAchievements.length (and so the completion gate) update live as
  // soon as any of these saves lands.
  async function handleSaveCompletionAchievement(
    input: Parameters<typeof createAchievement>[2],
  ) {
    await createAchievement(currentUser.id, currentSeed.id, input);
    forceRefresh((n) => n + 1);
  }

  // Opens the confirmation dialog — the actual delete only happens once
  // the candidate explicitly confirms there (handleConfirmDeleteAchievement).
  function handleRequestDeleteAchievement(achievementId: string) {
    const achievement = rawAchievements.find((item) => item.id === achievementId);
    if (achievement) setDeletingAchievement(achievement);
  }

  // Left to throw on failure — ConfirmDialog's own submit handler catches
  // it, shows the error inline, and keeps the dialog open, so a failed
  // Supabase delete never reads as a silent success and never closes the
  // dialog while local/Postgres could still be out of sync.
  async function handleConfirmDeleteAchievement() {
    if (!deletingAchievement) return;
    await deleteAchievement(currentUser.id, deletingAchievement.id);
    setDeletingAchievement(null);
    forceRefresh((n) => n + 1);
    showToast("Achievement deleted");
  }

  // "Complete Project" opens the workflow instead of completing anything
  // — AI generation fires immediately in the background so suggestions
  // (or the unavailable state) are ready by the time the candidate has
  // looked at the modal. A failed AI call never blocks this: it just
  // flips completionAiUnavailable so the workflow skips straight to
  // manual-only mode instead of showing an error.
  async function handleOpenCompletionWorkflow() {
    setCompletionSuggestions(null);
    setCompletionAiUnavailable(false);
    setCompletionWorkflowOpen(true);

    try {
      const result = await generateAchievementSuggestions({
        seed: currentSeed,
        recentMessages: getSeedMessages(currentUser.id, currentSeed.id),
        activity: getSeedActivity(currentUser.id, currentSeed.id),
        achievements: getSeedAchievements(currentUser.id, currentSeed.id),
      });
      setCompletionSuggestions(result.suggestions);
    } catch {
      setCompletionAiUnavailable(true);
    }
  }

  // The gated, terminal action inside ProjectCompletionWorkflow — only
  // reachable there once rawAchievements.length > 0, so this never needs
  // to re-check that itself. Project completion and achievement creation
  // are still two separate writes; this one only ever runs after at
  // least one achievement already exists.
  async function handleCompleteFromWorkflow() {
    await completeSeedAndSync(currentUser.id, currentSeed.id);
    setCompletionWorkflowOpen(false);
    forceRefresh((n) => n + 1);
    showToast("Project marked complete");
  }

  async function handleReopenProject() {
    await reopenSeedAndSync(currentUser.id, currentSeed.id);
    forceRefresh((n) => n + 1);
    showToast("Project reopened");
  }

  async function handleArchiveProject() {
    await archiveSeedAndSync(currentUser.id, currentSeed.id);
    forceRefresh((n) => n + 1);
    showToast("Project archived");
  }

  async function handleUnarchiveProject() {
    await unarchiveSeedAndSync(currentUser.id, currentSeed.id);
    forceRefresh((n) => n + 1);
    showToast("Project unarchived");
  }

  // Opens the preview modal with a snapshot of this one piece of already-
  // published achievement — nothing else from the Seed is ever included.
  function handleOpenShareForEvidence(achievementId: string) {
    const item = rawAchievements.find((achievement) => achievement.id === achievementId);
    if (!item) return;
    setShareState({
      postType: "evidence_shared",
      seedId: currentSeed.id,
      evidenceId: item.id,
      projectTitle: currentSeed.title,
      achievementTitle: item.title,
      evidenceSummary: item.shortDescription,
      skills: item.skillsDemonstrated,
      defaultCaption: `Made progress on "${currentSeed.title}": ${item.title}`,
    });
  }

  // Opens the preview modal for the Seed itself, once it's already
  // published — no achievement attached, just the project-level snapshot.
  function handleOpenShareForProject() {
    setShareState({
      postType:
        currentSeed.lifecycleStatus === "completed" ? "project_completed" : "project_started",
      seedId: currentSeed.id,
      evidenceId: null,
      projectTitle: currentSeed.title,
      achievementTitle: null,
      evidenceSummary: null,
      skills: [],
      defaultCaption: `Published "${currentSeed.title}" to my Grove.`,
    });
  }

  async function handlePublishToFeed(input: {
    caption: string;
    visibility: FeedPostVisibility;
  }) {
    if (!shareState) return;
    await createFeedPost(currentUser.id, {
      seed_id: shareState.seedId,
      evidence_id: shareState.evidenceId,
      post_type: shareState.postType,
      caption: input.caption,
      author_name: getDisplayName(currentUser, profile) || "A builder",
      author_account_type: "candidate",
      project_title: shareState.projectTitle,
      achievement_title: shareState.achievementTitle,
      evidence_summary: shareState.evidenceSummary,
      skills: shareState.skills,
      visibility: input.visibility,
    });
    setShareState(null);
    showToast("Shared to your feed");
  }

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
          metadata={headerMetadata}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTogglePublish={isDemo ? undefined : handleTogglePublish}
          onShareToFeed={isDemo ? undefined : handleOpenShareForProject}
          onCompleteProject={isDemo ? undefined : handleOpenCompletionWorkflow}
          onReopenProject={isDemo ? undefined : handleReopenProject}
          onArchiveProject={isDemo ? undefined : handleArchiveProject}
          onUnarchiveProject={isDemo ? undefined : handleUnarchiveProject}
          onSaveLinks={isDemo ? undefined : handleSaveProjectLinks}
          onAddAchievement={isDemo ? undefined : () => setManualAchievementOpen(true)}
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
                    achievements={rawAchievements}
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

          {activeTab === "timeline" && <Timeline events={timelineEvents} />}
          {activeTab === "evidence" && (
            <EvidenceGrid
              achievements={rawAchievements}
              onEdit={isDemo ? undefined : handleEditAchievement}
              onDelete={isDemo ? undefined : handleRequestDeleteAchievement}
              onShareToFeed={isDemo ? undefined : handleOpenShareForEvidence}
            />
          )}
        </div>
      </div>

      {shareState && (
        <ShareToFeedModal
          projectTitle={shareState.projectTitle}
          evidenceSummary={shareState.evidenceSummary}
          skills={shareState.skills}
          defaultCaption={shareState.defaultCaption}
          onClose={() => setShareState(null)}
          onPublish={handlePublishToFeed}
        />
      )}

      {editingAchievement && (
        <AchievementReviewModal
          mode="edit"
          initial={toFormValues(editingAchievement)}
          onClose={() => setEditingAchievement(null)}
          onSave={handleSaveEditedAchievement}
        />
      )}

      {manualAchievementOpen && (
        <AchievementReviewModal
          mode="create"
          initial={buildEmptyAchievementFormValues(currentSeed)}
          onClose={() => setManualAchievementOpen(false)}
          onSave={handleSaveManualAchievement}
        />
      )}

      {completionWorkflowOpen && (
        <ProjectCompletionWorkflow
          seed={currentSeed}
          suggestions={completionSuggestions}
          aiUnavailable={completionAiUnavailable}
          achievementCount={rawAchievements.length}
          onClose={() => setCompletionWorkflowOpen(false)}
          onSaveAchievement={handleSaveCompletionAchievement}
          onComplete={handleCompleteFromWorkflow}
        />
      )}

      {deletingAchievement && (
        <ConfirmDialog
          title="Delete this achievement?"
          description={
            deletingAchievement.visibility === "published"
              ? `"${deletingAchievement.title}" will be permanently removed from this Seed and from your Grove. This can't be undone.`
              : `"${deletingAchievement.title}" will be permanently removed. This can't be undone.`
          }
          confirmLabel="Delete Achievement"
          destructive
          onCancel={() => setDeletingAchievement(null)}
          onConfirm={handleConfirmDeleteAchievement}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
