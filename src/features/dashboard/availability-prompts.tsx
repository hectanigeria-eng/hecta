"use client";

import { EyeSlashIcon, WarningIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { isReconfirmDue } from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type { Listing } from "@/lib/types";

/**
 * The ghost-listing prevention flow, and the single most important
 * interaction on this page. A listing that's overdue for reconfirmation (or
 * already hidden) gets exactly one legible question and two buttons — no
 * form, no jargon — because this is the interaction most likely to make or
 * break the platform's core promise for a non-technical Nigerian landlord.
 */
export function AvailabilityPrompts() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const listings = useHectaStore((state) => state.listings);
  const confirmAvailability = useHectaStore(
    (state) => state.confirmAvailability,
  );
  const setListingStatus = useHectaStore((state) => state.setListingStatus);

  // Frozen once per mount rather than recomputed on every render — the
  // due/not-due boundary only needs to be "now" as of when the page loaded.
  const now = useMemo(() => new Date().toISOString(), []);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const myListings = listings.filter(
    (listing) => listing.landlordId === user.id,
  );
  // Only listings currently shown in search ("active") can go stale in a way
  // that matters here — a listing already let, sold, suspended, or in draft
  // isn't being advertised, so asking "is it still available?" would be
  // meaningless noise for the landlord.
  const due = myListings.filter(
    (listing) => listing.status === "active" && isReconfirmDue(listing, now),
  );
  const hidden = myListings.filter((listing) => listing.status === "hidden");

  if (due.length === 0 && hidden.length === 0) {
    return (
      <Card size="sm" className="rounded-2xl ring-1 ring-border">
        <CardContent>
          <p className="text-sm text-muted-ink">
            All your listings are confirmed current — nothing needs your
            attention right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  function handleConfirm(listing: Listing) {
    confirmAvailability(listing.id);
    toast.success(
      "Freshness updated — seekers can see this listing is current",
    );
  }

  function handleTaken(listing: Listing) {
    setListingStatus(listing.id, "let");
    toast.info(`Marked "${listing.title}" as let — hidden from search.`);
  }

  function handleReactivate(listing: Listing) {
    confirmAvailability(listing.id);
    setListingStatus(listing.id, "active");
    toast.success("Reactivated — visible in search again");
  }

  return (
    <section aria-label="Listing availability" className="flex flex-col gap-6">
      {due.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-bold text-ink">
            Still available?
          </h2>
          {due.map((listing) => (
            <Card
              key={listing.id}
              size="sm"
              className="rounded-2xl bg-secondary-50 ring-1 ring-secondary-300"
            >
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <WarningIcon
                    weight="fill"
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 text-secondary-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-secondary-900">
                      Is {listing.title} still available?
                    </p>
                    <p className="text-xs text-secondary-800">
                      Last confirmed{" "}
                      {formatDate(listing.lastConfirmedAvailableAt)}. Confirm so
                      seekers know it&apos;s current.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(listing)}
                    className="h-9 rounded-full text-xs font-semibold tracking-normal normal-case"
                  >
                    Yes, still available
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTaken(listing)}
                    className="h-9 rounded-full text-xs font-semibold tracking-normal normal-case"
                  >
                    No, it&apos;s taken
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-bold text-ink">
            Hidden from search
          </h2>
          {hidden.map((listing) => (
            <Card
              key={listing.id}
              size="sm"
              className="rounded-2xl ring-1 ring-border"
            >
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <EyeSlashIcon
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 text-muted-ink"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {listing.title}
                    </p>
                    <p className="text-xs text-muted-ink">
                      Not shown in search results.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleReactivate(listing)}
                  className="h-9 shrink-0 rounded-full text-xs font-semibold tracking-normal normal-case"
                >
                  Reactivate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
