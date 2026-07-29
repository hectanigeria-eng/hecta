"use client";

import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";

export interface UseGateResult {
  /**
   * Runs `action` immediately when the active user is identity-verified;
   * otherwise opens the gate dialog and leaves `action` un-run. This is the
   * single decision point every save/apply/contact call site should route
   * through, so "does this need verification" is answered in exactly one
   * place.
   */
  requireVerified: (action: () => void) => void;
  gateOpen: boolean;
  setGateOpen: (open: boolean) => void;
}

/**
 * Centralizes the trust gate. Before the persisted store has rehydrated on
 * the client, the real verification state isn't known yet — rather than
 * guessing (and either flashing the gate dialog at a user who turns out to
 * be verified, or letting an anonymous user's click through), `requireVerified`
 * treats the pre-hydration window as "not yet decidable" and does nothing
 * until `useHydrated()` flips true. In practice every call site already
 * waits for hydration before rendering its own interactive controls, so this
 * only guards against a click landing in that narrow window.
 */
export function useGate(): UseGateResult {
  const hydrated = useHydrated();
  const { isIdentityVerified } = useSession();
  const [gateOpen, setGateOpen] = useState(false);

  function requireVerified(action: () => void): void {
    if (!hydrated) return;
    if (isIdentityVerified) {
      action();
      return;
    }
    setGateOpen(true);
  }

  return { requireVerified, gateOpen, setGateOpen };
}
