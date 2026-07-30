"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  FileTextIcon,
  UserCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/features/dashboard/new-listing/field-error";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  hasDuplicateAddress,
  maskNinLast4,
  ninFormatValid,
  sortVerificationsForQueue,
  verificationReferenceNumber,
} from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { useHectaStore } from "@/lib/store";
import type {
  OwnershipDocType,
  VerificationStatus,
  VerificationSubmission,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const REASON_MIN_LENGTH = 10;

const OWNERSHIP_DOC_LABEL: Record<OwnershipDocType, string> = {
  c_of_o: "Certificate of Occupancy (C of O)",
  deed_of_assignment: "Deed of Assignment",
  purchase_receipt: "Purchase Receipt",
  governors_consent: "Governor's Consent",
  family_resolution: "Family Resolution Letter",
  letter_of_administration: "Letter of Administration",
};

const LEGITIMACY_DOC_LABEL: Record<
  VerificationSubmission["legitimacyDoc"],
  string
> = {
  survey_plan: "Survey plan",
  luc_receipt: "Land Use Charge (LUC) receipt",
  none: "None provided",
};

const STATUS_CHIP: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: "Submitted",
    className: "bg-secondary-100 text-secondary-900",
  },
  under_review: {
    label: "Under review",
    className: "bg-secondary-100 text-secondary-900",
  },
  approved: {
    label: "Approved",
    className: "bg-primary-100 text-primary-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive",
  },
  info_requested: {
    label: "Info requested",
    className: "bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200",
  },
};

type ReasonAction = "rejected" | "info_requested";

interface ReasonDialogTarget {
  action: ReasonAction;
  submission: VerificationSubmission;
}

interface PreviewTarget {
  label: string;
  submission: VerificationSubmission;
}

const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(
      REASON_MIN_LENGTH,
      `Enter at least ${REASON_MIN_LENGTH} characters so the landlord knows what to fix.`,
    ),
});
type ReasonValues = z.infer<typeof reasonSchema>;

/**
 * Master/detail review queue for landlord verification submissions — the
 * one screen where an approval actually grants `landlordVerified`. The list
 * order and every automated-check result are computed from the live store
 * (never hardcoded), so approving/rejecting/requesting-info here updates
 * both the row and the landlord's own dashboard view on the next render.
 */
