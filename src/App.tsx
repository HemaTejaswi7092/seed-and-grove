import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthenticatedLayout from "./layout/AuthenticatedLayout";
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

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute redirectTo="/signin">
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Every route below shares one authenticated layout — auth
            enforcement and the global nav live there once, not per page. */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/seeds" element={<Seeds />} />
          <Route path="/seeds/:seedId" element={<Seed />} />
          <Route path="/seed/new" element={<SeedNew />} />
          <Route path="/grove" element={<Grove />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
