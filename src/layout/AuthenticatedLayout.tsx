import { Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/useAuth";
import AppNav from "./AppNav";

// Single shared chrome for every authenticated candidate route: enforces
// auth, blocks recruiters (sent to their own dashboard, not just
// rejected — see RecruiterLayout for the mirror image of this guard),
// and renders the global nav exactly once. The area below AppNav is its
// own scroll container — AppNav stays visible while page content
// scrolls, and pages that need a fixed-height internal layout (like the
// Seed workspace) can just fill it with h-full instead of assuming the
// whole viewport.
export default function AuthenticatedLayout() {
  return (
    <ProtectedRoute redirectTo="/signin">
      <CandidateGate />
    </ProtectedRoute>
  );
}

function CandidateGate() {
  const { profile } = useAuth();

  // profile is still loading (null) right after sign-in — ProtectedRoute
  // already waited out the auth loading state, so by the time we're here
  // a null profile is transient, not "this user has no account_type."
  // Treating it as "not a recruiter" (render candidate chrome) rather
  // than bouncing is the safer default while it resolves.
  if (profile?.account_type === "recruiter") {
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <AppNav />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