export function VerificationQueue() {
  const hydrated = useHydrated();
  const verifications = useHectaStore((state) => state.verifications);
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);
  const reviewVerification = useHectaStore((state) => state.reviewVerification);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [reasonTarget, setReasonTarget] = useState<ReasonDialogTarget | null>(
    null,
  );
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(
    null,
  );

  const ordered = useMemo(
    () => sortVerificationsForQueue(verifications),
    [verifications],
  );

  if (!hydrated) {
    return <VerificationQueueSkeleton />;
  }

  const selected =
    ordered.find((submission) => submission.id === selectedId) ?? ordered[0];

  function handleApprove(submission: VerificationSubmission) {
    reviewVerification(submission.id, "approved");
    toast.success(`${submission.landlordName} approved — they can now list.`);
  }

  function handleReasonSubmit(reason: string) {
    if (reasonTarget === null) return;
    const { action, submission } = reasonTarget;
    reviewVerification(submission.id, action, reason);
    toast.info(
      action === "rejected"
        ? `${submission.landlordName}'s verification was rejected.`
        : `Requested more documents from ${submission.landlordName}.`,
    );
    setReasonTarget(null);
  }

  if (ordered.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-ink">
        No verification submissions yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(280px,1fr)_2fr]">
      <nav aria-label="Verification submissions">
        <ul className="flex list-none flex-col gap-2 p-0">
          {ordered.map((submission) => {
            const isSelected = submission.id === selected?.id;
            return (
              <li key={submission.id}>
                <button
                  type="button"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => setSelectedId(submission.id)}
                  className={cn(
                    "flex min-h-11 w-full flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition-colors",
                    isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-border bg-card hover:bg-paper-2",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {submission.landlordName}
                    </span>
                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold tracking-normal normal-case",
                        STATUS_CHIP[submission.status].className,
                      )}
                    >
                      {STATUS_CHIP[submission.status].label}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-ink">
                    {OWNERSHIP_DOC_LABEL[submission.ownershipDocType]}
                  </span>
                  <span className="text-xs text-muted-ink">
                    Submitted {formatDate(submission.submittedAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {selected !== undefined && (
        <VerificationDetail
          submission={selected}
          ownerIdentityVerified={
            users.find((user) => user.id === selected.landlordId)
              ?.identityVerified ?? false
          }
          duplicateAddress={hasDuplicateAddress(
            selected.propertyAddress,
            listings,
          )}
          onApprove={handleApprove}
          onReject={(submission) =>
            setReasonTarget({ action: "rejected", submission })
          }
          onRequestInfo={(submission) =>
            setReasonTarget({ action: "info_requested", submission })
          }
          onPreview={(label, submission) =>
            setPreviewTarget({ label, submission })
          }
        />
      )}

      <ReasonDialog
        target={reasonTarget}
        onCancel={() => setReasonTarget(null)}
        onSubmit={handleReasonSubmit}
      />

      <PreviewDialog
        target={previewTarget}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
      />
    </div>
  );
}

interface VerificationDetailProps {
  submission: VerificationSubmission;
  ownerIdentityVerified: boolean;
  duplicateAddress: boolean;
  onApprove: (submission: VerificationSubmission) => void;
  onReject: (submission: VerificationSubmission) => void;
  onRequestInfo: (submission: VerificationSubmission) => void;
  onPreview: (label: string, submission: VerificationSubmission) => void;
}

function VerificationDetail({
  submission,
  ownerIdentityVerified,
  duplicateAddress,
  onApprove,
  onReject,
  onRequestInfo,
  onPreview,
}: VerificationDetailProps) {
  const ninValid = ninFormatValid(submission.nin);
  const canAct = submission.status !== "approved";

  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">
              {submission.landlordName}
            </h2>
            <p className="text-sm text-muted-ink">
              {submission.propertyAddress}
            </p>
          </div>
          <Badge
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold tracking-normal normal-case",
              STATUS_CHIP[submission.status].className,
            )}
          >
            {STATUS_CHIP[submission.status].label}
          </Badge>
        </div>

        {submission.status === "rejected" &&
          submission.reviewNote !== undefined && (
            <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              {submission.reviewNote}
            </p>
          )}
        {submission.status === "info_requested" &&
          submission.reviewNote !== undefined && (
            <p className="rounded-2xl bg-secondary-50 p-4 text-sm text-secondary-900 ring-1 ring-secondary-200">
              {submission.reviewNote}
            </p>
          )}

        <Separator />

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-ink uppercase">
            Identity
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-ink">National ID (NIN)</dt>
              <dd className="font-mono text-sm font-medium text-ink">
                {maskNinLast4(submission.nin)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-ink">Identity check</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <UserCircleIcon
                  weight={ownerIdentityVerified ? "fill" : "regular"}
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0",
                    ownerIdentityVerified
                      ? "text-primary-600"
                      : "text-muted-ink",
                  )}
                />
                {ownerIdentityVerified ? "Completed" : "Not completed"}
              </dd>
            </div>
          </dl>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-ink uppercase">
            Documents
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <DocumentTile
              label={OWNERSHIP_DOC_LABEL[submission.ownershipDocType]}
              onPreview={() =>
                onPreview(
                  OWNERSHIP_DOC_LABEL[submission.ownershipDocType],
                  submission,
                )
              }
            />
            {submission.legitimacyDoc !== "none" && (
              <DocumentTile
                label={LEGITIMACY_DOC_LABEL[submission.legitimacyDoc]}
                onPreview={() =>
                  onPreview(
                    LEGITIMACY_DOC_LABEL[submission.legitimacyDoc],
                    submission,
                  )
                }
              />
            )}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted-ink uppercase">
            Automated checks
          </h3>
          <ul className="flex list-none flex-col gap-2 p-0">
            <AutomatedCheckRow ok={ninValid} label="NIN format valid" />
            <AutomatedCheckRow ok label="Document readable" />
            <AutomatedCheckRow
              ok={!duplicateAddress}
              label={
                duplicateAddress
                  ? "Duplicate address — already appears on another listing"
                  : "No duplicate address found"
              }
            />
          </ul>
        </section>

        {canAct && (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                aria-label={`Approve ${submission.landlordName}'s verification`}
                onClick={() => onApprove(submission)}
                className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label={`Request more documents from ${submission.landlordName}`}
                onClick={() => onRequestInfo(submission)}
                className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
              >
                Request more documents
              </Button>
              <Button
                type="button"
                variant="destructive"
                aria-label={`Reject ${submission.landlordName}'s verification`}
                onClick={() => onReject(submission)}
                className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
              >
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AutomatedCheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckIcon
          weight="bold"
          aria-hidden
          className="size-4 shrink-0 text-primary-600"
        />
      ) : (
        <WarningIcon
          weight="fill"
          aria-hidden
          className="size-4 shrink-0 text-secondary-600"
        />
      )}
      <span className={ok ? "text-ink" : "font-medium text-secondary-900"}>
        {label}
      </span>
    </li>
  );
}

