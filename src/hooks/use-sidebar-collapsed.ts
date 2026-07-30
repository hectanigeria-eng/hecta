"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hecta-dashboard-sidebar-collapsed";

/**
 * Whether the dashboard/admin nav column is collapsed to icon-only,
 * persisted across visits. Starts `false` on both the server and the first
 * client render to avoid a hydration mismatch; a persisted `true` value is
 * applied right after mount, mirroring how `useHydrated` handles the rest of
 * this app's persisted client state.
 */
export function useSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      setCollapsedState(true);
    }
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  return [collapsed, setCollapsed];
}
