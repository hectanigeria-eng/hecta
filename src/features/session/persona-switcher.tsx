"use client";

import { CheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useResetDemo } from "@/features/session/reset-demo-button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";
import type { PersonaId } from "@/lib/types";

export interface MobileNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface SwitchablePersona {
  userId: string;
  personaId: PersonaId;
  name: string;
  caption: string;
}

// The only four personas a demo user can switch between (see
// src/lib/mock/users.ts) — the other seed users exist purely as authors of
// seeded listings/applications and are never selectable here.
const SWITCHABLE_PERSONAS: SwitchablePersona[] = [
  {
    userId: "anonymous",
    personaId: "anonymous",
    name: "Guest",
    caption: "Browsing without an account",
  },
  {
    userId: "user-tunde",
    personaId: "tenant",
    name: "Tunde Bakare",
    caption: "Verified tenant",
  },
  {
    userId: "user-amaka",
    personaId: "landlord",
    name: "Amaka Obi",
    caption: "Verified landlord",
  },
  {
    userId: "user-admin",
    personaId: "admin",
    name: "Hecta Admin",
    caption: "Platform admin",
  },
];

const PERSONA_HOME: Record<PersonaId, string> = {
  anonymous: "/search",
  tenant: "/search",
  landlord: "/dashboard",
  admin: "/admin",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts.at(0)?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export interface PersonaSwitcherProps {
  /**
   * Extra links rendered at the top of the dropdown, visible only below the
   * `md` breakpoint — lets a header collapse its icon-button nav into this
   * same avatar dropdown on small screens without duplicating menu state.
   */
  mobileNavItems?: MobileNavItem[];
}

export function PersonaSwitcher({ mobileNavItems }: PersonaSwitcherProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useSession();
  const switchPersona = useHectaStore((state) => state.switchPersona);
  const handleResetDemo = useResetDemo();

  if (!hydrated) {
    return <Skeleton className="size-11 rounded-full" aria-hidden />;
  }

  function handleSelectPersona(persona: SwitchablePersona) {
    switchPersona(persona.userId);
    router.push(PERSONA_HOME[persona.personaId]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${user.name}`}
          className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {mobileNavItems !== undefined && mobileNavItems.length > 0 && (
          <>
            {mobileNavItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild className="md:hidden">
                <Link href={item.href} className="min-h-11">
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="md:hidden" />
          </>
        )}

        <DropdownMenuLabel>Switch persona</DropdownMenuLabel>
        {SWITCHABLE_PERSONAS.map((persona) => {
          const isActive = user.id === persona.userId;
          return (
            <DropdownMenuItem
              key={persona.userId}
              onSelect={() => handleSelectPersona(persona)}
              className="min-h-11"
            >
              <span className="flex flex-1 flex-col items-start gap-0.5 normal-case tracking-normal">
                <span className="text-sm font-semibold text-foreground">
                  {persona.name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {persona.caption}
                </span>
              </span>
              {isActive && (
                <CheckIcon
                  className="size-4 shrink-0 text-primary"
                  aria-hidden
                />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleResetDemo} className="min-h-11">
          Reset demo data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
