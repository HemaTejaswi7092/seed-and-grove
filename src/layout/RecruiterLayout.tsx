import { Navigate, Outlet } from "react-router-dom";
import { Sprout } from "lucide-react";
import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/useAuth";
import { useRecruiterProfile } from "../recruiter/useRecruiterProfile";
import RecruiterNav from "./RecruiterNav";

// The recruiter-side counterpart to AuthenticatedLayout — same chrome
// pattern, but with two extra gates a candidate route doesn't need:
// account_type must be "recruiter" (candidates are sent to their own
// dashboard, not just blocked), and a recruiter_profiles row must exist
// (otherwise /recruiter/signup, which resumes at Step 2 for an
// authenticated recruiter with no company info yet).
export default function RecruiterLayout() {
  return (
    <ProtectedRoute redirectTo="/recruiter/signin">
      <RecruiterGate />
    </ProtectedRoute>
  );
}

function RecruiterGate() {
  const { profile, loading: authLoading } = useAuth();
  const { recruiterProfile, loading: recruiterLoading } = useRecruiterProfile();

  if (authLoading || recruiterLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sprout className="h-5 w-5" strokeWidth={2.25} />
        </span>
      </div>
    );
  }

  if (profile?.account_type !== "recruiter") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!recruiterProfile) {
    return <Navigate to="/recruiter/signup" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <RecruiterNav />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
