"use client";

import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MONTHLY_APPLICATION_LIMIT } from "@/constants/marketplace";
import { StatusChip } from "@/features/apply/status-chip";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { remainingQuota } from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type { Application, Listing, MessageThread } from "@/lib/types";

export function ApplicationsList() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const applications = useHectaStore((state) => state.applications);
  const listings = useHectaStore((state) => state.listings);
  const threads = useHectaStore((state) => state.threads);

  const mine = useMemo(
    () =>
      applications
        .filter((application) => application.applicantId === user.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [applications, user.id],
  );

  const remaining = useMemo(
    () => remainingQuota(applications, user.id, new Date().toISOString()),
    [applications, user.id],
  );

  if (!hydrated) {
    return <ApplicationsListSkeleton />;
  }

  if (mine.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <PaperPlaneTiltIcon
          weight="duotone"
          className="size-12 text-muted-ink"
        />
        <h2 className="font-heading text-lg font-semibold text-ink">
          No applications yet
        </h2>
        <p className="max-w-sm text-sm text-muted-ink">
          When you apply for a home, it&apos;ll show up here so you can track
          its status.
        </p>
        <Button
          asChild
          className="mt-2 h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
        >
          <Link href="/search">Browse homes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex list-none flex-col gap-3 p-0">
        {mine.map((application) => (
          <ApplicationRow
            key={application.id}
            application={application}
            listing={listings.find(
              (listing) => listing.id === application.listingId,
            )}
            thread={threads.find(
              (thread) => thread.applicationId === application.id,
            )}
          />
        ))}
      </ul>
      <p className="text-center text-xs text-muted-ink">
        {remaining.month} of {MONTHLY_APPLICATION_LIMIT} applications left this
        month.
      </p>
    </div>
  );
}

interface ApplicationRowProps {
  application: Application;
  listing: Listing | undefined;
  thread: MessageThread | undefined;
}

function ApplicationRow({ application, listing, thread }: ApplicationRowProps) {
  return (
    <li className="flex items-center gap-4 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-paper-2">
        {listing !== undefined && (
          <Image
            src={listing.images[0]}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {listing !== undefined ? (
            <Link
              href={`/listings/${listing.id}`}
              className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {listing.title}
            </Link>
          ) : (
            "Listing no longer available"
          )}
        </p>
        <p className="text-xs text-muted-ink">
          Applied {formatDate(application.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusChip status={application.status} />
        {thread !== undefined && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1 rounded-full text-xs font-semibold tracking-normal normal-case"
          >
            <Link href={`/messages?thread=${thread.id}`}>Message landlord</Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function ApplicationsListSkeleton() {
  const keys = Array.from({ length: 3 }, (_, index) => `app-skeleton-${index}`);
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {keys.map((key) => (
        <Skeleton key={key} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}
