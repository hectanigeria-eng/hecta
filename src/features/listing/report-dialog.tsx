"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";
import type { Listing, ReportCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const REASON_MIN_LENGTH = 10;

interface ReportCategoryOption {
  value: ReportCategory;
  label: string;
}

const REPORT_CATEGORY_OPTIONS: readonly ReportCategoryOption[] = [
  { value: "agent_posing", label: "Agent posing as landlord" },
  { value: "scam_listing", label: "Scam listing" },
  { value: "spam_user", label: "Spam user" },
];

const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  agent_posing: "Agent posing as landlord",
  scam_listing: "Scam listing",
  spam_user: "Spam user",
};

const reportSchema = z.object({
  category: z.enum(["agent_posing", "scam_listing", "spam_user"]),
  reason: z
    .string()
    .trim()
    .min(
      REASON_MIN_LENGTH,
      `Add at least ${REASON_MIN_LENGTH} characters of detail`,
    ),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export interface ReportDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Triggered from the "Report this listing" link on `LandlordCard`. The
 * caller (`ListingDetail`) is responsible for routing the click through
 * `useGate().requireVerified` before opening this — reporting is an
 * accountable action, and the store stamps `reporterId` from the active
 * user, so an unverified/anonymous reporter should never reach this dialog.
 */
export function ReportDialog({
  listing,
  open,
  onOpenChange,
}: ReportDialogProps) {
  const { user } = useSession();
  const reports = useHectaStore((state) => state.reports);
  const submitReport = useHectaStore((state) => state.submitReport);

  // `submitReport` already silently ignores a duplicate reporter+listing
  // pair — reflecting that state here (rather than letting the form pretend
  // a second submission would do anything) is what keeps the UI honest.
  const existingReport = useMemo(
    () =>
      reports.find(
        (report) =>
          report.targetListingId === listing.id &&
          report.reporterId === user.id,
      ),
    [reports, listing.id, user.id],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { category: "scam_listing", reason: "" },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  function onSubmit(values: ReportFormValues) {
    submitReport(listing.id, values.category, values.reason);
    toast.success("Report received — our team reviews within 24 hours");
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-normal text-ink normal-case">
            Report this listing
          </DialogTitle>
          <DialogDescription>
            {existingReport !== undefined
              ? "You've already reported this listing — our team is reviewing it."
              : "Tell us what's wrong. Hecta reviews every report within 24 hours."}
          </DialogDescription>
        </DialogHeader>

        {existingReport !== undefined ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-paper-2 px-3.5 py-3 text-sm">
              <p className="font-semibold text-ink">
                {REPORT_CATEGORY_LABELS[existingReport.category]}
              </p>
              <p className="mt-1 text-muted-ink">{existingReport.reason}</p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
                    What&apos;s the issue?
                  </legend>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) =>
                      // Safe: every value here comes from
                      // REPORT_CATEGORY_OPTIONS, which enumerates exactly
                      // the ReportCategory union.
                      field.onChange(value as ReportCategory)
                    }
                  >
                    {REPORT_CATEGORY_OPTIONS.map((option) => {
                      const optionId = `report-category-${option.value}`;
                      const isActive = field.value === option.value;
                      return (
                        <label
                          key={option.value}
                          htmlFor={optionId}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors",
                            isActive
                              ? "border-primary-500 bg-primary-50"
                              : "border-border bg-card hover:bg-paper-2",
                          )}
                        >
                          <RadioGroupItem value={option.value} id={optionId} />
                          <span className="text-sm font-semibold text-ink normal-case">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </fieldset>
              )}
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-reason">Details</Label>
              <Textarea
                id="report-reason"
                placeholder="What happened? Include anything that will help our review team…"
                aria-invalid={errors.reason !== undefined}
                aria-describedby={
                  errors.reason !== undefined
                    ? "report-reason-error"
                    : undefined
                }
                className="min-h-24"
                {...register("reason")}
              />
              {errors.reason !== undefined && (
                <p
                  id="report-reason-error"
                  className="text-xs text-destructive"
                >
                  {errors.reason.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
              >
                Submit report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