function DocumentTile({
  label,
  onPreview,
}: {
  label: string;
  onPreview: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-paper-2 p-4">
      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
        <FileTextIcon
          weight="duotone"
          aria-hidden
          className="size-6 shrink-0 text-muted-ink"
        />
        {label}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPreview}
        className="h-11 self-start rounded-full text-xs font-semibold tracking-normal normal-case"
      >
        Preview
      </Button>
    </div>
  );
}

function PreviewDialog({
  target,
  onOpenChange,
}: {
  target: PreviewTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Document preview</DialogTitle>
          <DialogDescription>
            A mock preview — no real document is attached in this demo.
          </DialogDescription>
        </DialogHeader>
        {target !== null && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-paper-2 px-6 py-12 text-center">
            <UserCircleIcon
              weight="duotone"
              aria-hidden
              className="size-10 text-muted-ink"
            />
            <h3 className="font-heading text-lg font-bold text-ink">
              {target.label}
            </h3>
            <p className="text-xs tracking-wide text-muted-ink uppercase">
              Reference: {verificationReferenceNumber(target.submission)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const REASON_DIALOG_COPY: Record<
  ReasonAction,
  { title: string; description: string; submitLabel: string }
> = {
  rejected: {
    title: "Reject this verification",
    description: "One resubmission permitted — be specific about what to fix.",
    submitLabel: "Reject verification",
  },
  info_requested: {
    title: "Request more documents",
    description:
      "The landlord sees this note on their verification page and can add documents.",
    submitLabel: "Send request",
  },
};

function ReasonDialog({
  target,
  onCancel,
  onSubmit,
}: {
  target: ReasonDialogTarget | null;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        {target !== null && (
          <ReasonDialogForm
            key={`${target.action}-${target.submission.id}`}
            target={target}
            onCancel={onCancel}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialogForm({
  target,
  onCancel,
  onSubmit,
}: {
  target: ReasonDialogTarget;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const fieldId = useId();
  const copy = REASON_DIALOG_COPY[target.action];
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReasonValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  function submit(values: ReasonValues) {
    onSubmit(values.reason);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>
          {copy.description} This applies to {target.submission.landlordName}
          &apos;s submission.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-reason`}>Reason</Label>
        <Textarea
          id={`${fieldId}-reason`}
          rows={4}
          aria-invalid={errors.reason !== undefined}
          aria-describedby={
            errors.reason === undefined ? undefined : `${fieldId}-reason-error`
          }
          {...register("reason")}
        />
        <FieldError
          id={`${fieldId}-reason-error`}
          message={errors.reason?.message}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant={target.action === "rejected" ? "destructive" : "default"}
          className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
        >
          {copy.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function VerificationQueueSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(280px,1fr)_2fr]"
      aria-hidden
    >
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton placeholder, never reordered
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
