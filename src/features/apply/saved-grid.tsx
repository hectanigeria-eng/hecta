"use client";

import { HeartIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  ListingCard,
  ListingCardSkeleton,
} from "@/features/search/listing-card";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";

const SKELETON_KEYS = Array.from(
  { length: 4 },
  (_, index) => `saved-skeleton-${index}`,
);

// The grid's first row is visible without scrolling, so those photos are
// eagerly loaded to keep this page's LCP off a lazy image — mirrors
// `ABOVE_THE_FOLD_CARDS` in `search-results.tsx`.
const ABOVE_THE_FOLD_CARDS = 2;

// A stable fallback reference — `?? []` inline would allocate a new empty
// array on every call, which breaks the referential-equality check
// `useSyncExternalStore` (which Zustand's `useHectaStore` is built on) relies
// on to bail out of re-rendering, and trips React's
// "getServerSnapshot should be cached" warning during SSR/hydration.
const EMPTY_SAVED_IDS: readonly string[] = [];

export function SavedGrid() {
  const hydrated = useHydrated();
  const { isIdentityVerified } = useSession();
  const listings = useHectaStore((state) => state.listings);
  const savedIds = useHectaStore(
    (state) => state.savedByUser[state.activeUserId] ?? EMPTY_SAVED_IDS,
  );

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {SKELETON_KEYS.map((key) => (
          <ListingCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (!isIdentityVerified) {
    return (
      <EmptyState
        icon={
          <ShieldCheckIcon
            weight="duotone"
            className="size-12 text-muted-ink"
          />
        }
        title="Verify to save homes"
        description="Save your favourite listings and come back to them any time — verify your identity first, it takes under a minute."
        actionHref={`/verify?next=${encodeURIComponent("/saved")}`}
        actionLabel="Verify my identity"
      />
    );
  }

  const savedListings = listings.filter((listing) =>
    savedIds.includes(listing.id),
  );

  if (savedListings.length === 0) {
    return (
      <EmptyState
        icon={<HeartIcon weight="duotone" className="size-12 text-muted-ink" />}
        title="No saved homes yet"
        description="Tap the heart on any listing to save it here for later."
        actionHref="/search"
        actionLabel="Browse homes"
      />
    );
  }

  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {savedListings.map((listing, index) => (
        <li key={listing.id}>
          <ListingCard
            listing={listing}
            priority={index < ABOVE_THE_FOLD_CARDS}
          />
        </li>
      ))}
    </ul>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      {icon}
      <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-sm text-sm text-muted-ink">{description}</p>
      <Button
        asChild
        className="mt-2 h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
      >
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
