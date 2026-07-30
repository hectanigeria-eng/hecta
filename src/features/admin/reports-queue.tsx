"use client";

import { DotsThreeVerticalIcon, WarningIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AUTO_SUSPEND_REPORT_COUNT } from "@/constants/marketplace";
import { ListingStatusChip } from "@/features/dashboard/listing-status-chip";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate } from "@/lib/format";
import { shouldAutoSuspend } from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type { Listing, Report, ReportCategory, User } from "@/lib/types";

const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  agent_posing: "Agent posing as owner",
  scam_listing: "Scam listing",
  spam_user: "Spam user",
};

// `sessionStorage`, not the Zustand store: there is no "flagged reporters"
// data model in this prototype (see task brief), so this is a deliberate,
// honest stub rather than a control that silently does nothing. Backing it
// with `sessionStorage` (not plain component state) is what makes "noted for
// review in this session" true even when the admin navigates away from this
// page and back — it only clears when the browser tab itself closes.
const FLAGGED_REPORTERS_SESSION_KEY = "hecta-admin-flagged-reporters";

function loadFlaggedReporterIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(FLAGGED_REPORTERS_SESSION_KEY);
    if (raw === null) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveFlaggedReporterIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    FLAGGED_REPORTERS_SESSION_KEY,
    JSON.stringify([...ids]),
  );
}

interface ReportGroup {
  listing: Listing;
  reports: Report[];
  autoSuspended: boolean;
}

/**
 * Open reports grouped by listing, most-reported first. `shouldAutoSuspend`
 * is evaluated against the *full* reports slice (its own distinct-reporter
 * counting needs every open report for the listing, not just the ones in
 * this group — though in practice they're the same set since a group's
 * reports are already exactly "open reports for this listing").
 */
function groupOpenReports(
  reports: Report[],
  listings: Listing[],
): ReportGroup[] {
  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const byListing = new Map<string, Report[]>();
  for (const report of reports) {
    if (report.status !== "open") continue;
    const existing = byListing.get(report.targetListingId) ?? [];
    existing.push(report);
    byListing.set(report.targetListingId, existing);
  }

  const groups: ReportGroup[] = [];
  for (const [listingId, groupReports] of byListing) {
    const listing = listingById.get(listingId);
    if (listing === undefined) continue;
    groups.push({
      listing,
      reports: groupReports,
      autoSuspended:
        listing.status === "suspended" && shouldAutoSuspend(reports, listingId),
    });
  }
  return groups.sort((a, b) => b.reports.length - a.reports.length);
}

/**
 * Groups open reports by the listing they target so an admin can act on the
 * whole picture at once — suspend/restore the listing, and dismiss or action
 * each individual report. Suspension is reversible by design (see product
 * context: no permanent bans in this MVP), so "Restore" is always just a
 * status flip back to "active", never a data-destructive action.
 */
export function ReportsQueue() {
  const hydrated = useHydrated();
  const reports = useHectaStore((state) => state.reports);
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);
  const resolveReport = useHectaStore((state) => state.resolveReport);
  const setListingStatus = useHectaStore((state) => state.setListingStatus);

  const [flaggedReporterIds, setFlaggedReporterIds] = useState<Set<string>>(
    loadFlaggedReporterIds,
  );

  if (!hydrated) {
    return <ReportsQueueSkeleton />;
  }

  function reporterName(userId: string): string {
    return users.find((user) => user.id === userId)?.name ?? "Unknown user";
  }

  function handleSuspend(listing: Listing) {
    setListingStatus(listing.id, "suspended");
    toast.info(`"${listing.title}" suspended — hidden from search.`);
  }

  function handleRestore(listing: Listing) {
    setListingStatus(listing.id, "active");
    toast.success(`"${listing.title}" restored — visible in search again.`);
  }

  function handleDismiss(report: Report, listingTitle: string) {
    resolveReport(report.id, "dismissed");
    toast.info(`Report on "${listingTitle}" dismissed.`);
  }

  function handleActioned(report: Report, listingTitle: string) {
    resolveReport(report.id, "actioned");
    toast.success(`Report on "${listingTitle}" marked actioned.`);
  }

  function handleFlagReporter(reporterId: string, name: string) {
    setFlaggedReporterIds((prev) => {
      const next = new Set(prev);
      next.add(reporterId);
      saveFlaggedReporterIds(next);
      return next;
    });
    toast.info(`${name} noted for review in this session.`);
  }

  const groups = groupOpenReports(reports, listings);

  if (groups.length === 0) {
    return <EmptyReportsState />;
  }

  return (
    <ul className="flex list-none flex-col gap-6 p-0">
      {groups.map((group) => (
        <li key={group.listing.id}>
          <ReportGroupCard
            group={group}
            users={users}
            reporterName={reporterName}
            flaggedReporterIds={flaggedReporterIds}
            onSuspend={handleSuspend}
            onRestore={handleRestore}
            onDismiss={handleDismiss}
            onActioned={handleActioned}
            onFlagReporter={handleFlagReporter}
          />
        </li>
      ))}
    </ul>
  );
}

