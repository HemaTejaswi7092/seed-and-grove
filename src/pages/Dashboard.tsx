import DashboardHeader from "../components/dashboard/DashboardHeader";
import ContinueGrowing from "../components/dashboard/ContinueGrowing";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";
import DashboardEvidence from "../components/dashboard/DashboardEvidence";
import DashboardActivity from "../components/dashboard/DashboardActivity";
import DashboardOpportunities from "../components/dashboard/DashboardOpportunities";
import { useAuth } from "../auth/useAuth";
import { useActiveProject } from "../auth/useActiveProject";
import { isDemoAccount } from "../config/demoAccount";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeSeed, stats, hasProject } = useActiveProject();
  const isDemo = isDemoAccount(user?.email);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <DashboardHeader />

      {hasProject && activeSeed ? (
        <ContinueGrowing activeSeed={activeSeed} stats={stats} />
      ) : (
        <DashboardEmptyState />
      )}

      {isDemo && (
        <>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardEvidence />
            <DashboardActivity />
          </div>
          <DashboardOpportunities />
        </>
      )}
    </main>
  );
}
