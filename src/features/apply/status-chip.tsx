import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusChipConfig {
  label: string;
  className: string;
}

/**
 * Shared status → colour/label mapping for an application. Task 12's
 * `/applications` page and Task 17's landlord inbox both render the same
 * statuses, so this map (and the `StatusChip` built on it) lives in this
 * feature folder rather than inline in either page.
 */
export const APPLICATION_STATUS_CHIPS: Record<
  ApplicationStatus,
  StatusChipConfig
> = {
  submitted: {
    label: "Submitted",
    className: "bg-muted text-muted-foreground",
  },
  viewed: {
    label: "Viewed",
    className: "bg-secondary-100 text-secondary-900",
  },
  accepted: {
    label: "Accepted",
    className: "bg-primary-100 text-primary-800",
  },
  declined: {
    label: "Declined",
    className: "bg-destructive/10 text-destructive",
  },
  info_requested: {
    label: "Info requested",
    className: "bg-transparent text-secondary-800 ring-1 ring-secondary-400",
  },
};

interface StatusChipProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const config = APPLICATION_STATUS_CHIPS[status];
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
