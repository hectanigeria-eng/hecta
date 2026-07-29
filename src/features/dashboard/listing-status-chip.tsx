import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ListingStatusChipConfig {
  label: string;
  className: string;
}

/**
 * Status → colour/label mapping for a *listing* (not an application —
 * `ApplicationStatus` is a different set and already has its own map in
 * `src/features/apply/status-chip.tsx`). Lives here rather than in that file
 * so neither status set has to reason about the other's cases.
 */
export const LISTING_STATUS_CHIPS: Record<
  ListingStatus,
  ListingStatusChipConfig
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  pending_review: {
    label: "Pending review",
    className: "bg-secondary-100 text-secondary-900",
  },
  active: {
    label: "Active",
    className: "bg-primary-100 text-primary-800",
  },
  hidden: {
    label: "Hidden",
    className: "bg-transparent text-foreground ring-1 ring-border",
  },
  suspended: {
    label: "Suspended",
    className: "bg-destructive/10 text-destructive",
  },
  let: {
    label: "Let",
    className: "bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200",
  },
  sold: {
    label: "Sold",
    className: "bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-transparent text-destructive ring-1 ring-destructive/40",
  },
};

interface ListingStatusChipProps {
  status: ListingStatus;
  className?: string;
}

export function ListingStatusChip({
  status,
  className,
}: ListingStatusChipProps) {
  const config = LISTING_STATUS_CHIPS[status];
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold tracking-normal normal-case",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
