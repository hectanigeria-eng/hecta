"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { IntentProfileForm } from "@/features/apply/intent-profile-form";
import { QuotaBanner } from "@/features/apply/quota-banner";
import { useSession } from "@/hooks/use-session";
import { formatNaira, pricePeriodLabel } from "@/lib/format";
import { remainingQuota } from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type {
  IntentProfile,
  Listing,
  PaymentPlan,
  Timeline,
} from "@/lib/types";

const MESSAGE_MAX_LENGTH = 600;

const TIMELINE_SUMMARY_LABELS: Record<Timeline, string> = {
  immediate: "Moving immediately",
  within_1_month: "Moving within 1 month",
  "1_3_months": "Moving in 1–3 months",
  exploring: "Just exploring",
};

const PAYMENT_PLAN_SUMMARY_LABELS: Record<PaymentPlan, string> = {
  full: "Full payment",
  mortgage: "Mortgage",
  instalments: "Instalments",
};

function profileSummary(profile: IntentProfile): string {
  return [
    TIMELINE_SUMMARY_LABELS[profile.timeline],
    PAYMENT_PLAN_SUMMARY_LABELS[profile.paymentPlan],
    `${formatNaira(profile.budgetMin)}–${formatNaira(profile.budgetMax)}`,
  ].join(" · ");
}

export interface ApplyDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * "contact" is the same flow with different copy — per PRD AP-04,
   * messaging a landlord only unlocks once you've applied, so "Contact"
   * opens this same dialog rather than a separate messaging entry point.
   */
  origin?: "apply" | "contact";
}

/**
 * Two-phase dialog: collect the seeker's intent profile first (only if they
 * don't already have one), then the application itself. Gating the
 * application step behind `hasProfile` is what guarantees
 * `submitApplication` — which throws if the active user has no intentProfile
 * — is never called without one already persisted.
 */
export function ApplyDialog({
  listing,
  open,
  onOpenChange,
  origin = "apply",
}: ApplyDialogProps) {
  const { user } = useSession();
  const applications = useHectaStore((state) => state.applications);
  const submitApplication = useHectaStore((state) => state.submitApplication);

  const [editingProfile, setEditingProfile] = useState(false);
  const [message, setMessage] = useState("");

  const existingApplication = useMemo(
    () =>
      applications.find(
        (application) =>
          application.listingId === listing.id &&
          application.applicantId === user.id,
      ),
    [applications, listing.id, user.id],
  );

  const remaining = useMemo(
    () => remainingQuota(applications, user.id, new Date().toISOString()),
    [applications, user.id],
  );

  const hasProfile = user.intentProfile !== undefined;
  const showProfileForm = !hasProfile || editingProfile;
  const alreadyApplied = existingApplication !== undefined;
  const blocked = remaining.day === 0 || remaining.month === 0;

  function handleProfileSaved() {
    setEditingProfile(false);
  }

  function handleSubmit() {
    if (alreadyApplied || blocked) return;
    submitApplication(listing.id, message.trim());
    toast.success("Application sent — the landlord will see your profile");
    onOpenChange(false);
  }

  // Reopening this dialog (same listing or a different one) should never
  // show a stale message draft or leave the user stranded mid-edit.
  function handleOpenChange(next: boolean) {
    if (!next) {
      setEditingProfile(false);
      setMessage("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-normal text-ink normal-case">
            {showProfileForm
              ? "Tell us what you're looking for"
              : "Apply for this home"}
          </DialogTitle>
          <DialogDescription>
            {showProfileForm
              ? "Under a minute, and it's the first thing landlords see — helps you stand out as a serious applicant."
              : origin === "contact"
                ? "Messaging unlocks once you apply — landlords reply to applicants, not browsers."
                : "Your profile goes to the landlord along with your application."}
          </DialogDescription>
        </DialogHeader>

        {showProfileForm ? (
          <IntentProfileForm
            defaultValues={user.intentProfile}
            onSaved={handleProfileSaved}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-2xl bg-paper-2 px-3 py-2.5">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-paper-3">
                <Image
                  src={listing.images[0]}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {listing.title}
                </p>
                <p className="text-xs text-muted-ink">
                  {formatNaira(listing.price)}
                  {pricePeriodLabel(listing.pricePeriod)}
                </p>
              </div>
            </div>

            {user.intentProfile !== undefined && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-800">
                  {profileSummary(user.intentProfile)}
                </span>
                {!alreadyApplied && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    className="h-8 gap-1 rounded-full px-3 text-xs font-semibold tracking-normal text-muted-ink normal-case"
                  >
                    <PencilSimpleIcon className="size-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            )}

            {!alreadyApplied && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apply-message">Message (optional)</Label>
                <Textarea
                  id="apply-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value.slice(0, MESSAGE_MAX_LENGTH))
                  }
                  maxLength={MESSAGE_MAX_LENGTH}
                  placeholder="Introduce yourself, ask a question, or suggest a viewing time…"
                  aria-describedby="apply-message-count"
                  className="min-h-24"
                />
                <p
                  id="apply-message-count"
                  aria-live="polite"
                  className="text-right text-xs text-muted-ink"
                >
                  {message.length}/{MESSAGE_MAX_LENGTH}
                </p>
              </div>
            )}

            {!alreadyApplied && <QuotaBanner remaining={remaining} />}

            <DialogFooter>
              {alreadyApplied ? (
                <Button
                  type="button"
                  disabled
                  className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
                >
                  Applied ✓
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={blocked}
                  className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
                >
                  Send application
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
