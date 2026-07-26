import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { getRecruiterProfile } from "./recruiterStore";
import type { RecruiterProfile } from "./types";

interface UseRecruiterProfileResult {
  recruiterProfile: RecruiterProfile | null;
  loading: boolean;
  // Call after creating/updating the profile so RecruiterLayout's gate
  // (and anything else reading this hook) picks up the change without a
  // full page reload.
  refresh: () => void;
}

export function useRecruiterProfile(): UseRecruiterProfileResult {
  const { user } = useAuth();
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Routed through the same .then() branch regardless of whether there's
    // a user, so no setState call is ever reached synchronously in the
    // effect body itself (every one of them is inside a promise callback).
    const load = user ? getRecruiterProfile(user.id) : Promise.resolve(null);
    load
      .then((data) => {
        if (!cancelled) {
          setRecruiterProfile(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  return { recruiterProfile, loading, refresh: () => setRefreshKey((n) => n + 1) };
}
