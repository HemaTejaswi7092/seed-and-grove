import { useEffect } from "react";

// Browser-level guard only (tab close, refresh, typed/bookmarked
// navigation, back/forward) — this app uses a plain <Routes> tree, not a
// data router, so react-router's useBlocker (which needs a data router)
// can't intercept in-app <Link>/nav clicks away from Profile. Within
// Profile itself (switching between its own section tabs), the page
// guards that case directly with ConfirmDialog, which doesn't have this
// limitation.
export function useUnsavedChangesGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
