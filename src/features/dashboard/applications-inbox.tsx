"use client";

import {
  ChatCircleIcon,
  CheckIcon,
  PaperPlaneTiltIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/features/apply/status-chip";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { formatDate, formatNaira } from "@/lib/format";
import {
  qualificationScore,
  sortApplicationsByQualification,
  totalMoveInCost,
} from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type {
  Application,
  Listing,
  MessageThread,
  PaymentPlan,
  Timeline,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const TIMELINE_LABEL: Record<Timeline, string> = {
  immediate: "Immediate",
  within_1_month: "Within 1 month",
  "1_3_months": "1–3 months",
  exploring: "Just exploring",
};

const PAYMENT_LABEL: Record<PaymentPlan, string> = {
  full: "Full payment",
  mortgage: "Mortgage",
  instalments: "Instalments",
};

const STRONG_MATCH_THRESHOLD = 70;
const MEDIUM_MATCH_THRESHOLD = 40;

interface QualificationTier {
  label: string;
  className: string;
}

/**
 * Maps a 0–100 `qualificationScore` to the three-tier badge the landlord
 * scans first. The word ("Strong"/"Medium"/"Low") plus the number both carry
 * the meaning — colour is decoration, never the only signal.
 */
function qualificationTier(score: number): QualificationTier {
  if (score >= STRONG_MATCH_THRESHOLD) {
    return {
      label: `Strong match ${score}`,
      className: "bg-primary-100 text-primary-800",
    };
  }
  if (score >= MEDIUM_MATCH_THRESHOLD) {
    return {
      label: `Medium match ${score}`,
      className: "bg-secondary-100 text-secondary-900",
    };
  }
  return {
    label: `Low match ${score}`,
    className: "bg-muted text-muted-foreground",
  };
}

interface ListingGroup {
  listing: Listing;
  applications: Application[];
}

/**
 * Landlord's applications inbox — every application on the active landlord's
 * own listings, grouped by listing and sorted within each group by
 * `sortApplicationsByQualification` so the most qualified applicant (ready to
 * move, funds in hand, budget that covers the real move-in cost) is always
 * first. That ordering is the core value proposition of this screen, so it
 * is never re-derived locally — it comes straight from the shared
 * `sortApplicationsByQualification` / `qualificationScore` helpers.
 */
export function ApplicationsInbox() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const applications = useHectaStore((state) => state.applications);
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);
  const threads = useHectaStore((state) => state.threads);
  const markApplicationStatus = useHectaStore(
    (state) => state.markApplicationStatus,
  );

  const [declineTarget, setDeclineTarget] = useState<Application | null>(null);

  const groups = useMemo<ListingGroup[]>(() => {
    const myListingIds = new Set(
      listings
        .filter((listing) => listing.landlordId === user.id)
        .map((listing) => listing.id),
    );
    const mine = applications.filter((application) =>
      myListingIds.has(application.listingId),
    );
    const sorted = sortApplicationsByQualification(mine, listings);

    const order: string[] = [];
    const byListing = new Map<string, Application[]>();
    for (const application of sorted) {
      if (!byListing.has(application.listingId)) {
        order.push(application.listingId);
        byListing.set(application.listingId, []);
      }
      byListing.get(application.listingId)?.push(application);
    }

    const result: ListingGroup[] = [];
    for (const listingId of order) {
      const listing = listings.find((candidate) => candidate.id === listingId);
      if (listing === undefined) continue;
      result.push({ listing, applications: byListing.get(listingId) ?? [] });
    }
    return result;
  }, [applications, listings, user.id]);

  function nameFor(applicantId: string): string {
    return (
      users.find((candidate) => candidate.id === applicantId)?.name ??
      "Applicant"
    );
  }

  function handleAccept(application: Application) {
    markApplicationStatus(application.id, "accepted");
    toast.success("Accepted — messaging opened");
  }

  function handleRequestInfo(application: Application) {
    markApplicationStatus(application.id, "info_requested");
    toast.success("Info requested — messaging opened");
  }

  function handleDecline() {
    if (declineTarget === null) return;
    const name = nameFor(declineTarget.applicantId);
    markApplicationStatus(declineTarget.id, "declined");
    toast.info(`Declined ${name}'s application.`);
    setDeclineTarget(null);
  }

  if (!hydrated) {
    return <ApplicationsInboxSkeleton />;
  }

  if (groups.length === 0) {
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
          When seekers apply to your listings, they&apos;ll show up here —
          sorted so the most qualified applicant is always first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ listing, applications: listingApplications }) => (
        <section key={listing.id} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="font-heading text-lg font-bold text-ink">
              {listing.title}
            </h2>
            <span className="text-xs text-muted-ink">
              {listingApplications.length} application
              {listingApplications.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="flex list-none flex-col gap-3 p-0">
            {listingApplications.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                listing={listing}
                applicantName={nameFor(application.applicantId)}
                thread={threads.find(
                  (thread) => thread.applicationId === application.id,
                )}
                onAccept={handleAccept}
                onDecline={setDeclineTarget}
                onRequestInfo={handleRequestInfo}
              />
            ))}
          </ul>
        </section>
      ))}

      <Dialog
        open={declineTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeclineTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this application?</DialogTitle>
            <DialogDescription>
              {declineTarget !== null &&
                `${nameFor(declineTarget.applicantId)} will see this application marked as declined. This can't be undone from here.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeclineTarget(null)}
              className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDecline}
              className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
            >
              Decline application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ApplicationRowProps {
  application: Application;
  listing: Listing;
  applicantName: string;
  thread: MessageThread | undefined;
  onAccept: (application: Application) => void;
  onDecline: (application: Application) => void;
  onRequestInfo: (application: Application) => void;
}

function ApplicationRow({
  application,
  listing,
  applicantName,
  thread,
  onAccept,
  onDecline,
  onRequestInfo,
}: ApplicationRowProps) {
  const score = qualificationScore(application.intentProfile, listing);
  const tier = qualificationTier(score);
  const total = totalMoveInCost(listing);
  const meetsBudget = application.intentProfile.budgetMax >= total;
  const canAct =
    application.status !== "accepted" && application.status !== "declined";

  return (
    <li>
      <Card size="sm" className="rounded-2xl ring-1 ring-border">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">{applicantName}</p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[0.625rem] font-semibold tracking-wide uppercase",
                  tier.className,
                )}
              >
                {tier.label}
              </span>
            </div>
            <StatusChip status={application.status} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip>{TIMELINE_LABEL[application.intentProfile.timeline]}</Chip>
            <Chip>{PAYMENT_LABEL[application.intentProfile.paymentPlan]}</Chip>
            <Chip>
              {formatNaira(application.intentProfile.budgetMin)}–
              {formatNaira(application.intentProfile.budgetMax)} budget
            </Chip>
            <Chip
              className={
                meetsBudget ? "text-primary-700" : "text-secondary-800"
              }
            >
              {meetsBudget ? (
                <CheckIcon
                  weight="bold"
                  aria-hidden
                  className="size-3.5 shrink-0"
                />
              ) : (
                <WarningIcon
                  weight="fill"
                  aria-hidden
                  className="size-3.5 shrink-0"
                />
              )}
              {meetsBudget
                ? "Covers move-in cost"
                : `Below move-in cost (${formatNaira(total)})`}
            </Chip>
          </div>

          <p className="line-clamp-2 text-sm text-muted-ink">
            &ldquo;{application.message}&rdquo;
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-ink">
              Applied {formatDate(application.createdAt)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {thread !== undefined && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-11 gap-1 rounded-full text-xs font-semibold tracking-normal normal-case"
                >
                  <Link href={`/dashboard/messages?thread=${thread.id}`}>
                    <ChatCircleIcon aria-hidden className="size-3.5" />
                    Message {applicantName}
                  </Link>
                </Button>
              )}
              {canAct && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Request more info from ${applicantName}`}
                    onClick={() => onRequestInfo(application)}
                    className="h-11 rounded-full text-xs font-semibold tracking-normal normal-case"
                  >
                    Request info
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    aria-label={`Decline ${applicantName}'s application`}
                    onClick={() => onDecline(application)}
                    className="h-11 rounded-full text-xs font-semibold tracking-normal normal-case"
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    aria-label={`Accept ${applicantName}'s application`}
                    onClick={() => onAccept(application)}
                    className="h-11 rounded-full text-xs font-semibold tracking-normal normal-case"
                  >
                    Accept
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-border",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ApplicationsInboxSkeleton() {
  const keys = Array.from(
    { length: 3 },
    (_, index) => `app-inbox-skeleton-${index}`,
  );
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {keys.map((key) => (
        <Skeleton key={key} className="h-36 w-full rounded-2xl" />
      ))}
    </div>
  );
}
