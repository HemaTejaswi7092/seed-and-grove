import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthenticatedLayout from "./layout/AuthenticatedLayout";
import RecruiterLayout from "./layout/RecruiterLayout";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import SeedNew from "./pages/SeedNew";
import Dashboard from "./pages/Dashboard";
import Seeds from "./pages/Seeds";
import Seed from "./pages/Seed";
import Grove from "./pages/Grove";
import Opportunities from "./pages/Opportunities";
import Profile from "./pages/Profile";
import RecruiterSignUp from "./pages/RecruiterSignUp";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterJobs from "./pages/RecruiterJobs";
import RecruiterJobForm from "./pages/RecruiterJobForm";
import RecruiterSettings from "./pages/RecruiterSettings";
import RecruiterDiscover from "./pages/RecruiterDiscover";
import RecruiterCandidateProfile from "./pages/RecruiterCandidateProfile";
import RecruiterJobMatches from "./pages/RecruiterJobMatches";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn accountType="candidate" />} />
        {/* Same SignIn component/logic as /signin — accountType only
            drives copy and the role-switch link, since login itself
            doesn't need to know which flow the user picked (see
            SignIn.tsx's top comment). */}
        <Route path="/recruiter/signin" element={<SignIn accountType="recruiter" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute redirectTo="/signin">
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Not wrapped in RecruiterLayout — it has to work for both a
            logged-out visitor (Step 1 creates the account) and an
            authenticated recruiter with no company profile yet (resumes
            at Step 2). See RecruiterSignUp.tsx's top comment. */}
        <Route path="/recruiter/signup" element={<RecruiterSignUp />} />

        {/* Every route below shares one authenticated layout — auth
            enforcement and the global nav live there once, not per page.
            Recruiters are redirected away from all of it (see
            AuthenticatedLayout's account_type guard) — Seed and Grove
            creation are candidate-only. */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/seeds" element={<Seeds />} />
          <Route path="/seeds/:seedId" element={<Seed />} />
          <Route path="/seed/new" element={<SeedNew />} />
          <Route path="/grove" element={<Grove />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Recruiter-side counterpart — no Seed, no Grove, no candidate
            feed. Candidates are redirected away (see RecruiterLayout). */}
        <Route element={<RecruiterLayout />}>
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="/recruiter/jobs/new" element={<RecruiterJobForm />} />
          <Route path="/recruiter/jobs/:jobId/edit" element={<RecruiterJobForm />} />
          <Route path="/recruiter/jobs/:jobId/matches" element={<RecruiterJobMatches />} />
          <Route path="/recruiter/discover" element={<RecruiterDiscover />} />
          <Route
            path="/recruiter/candidates/:candidateId"
            element={<RecruiterCandidateProfile />}
          />
          <Route path="/recruiter/settings" element={<RecruiterSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
