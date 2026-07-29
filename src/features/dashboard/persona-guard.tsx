"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";
import type { PersonaId } from "@/lib/types";

// The one demo user seeded for each switchable persona (see
// src/lib/mock/users.ts / persona-switcher.tsx) — the account `switchPersona`
// jumps to when the guard's button is pressed.
const DEMO_USER_BY_PERSONA: Record<PersonaId, string> = {
  anonymous: "anonymous",
  tenant: "user-tunde",
  landlord: "user-amaka",
  admin: "user-admin",
};

const PERSONA_LABEL: Record<PersonaId, string> = {
  anonymous: "guest",
  tenant: "tenant",
  landlord: "landlord",
  admin: "admin",
};

interface PersonaGuardProps {
  persona: PersonaId;
  children: ReactNode;
}

/**
 * Full-page takeover shown instead of `children` whenever the active demo
 * persona doesn't match `persona` — e.g. a tenant landing on `/dashboard`.
 * Keeps the multi-persona demo coherent without a real auth layer.
 *
 * Waits for `useHydrated()` before comparing personas: the store's
 * in-memory default is always the anonymous seed user until localStorage
 * rehydrates, so deciding any earlier would flash this guard at a landlord
 * or admin who is actually signed in.
 */
export function PersonaGuard({ persona, children }: PersonaGuardProps) {
  const hydrated = useHydrated();
  const { user } = useSession();
  const switchPersona = useHectaStore((state) => state.switchPersona);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
        <Skeleton className="h-48 w-full max-w-sm rounded-2xl" aria-hidden />
      </div>
    );
  }

  if (user.personaId === persona) {
    return <>{children}</>;
  }

  const label = PERSONA_LABEL[persona];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <Card size="sm" className="w-full max-w-sm rounded-3xl text-center">
        <CardContent className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-xl font-bold text-ink">
            Switch to the {label} persona to view this
          </h1>
          <p className="text-sm text-muted-ink">
            This part of the demo is built for a {label}. Switch personas to
            continue.
          </p>
          <Button
            onClick={() => switchPersona(DEMO_USER_BY_PERSONA[persona])}
            className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
          >
            Switch to {label}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