interface ReportGroupCardProps {
  group: ReportGroup;
  users: User[];
  reporterName: (userId: string) => string;
  flaggedReporterIds: Set<string>;
  onSuspend: (listing: Listing) => void;
  onRestore: (listing: Listing) => void;
  onDismiss: (report: Report, listingTitle: string) => void;
  onActioned: (report: Report, listingTitle: string) => void;
  onFlagReporter: (reporterId: string, name: string) => void;
}

function ReportGroupCard({
  group,
  reporterName,
  flaggedReporterIds,
  onSuspend,
  onRestore,
  onDismiss,
  onActioned,
  onFlagReporter,
}: ReportGroupCardProps) {
  const { listing, reports, autoSuspended } = group;

  return (
    <Card className="rounded-3xl ring-1 ring-border">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-paper-2">
            <Image
              src={listing.images[0]}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="font-heading text-base font-bold text-ink">
              {listing.title}
            </h3>
            <ListingStatusChip status={listing.status} />
          </div>
          {listing.status === "suspended" ? (
            <Button
              type="button"
              variant="outline"
              aria-label={`Restore ${listing.title}`}
              onClick={() => onRestore(listing)}
              className="h-11 shrink-0 rounded-full text-xs font-semibold tracking-normal normal-case"
            >
              Restore listing
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              aria-label={`Suspend ${listing.title}`}
              onClick={() => onSuspend(listing)}
              className="h-11 shrink-0 rounded-full text-xs font-semibold tracking-normal normal-case"
            >
              Suspend listing
            </Button>
          )}
        </div>

        {autoSuspended && (
          <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <WarningIcon
              weight="fill"
              aria-hidden
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              Auto-suspended after {AUTO_SUSPEND_REPORT_COUNT} reports from
              distinct users.
            </span>
          </p>
        )}

        <Separator />

        <ul className="flex list-none flex-col gap-3 p-0">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              reporterName={reporterName(report.reporterId)}
              flagged={flaggedReporterIds.has(report.reporterId)}
              onDismiss={() => onDismiss(report, listing.title)}
              onActioned={() => onActioned(report, listing.title)}
              onFlagReporter={() =>
                onFlagReporter(
                  report.reporterId,
                  reporterName(report.reporterId),
                )
              }
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface ReportRowProps {
  report: Report;
  reporterName: string;
  flagged: boolean;
  onDismiss: () => void;
  onActioned: () => void;
  onFlagReporter: () => void;
}

function ReportRow({
  report,
  reporterName,
  flagged,
  onDismiss,
  onActioned,
  onFlagReporter,
}: ReportRowProps) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-paper-2 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-semibold tracking-normal normal-case text-secondary-900">
            {REPORT_CATEGORY_LABEL[report.category]}
          </Badge>
          <span className="text-sm font-semibold text-ink">{reporterName}</span>
          {flagged && (
            <Badge className="rounded-full bg-transparent px-2 py-0.5 text-xs font-medium tracking-normal normal-case text-muted-ink ring-1 ring-border">
              Noted for review this session
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-ink">{report.reason}</p>
        <p className="text-xs text-muted-ink">{formatDate(report.createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label={`More actions for ${reporterName}'s report`}
              className="rounded-full"
            >
              <DotsThreeVerticalIcon weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onFlagReporter}>
              Flag reporter for review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Dismiss ${reporterName}'s report`}
          onClick={onDismiss}
          className="h-11 rounded-full text-xs font-semibold tracking-normal normal-case"
        >
          Dismiss
        </Button>
        <Button
          type="button"
          size="sm"
          aria-label={`Mark ${reporterName}'s report actioned`}
          onClick={onActioned}
          className="h-11 rounded-full text-xs font-semibold tracking-normal normal-case"
        >
          Mark actioned
        </Button>
      </div>
    </li>
  );
}

function EmptyReportsState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="font-heading text-lg font-semibold text-ink">
        No open reports
      </h2>
      <p className="max-w-sm text-sm text-muted-ink">
        Nothing flagged by tenants or seekers is waiting for review.
      </p>
    </div>
  );
}

function ReportsQueueSkeleton() {
  const keys = ["a", "b", "c"];
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      {keys.map((key) => (
        <Skeleton key={key} className="h-64 w-full rounded-3xl" />
      ))}
    </div>
  );
}
