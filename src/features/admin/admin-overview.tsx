"use client";

import {
  ArrowRightIcon,
  FlagIcon,
  HouseLineIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { isDecidedVerification } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { useHectaStore } from "@/lib/store";
import type { Listing, ListingStatus, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTIONABLE_VERIFICATION_STATUSES = new Set([
  "submitted",
  "under_review",
  "info_requested",
]);

const RECENT_DECISIONS_LIMIT = 5;

const VERIFICATION_DECISION_LABEL: Record<VerificationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  info_requested: "More documents requested",
};

// Only "active" and "rejected" are ever set by `reviewListing` — the two
// outcomes of an admin's listing-approval decision. Other terminal statuses
// (suspended, hidden, let, sold) come from elsewhere in the product (report
// auto-suspension, landlord actions) and aren't reviewer decisions.
const DECIDED_LISTING_STATUSES: ReadonlySet<ListingStatus> = new Set([
  "active",
  "rejected",
]);

const LISTING_DECISION_LABEL: Record<"active" | "rejected", string> = {
  active: "Approved",
  rejected: "Rejected",
};

interface QueueCardConfig {
  key: string;
  label: string;
  description: string;
  count: number;
  href: string;
  icon: ReactNode;
}

type DecisionTone = "positive" | "negative" | "neutral";

interface RecentDecisionItem {
  id: string;
  headline: string;
  statusLabel: string;
  tone: DecisionTone;
  timestamp: string;
  href: string;
}

const VERIFICATION_DECISION_TONE: Record<VerificationStatus, DecisionTone> = {
  submitted: "neutral",
  under_review: "neutral",
  approved: "positive",
  rejected: "negative",
  info_requested: "neutral",
};

/**
 * Landing page of the admin console: three at-a-glance queue counts plus a
 * short "recent decisions" trail. Neither the verification's nor the
 * listing's decision instant is tracked separately from when it was
 * created/submitted in this prototype's data model, so the only timestamp
 * available (`submittedAt` / `createdAt`) doubles as the sort key here — good
 * enough for "most recent first" in a demo with a handful of seed rows.
 */
export function AdminOverview() {
  const hydrated = useHydrated();
  const verifications = useHectaStore((state) => state.verifications);
  const listings = useHectaStore((state) => state.listings);
  const reports = useHectaStore((state) => state.reports);

  if (!hydrated) {
    return <AdminOverviewSkeleton />;
  }

  const pendingVerificationCount = verifications.filter((verification) =>
    ACTIONABLE_VERIFICATION_STATUSES.has(verification.status),
  ).length;
  const pendingListingCount = listings.filter(
    (listing) => listing.status === "pending_review",
  ).length;
  const openReportCount = reports.filter(
    (report) => report.status === "open",
  ).length;

  const queueCards: QueueCardConfig[] = [
    {
      key: "verifications",
      label: "Landlord verifications",
      description: "Ownership docs awaiting a decision.",
      count: pendingVerificationCount,
      href: "/admin/verifications",
      icon: <SealCheckIcon aria-hidden className="size-5" />,
    },
    {
      key: "listings",
      label: "Listing approvals",
      description: "New listings waiting to go live.",
      count: pendingListingCount,
      href: "/admin/listings",
      icon: <HouseLineIcon aria-hidden className="size-5" />,
    },
    {
      key: "reports",
      label: "Open reports",
      description: "Flags raised by tenants and seekers.",
      count: openReportCount,
      href: "/admin/reports",
      icon: <FlagIcon aria-hidden className="size-5" />,
    },
  ];

  const verificationDecisions: RecentDecisionItem[] = verifications
    .filter((verification) => isDecidedVerification(verification.status))
    .map((verification) => ({
      id: verification.id,
      headline: verification.landlordName,
      statusLabel: VERIFICATION_DECISION_LABEL[verification.status],
      tone: VERIFICATION_DECISION_TONE[verification.status],
      timestamp: verification.submittedAt,
      href: "/admin/verifications",
    }));

  const listingDecisions: RecentDecisionItem[] = listings
    .filter((listing): listing is Listing & { status: "active" | "rejected" } =>
      DECIDED_LISTING_STATUSES.has(listing.status),
    )
    .map((listing) => ({
      id: listing.id,
      headline: listing.title,
      statusLabel: LISTING_DECISION_LABEL[listing.status],
      tone: listing.status === "active" ? "positive" : "negative",
      timestamp: listing.createdAt,
      href: "/admin/listings",
    }));

  const recentDecisions = [...verificationDecisions, ...listingDecisions]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, RECENT_DECISIONS_LIMIT);

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Review queues" className="grid gap-4 sm:grid-cols-3">
        {queueCards.map((queue) => (
          <Card key={queue.key} className="rounded-2xl ring-1 ring-border">
            <CardContent className="flex flex-col gap-4">
              <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-ink uppercase">
                {queue.icon}
                {queue.label}
              </span>
              <span className="font-heading text-3xl font-bold text-ink tabular-nums">
                {queue.count}
              </span>
              <p className="text-sm text-muted-ink">{queue.description}</p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-11 self-start rounded-full text-xs font-semibold tracking-normal normal-case"
              >
                <Link href={queue.href}>
                  Review
                  <ArrowRightIcon
                    weight="bold"
                    aria-hidden
                    className="size-3.5"
                  />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-label="Recent decisions" className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">
          Recent decisions
        </h2>
        {recentDecisions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-ink">
            No decisions have been recorded yet.
          </p>
        ) : (
          <Card className="rounded-2xl ring-1 ring-border">
            <CardContent className="flex flex-col gap-0 divide-y divide-border">
              {recentDecisions.map((decision) => (
                <Link
                  key={decision.id}
                  href={decision.href}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-ink">
                    {decision.headline}
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold tracking-normal normal-case",
                        decision.tone === "negative" &&
                          "bg-destructive/10 text-destructive",
                        decision.tone === "positive" &&
                          "bg-primary-100 text-primary-800",
                        decision.tone === "neutral" &&
                          "bg-secondary-100 text-secondary-900",
                      )}
                    >
                      {decision.statusLabel}
                    </Badge>
                    <span className="text-xs text-muted-ink">
                      {formatDate(decision.timestamp)}
                    </span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function AdminOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton placeholder, never reordered
          <Skeleton key={index} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
