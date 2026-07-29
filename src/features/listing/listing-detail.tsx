"use client";

import {
  CaretRightIcon,
  ClockCounterClockwiseIcon,
  HouseLineIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { locationLabel } from "@/constants/locations";
import { ApplyDialog } from "@/features/apply/apply-dialog";
import { ActionBar } from "@/features/listing/action-bar";
import { CostBreakdownCard } from "@/features/listing/cost-breakdown-card";
import { Gallery } from "@/features/listing/gallery";
import { LandlordCard } from "@/features/listing/landlord-card";
import { SimilarListings } from "@/features/listing/similar-listings";
import { SpecChips } from "@/features/listing/spec-chips";
import { ListingMap } from "@/features/search/listing-map";
import { GateDialog } from "@/features/verification/gate-dialog";
import { useGate } from "@/features/verification/use-gate";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate, formatRelativeDays } from "@/lib/format";
import { similarListings } from "@/lib/marketplace";
import { buildSearchUrl } from "@/lib/search-params";
import { useHectaStore } from "@/lib/store";
import type {
  Furnishing,
  LeaseType,
  Listing,
  ServicedLevel,
} from "@/lib/types";

const SIMILAR_LIMIT = 3;

const SERVICED_LABELS: Record<ServicedLevel, string> = {
  none: "Not serviced",
  semi: "Semi-serviced",
  full: "Fully serviced",
};

const FURNISHING_LABELS: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  furnished: "Furnished",
};

const LEASE_LABELS: Record<LeaseType, string> = {
  short_term: "Short term",
  long_term: "Long term",
};

interface TermEntry {
  label: string;
  value: string;
}

function termsFor(listing: Listing): TermEntry[] {
  return [
    { label: "Serviced", value: SERVICED_LABELS[listing.serviced] },
    { label: "Furnishing", value: FURNISHING_LABELS[listing.furnishing] },
    { label: "Power supply", value: listing.powerSupply },
    { label: "Water supply", value: listing.waterSupply },
    { label: "Lease type", value: LEASE_LABELS[listing.leaseType] },
    { label: "Available from", value: formatDate(listing.moveInDate) },
    { label: "Pets", value: listing.petsAllowed ? "Allowed" : "Not allowed" },
  ];
}

interface ListingDetailProps {
  id: string;
}

