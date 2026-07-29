"use client";

import {
  ClockCounterClockwiseIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { locationLabel } from "@/constants/locations";
import { PROPERTY_TYPE_LABELS } from "@/constants/marketplace";
import {
  formatNaira,
  formatRelativeDays,
  pricePeriodLabel,
} from "@/lib/format";
import { totalMoveInCost } from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ListingCardView = "grid" | "list";

interface ListingCardProps {
  listing: Listing;
  view?: ListingCardView;
  /**
   * Set on the handful of cards that render above the fold so their photo
   * preloads instead of lazy-loading — the results grid's first row is the
   * page's LCP element. Everything else stays lazy.
   */
  priority?: boolean;
}

// Grid cards sit in a 2-column grid inside the ~58%-wide results column on
// large screens; list cards use a fixed 16rem rail that collapses to
// full-bleed below `sm`.
const GRID_IMAGE_SIZES =
  "(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw";
const LIST_IMAGE_SIZES = "(min-width: 640px) 16rem, 100vw";

export function ListingCard({
  listing,
  view = "grid",
  priority = false,
}: ListingCardProps) {
  const isList = view === "list";

  // Selecting the boolean (not the saved-ids array) keeps the snapshot a
  // primitive, so a card never re-renders because some *other* listing was
  // saved and `useSyncExternalStore` never sees a fresh array identity.
  const isSaved = useHectaStore((state) =>
    (state.savedByUser[state.activeUserId] ?? []).includes(listing.id),
  );
  const toggleSaved = useHectaStore((state) => state.toggleSaved);

  // Task 11 replaces the body of this one handler with the verification gate
  // (anonymous seekers get a sign-in prompt instead of an immediate toggle).
  // It is the component's only call into the store's save action — keep it
  // that way so the swap stays a one-line change.
  function handleToggleSaved() {
    toggleSaved(listing.id);
  }

  const place = locationLabel(
    listing.location.state,
    listing.location.cityLga,
    listing.location.area,
  );
  const specs = [
    listing.bedrooms > 0 ? `${listing.bedrooms} bd` : undefined,
    listing.bathrooms > 0 ? `${listing.bathrooms} ba` : undefined,
    listing.toilets > 0
      ? `${listing.toilets} ${listing.toilets === 1 ? "toilet" : "toilets"}`
      : undefined,
    PROPERTY_TYPE_LABELS[listing.propertyType],
  ].filter((part) => part !== undefined);

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-shadow duration-200 hover:shadow-lg has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary-500",
        isList ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-paper-2",
          isList
            ? "aspect-[4/3] w-full sm:aspect-auto sm:w-64 sm:self-stretch"
            : "aspect-[4/3] w-full",
        )}
      >
        <Image
          src={listing.images[0]}
          alt={place ? `${listing.title} in ${place}` : listing.title}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={isList ? LIST_IMAGE_SIZES : GRID_IMAGE_SIZES}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {listing.verifiedProperty && (
          <Badge className="absolute top-3 left-3 gap-1 rounded-full bg-primary-500 px-2.5 py-1.5 text-primary-foreground shadow-sm">
            <ShieldCheckIcon weight="fill" />
            Verified
          </Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={
            isSaved
              ? `Remove ${listing.title} from saved homes`
              : `Save ${listing.title}`
          }
          aria-pressed={isSaved}
          onClick={handleToggleSaved}
          className="absolute top-2 right-2 z-10 rounded-full bg-card/85 text-ink backdrop-blur-sm hover:bg-card"
        >
          <HeartIcon
            weight={isSaved ? "fill" : "regular"}
            className={cn("size-5", isSaved && "text-primary-600")}
          />
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <p className="font-heading text-xl leading-tight font-bold text-ink">
          {formatNaira(listing.price)}
          <span className="text-sm font-medium text-muted-ink">
            {pricePeriodLabel(listing.pricePeriod)}
          </span>
        </p>
        <p className="text-xs text-muted-ink">
          {formatNaira(totalMoveInCost(listing))} total move-in
        </p>

        <h3 className="mt-1.5 line-clamp-1 text-sm font-semibold text-ink">
          <Link
            href={`/listings/${listing.id}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {listing.title}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted-ink">{specs.join(" · ")}</p>
        <p className="truncate text-xs text-muted-ink">{place}</p>

        <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted-ink">
          <ClockCounterClockwiseIcon
            weight="bold"
            className="size-3.5 shrink-0 text-secondary-700"
          />
          <span className="truncate">
            Confirmed available{" "}
            {formatRelativeDays(listing.lastConfirmedAvailableAt)}
          </span>
        </p>
      </div>
    </article>
  );
}

export function ListingCardSkeleton({
  view = "grid",
}: {
  view?: ListingCardView;
}) {
  const isList = view === "list";
  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl bg-card ring-1 ring-border",
        isList ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <Skeleton
        className={cn(
          "shrink-0 rounded-none",
          isList
            ? "aspect-[4/3] w-full sm:aspect-auto sm:w-64"
            : "aspect-[4/3] w-full",
        )}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="mt-1.5 h-4 w-full rounded-md" />
        <Skeleton className="h-3 w-40 rounded-md" />
        <Skeleton className="mt-3 h-3 w-36 rounded-md" />
      </div>
    </div>
  );
}
