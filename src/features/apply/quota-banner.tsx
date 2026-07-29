import { WarningIcon } from "@phosphor-icons/react";
import { Progress } from "@/components/ui/progress";
import { DAILY_APPLICATION_LIMIT } from "@/constants/marketplace";

export interface QuotaRemaining {
  day: number;
  month: number;
}

interface QuotaBannerProps {
  remaining: QuotaRemaining;
}

/**
 * Presentational — the caller computes `remaining` via `remainingQuota` (see
 * `src/lib/marketplace.ts`) so this component never needs to read the store
 * or guess "now" on its own. `remaining.day`/`remaining.month` are counts
 * still available, not counts already used.
 */
export function QuotaBanner({ remaining }: QuotaBannerProps) {
  if (remaining.day === 0 || remaining.month === 0) {
    const isDaily = remaining.day === 0;
    return (
      <output className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <WarningIcon
          weight="fill"
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
        />
        <p>
          {isDaily ? "Daily limit reached" : "Monthly limit reached"} — resets{" "}
          {isDaily ? "at midnight WAT" : "at the start of next month"}. You can
          still browse and save homes in the meantime.
        </p>
      </output>
    );
  }

  const percent = (remaining.day / DAILY_APPLICATION_LIMIT) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-ink">
        You have{" "}
        <span className="font-semibold text-ink">
          {remaining.day} of {DAILY_APPLICATION_LIMIT}
        </span>{" "}
        applications left today.
      </p>
      <Progress
        value={percent}
        aria-label={`${remaining.day} of ${DAILY_APPLICATION_LIMIT} daily applications remaining`}
        className="h-1.5"
      />
    </div>
  );
}
