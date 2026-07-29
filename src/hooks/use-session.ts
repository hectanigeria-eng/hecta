"use client";

import { useHectaStore } from "@/lib/store";
import type { User } from "@/lib/types";

export interface Session {
  user: User;
  isAnonymous: boolean;
  isIdentityVerified: boolean;
  isLandlordVerified: boolean;
}

// Defensive fallback for the (should-never-happen) case where activeUserId
// points at a user id no longer present in state. Mirrors the seeded
// anonymous user in src/lib/mock/users.ts.
const FALLBACK_ANONYMOUS_USER: User = {
  id: "anonymous",
  personaId: "anonymous",
  name: "Guest",
  identityVerified: false,
  landlordVerified: false,
};

export function useSession(): Session {
  const activeUserId = useHectaStore((state) => state.activeUserId);
  const users = useHectaStore((state) => state.users);
  const user =
    users.find((candidate) => candidate.id === activeUserId) ??
    FALLBACK_ANONYMOUS_USER;

  return {
    user,
    isAnonymous: user.personaId === "anonymous",
    isIdentityVerified: user.identityVerified,
    isLandlordVerified: user.landlordVerified,
  };
}
