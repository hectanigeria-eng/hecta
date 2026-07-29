"use client";

import {
  BuildingsIcon,
  ClockIcon,
  HeartIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";

interface StatTile {
  label: string;
  value: number;
  icon: ReactNode;
}

/**
 * At-a-glance tiles for the landlord's portfolio. Kept to four numbers with
 * no drill-down here — the point is a legible summary, not a report; the
 * dedicated `/dashboard/listings` and `/dashboard/applications` pages (Tasks
 * 15–16) are where a landlord acts on the detail.
 */
export function OverviewStats() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const listings = useHectaStore((state) => state.listings);
  const applications = useHectaStore((state) => state.applications);
  const savedByUser = useHectaStore((state) => state.savedByUser);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton placeholder, never reordered
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const myListings = listings.filter(
    (listing) => listing.landlordId === user.id,
  );
  const myListingIds = new Set(myListings.map((listing) => listing.id));

  const activeCount = myListings.filter(
    (listing) => listing.status === "active",
  ).length;
  const pendingReviewCount = myListings.filter(
    (listing) => listing.status === "pending_review",
  ).length;
  const awaitingReplyCount = applications.filter(
    (application) =>
      myListingIds.has(application.listingId) &&
      (application.status === "submitted" || application.status === "viewed"),
  ).length;
  const savesCount = Object.values(savedByUser).reduce(
    (total, savedIds) =>
      total + savedIds.filter((id) => myListingIds.has(id)).length,
    0,
  );

  const stats: StatTile[] = [
    {
      label: "Active listings",
      value: activeCount,
      icon: <BuildingsIcon aria-hidden className="size-5" />,
    },
    {
      label: "Pending review",
      value: pendingReviewCount,
      icon: <ClockIcon aria-hidden className="size-5" />,
    },
    {
      label: "Applications awaiting reply",
      value: awaitingReplyCount,
      icon: <PaperPlaneTiltIcon aria-hidden className="size-5" />,
    },
    {
      label: "Saves on your homes",
      value: savesCount,
      icon: <HeartIcon aria-hidden className="size-5" />,
    },
  ];

  return (
    <section
      aria-label="Your listings at a glance"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <Card
          key={stat.label}
          size="sm"
          className="rounded-2xl ring-1 ring-border"
        >
          <CardContent className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-ink uppercase">
              {stat.icon}
              {stat.label}
            </span>
            <span className="font-heading text-3xl font-bold text-ink tabular-nums">
              {stat.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
