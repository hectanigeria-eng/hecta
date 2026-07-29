"use client";

import { useEffect } from "react";
import { useHectaStore } from "@/lib/store";

// Guards against every mounted `useHydrated()` consumer independently
// re-triggering a localStorage read — rehydration only needs to happen once
// per page load.
let rehydrationRequested = false;

/**
 * True once the persisted store has been rehydrated from localStorage on
 * the client. Starts `false` on both the server render and the client's
 * first render (so markup matches and there is no hydration mismatch), then
 * flips to `true` after a post-mount effect rehydrates the store.
 */
export function useHydrated(): boolean {
  const hasHydrated = useHectaStore((state) => state._hasHydrated);

  useEffect(() => {
    if (rehydrationRequested) return;
    rehydrationRequested = true;
    void useHectaStore.persist.rehydrate();
  }, []);

  return hasHydrated;
}