export function ListingDetail({ id }: ListingDetailProps) {
  const hydrated = useHydrated();
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);
  const verifications = useHectaStore((state) => state.verifications);
  const toggleSaved = useHectaStore((state) => state.toggleSaved);
  const isSaved = useHectaStore((state) =>
    (state.savedByUser[state.activeUserId] ?? []).includes(id),
  );

  const listing = useMemo(
    () => listings.find((candidate) => candidate.id === id),
    [listings, id],
  );

  // Scans the whole listing set, so it is memoised against the store array
  // identity rather than recomputed on every save/toast re-render.
  const similar = useMemo(
    () =>
      listing === undefined
        ? []
        : similarListings(listing, listings, SIMILAR_LIMIT),
    [listing, listings],
  );

  const { requireVerified, gateOpen, setGateOpen } = useGate();

  const [applyOpen, setApplyOpen] = useState(false);
  // Contact reuses the apply dialog with different copy — per PRD AP-04,
  // messaging a landlord only unlocks once the seeker has applied, so there
  // is no separate "contact" flow to build.
  const [applyOrigin, setApplyOrigin] = useState<"apply" | "contact">("apply");

  // ─── Action handlers — Task 13 still owns handleReport. ────────────────
  // Task 11 wraps all three below in the verification gate; Task 12 wires
  // apply/contact to the real ApplyDialog. This remains the only place this
  // page decides what an action does.
  function handleSave() {
    requireVerified(() => toggleSaved(id));
  }
  function handleApply() {
    requireVerified(() => {
      setApplyOrigin("apply");
      setApplyOpen(true);
    });
  }
  function handleContact() {
    requireVerified(() => {
      setApplyOrigin("contact");
      setApplyOpen(true);
    });
  }
  function handleReport() {
    toast.info("Reporting a listing is coming in the next task.");
  }
  // ─── End action handlers ───────────────────────────────────────────────

  if (!hydrated) {
    return <ListingDetailSkeleton />;
  }

  if (listing === undefined) {
    return <ListingNotFound />;
  }

  const place = locationLabel(
    listing.location.state,
    listing.location.cityLga,
    listing.location.area,
  );
  const fullAddress = [listing.location.street, place]
    .filter((part) => Boolean(part))
    .join(", ");

  const landlord = users.find((user) => user.id === listing.landlordId);
  const landlordName = landlord?.name ?? "Hecta landlord";
  const lastVerifiedAt = verifications.find(
    (verification) =>
      verification.landlordId === listing.landlordId &&
      verification.status === "approved",
  )?.submittedAt;

  const searchUrl = buildSearchUrl({
    intent: listing.intent,
    state: listing.location.state,
    city: listing.location.cityLga,
    page: 1,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <GateDialog open={gateOpen} onOpenChange={setGateOpen} />
      <ApplyDialog
        listing={listing}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        origin={applyOrigin}
      />
      <nav aria-label="Breadcrumb">
        <ol className="-my-3 flex list-none items-center gap-1 p-0 text-xs text-muted-ink">
          <li>
            {/* min-h-11 keeps the tap target at 44px on touch screens; the
                row's negative margin keeps the visual rhythm unchanged. */}
            <Link
              href={searchUrl}
              className="inline-flex min-h-11 items-center rounded-sm pr-1 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Search
            </Link>
          </li>
          <li aria-hidden className="flex items-center">
            <CaretRightIcon className="size-3" />
          </li>
          <li aria-current="page" className="truncate font-medium text-ink">
            {place || "This home"}
          </li>
        </ol>
      </nav>

      <header className="mt-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h1 className="font-heading text-2xl leading-tight font-bold text-ink sm:text-3xl">
            {listing.title}
          </h1>
          <Badge className="shrink-0 gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-xs tracking-normal text-secondary-900 normal-case ring-1 ring-secondary-300">
            <ClockCounterClockwiseIcon weight="bold" />
            Confirmed {formatRelativeDays(listing.lastConfirmedAvailableAt)}
          </Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-ink">
          <MapPinIcon weight="fill" aria-hidden className="size-4 shrink-0" />
          {fullAddress}
        </p>
      </header>

      <div className="mt-5">
        <Gallery images={listing.images} title={listing.title} place={place} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10">
        <article className="flex min-w-0 flex-col gap-8">
          <SpecChips listing={listing} />

          <section
            aria-labelledby="about-heading"
            className="flex flex-col gap-3 border-t border-border pt-8"
          >
            <h2
              id="about-heading"
              className="font-heading text-xl font-bold text-ink"
            >
              About this home
            </h2>
            <p className="text-sm leading-relaxed text-ink-2">
              {listing.description}
            </p>
          </section>

          {listing.amenities.length > 0 && (
            <section
              aria-labelledby="amenities-heading"
              className="flex flex-col gap-4 border-t border-border pt-8"
            >
              <h2
                id="amenities-heading"
                className="font-heading text-xl font-bold text-ink"
              >
                Amenities
              </h2>
              <ul className="grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
                {listing.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-ink"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section
            aria-labelledby="terms-heading"
            className="flex flex-col gap-4 border-t border-border pt-8"
          >
            <h2
              id="terms-heading"
              className="font-heading text-xl font-bold text-ink"
            >
              Utilities &amp; terms
            </h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {termsFor(listing).map((term) => (
                <div
                  key={term.label}
                  className="flex flex-col gap-0.5 border-b border-border pb-3"
                >
                  <dt className="text-xs tracking-wide text-muted-ink uppercase">
                    {term.label}
                  </dt>
                  <dd className="text-sm font-medium text-ink">{term.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="location-heading"
            className="flex flex-col gap-4 border-t border-border pt-8"
          >
            <h2
              id="location-heading"
              className="font-heading text-xl font-bold text-ink"
            >
              Location
            </h2>
            <p className="text-sm text-muted-ink">{fullAddress}</p>
            <ListingMap
              listings={[listing]}
              className="h-64 overflow-hidden rounded-2xl border"
            />
          </section>
        </article>

        <aside
          aria-label="Costs and landlord"
          className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20"
        >
          <CostBreakdownCard listing={listing}>
            <ActionBar
              listingTitle={listing.title}
              isSaved={isSaved}
              onApply={handleApply}
              onSave={handleSave}
              onContact={handleContact}
            />
          </CostBreakdownCard>

          <LandlordCard
            landlordName={landlordName}
            landlordVerified={landlord?.landlordVerified ?? false}
            verifiedProperty={listing.verifiedProperty}
            lastVerifiedAt={lastVerifiedAt}
            onReport={handleReport}
          />
        </aside>
      </div>

      <div className="mt-12">
        <SimilarListings listings={similar} />
      </div>
    </div>
  );
}

function ListingNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-4 py-24 text-center">
      <HouseLineIcon weight="duotone" className="size-12 text-muted-ink" />
      <h1 className="font-heading text-2xl font-bold text-ink">
        Listing not found
      </h1>
      <p className="text-sm text-muted-ink">
        This home is no longer listed on Hecta — it may have been let, sold, or
        taken down by the landlord.
      </p>
      <Button
        asChild
        className="mt-2 h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
      >
        <Link href="/search">Back to search</Link>
      </Button>
    </div>
  );
}

function ListingDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6" aria-hidden>
      <Skeleton className="h-3 w-40 rounded-md" />
      <Skeleton className="mt-4 h-8 w-2/3 rounded-md" />
      <Skeleton className="mt-2 h-4 w-48 rounded-md" />
      <Skeleton className="mt-5 aspect-[4/3] w-full rounded-3xl sm:aspect-[2/1]" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
