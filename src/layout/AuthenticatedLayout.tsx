import { Outlet } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import AppNav from "./AppNav";

// Single shared chrome for every authenticated route: enforces auth and
// renders the global nav exactly once, so individual pages don't each
// import AppNav (or forget to). The area below AppNav is its own scroll
// container — AppNav stays visible while page content scrolls, and pages
// that need a fixed-height internal layout (like the Seed workspace) can
// just fill it with h-full instead of assuming the whole viewport.
export default function AuthenticatedLayout() {
  return (
    <ProtectedRoute redirectTo="/signin">
      <div className="flex h-screen flex-col bg-canvas">
        <AppNav />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
