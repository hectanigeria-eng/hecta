"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  SealCheckIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { forwardRef, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldError } from "@/features/dashboard/new-listing/field-error";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { useHectaStore } from "@/lib/store";
import type { OwnershipDocType, VerificationSubmission } from "@/lib/types";
import { cn } from "@/lib/utils";

const NIN_LENGTH = 11;
const OTP_LENGTH = 6;
const PHONE_MIN_DIGITS = 7;
const ADDRESS_MIN_CHARS = 8;

const OWNERSHIP_DOC_LABEL: Record<OwnershipDocType, string> = {
  c_of_o: "Certificate of Occupancy (C of O)",
  deed_of_assignment: "Deed of Assignment",
  purchase_receipt: "Purchase Receipt",
  governors_consent: "Governor's Consent",
  family_resolution: "Family Resolution Letter",
  letter_of_administration: "Letter of Administration",
};

const STANDARD_DOC_TYPES: readonly OwnershipDocType[] = [
  "c_of_o",
  "deed_of_assignment",
  "purchase_receipt",
  "governors_consent",
];

const FAMILY_DOC_TYPES: readonly OwnershipDocType[] = [
  "family_resolution",
  "letter_of_administration",
];

const MOCK_FILE_NAME: Record<OwnershipDocType, string> = {
  c_of_o: "certificate-of-occupancy.pdf",
  deed_of_assignment: "deed-of-assignment.pdf",
  purchase_receipt: "purchase-receipt.pdf",
  governors_consent: "governors-consent.pdf",
  family_resolution: "family-resolution-letter.pdf",
  letter_of_administration: "letter-of-administration.pdf",
};

type LegitimacyDoc = VerificationSubmission["legitimacyDoc"];

const LEGITIMACY_LABEL: Record<LegitimacyDoc, string> = {
  survey_plan: "Survey plan",
  luc_receipt: "Land Use Charge (LUC) receipt",
  none: "None of these",
};

const LEGITIMACY_OPTIONS: readonly { value: LegitimacyDoc; label: string }[] = [
  { value: "survey_plan", label: LEGITIMACY_LABEL.survey_plan },
  { value: "luc_receipt", label: LEGITIMACY_LABEL.luc_receipt },
  { value: "none", label: LEGITIMACY_LABEL.none },
];

const WIZARD_STEP_LABELS = [
  "Identity",
  "Ownership",
  "Property",
  "Review",
] as const;

const identitySchema = z.object({
  nin: z
    .string()
    .regex(
      new RegExp(`^\\d{${NIN_LENGTH}}$`),
      `Enter all ${NIN_LENGTH} digits of your NIN`,
    ),
  phone: z
    .string()
    .refine(
      (value) => value.replace(/\D/g, "").length >= PHONE_MIN_DIGITS,
      "Enter a valid phone number",
    ),
  otp: z
    .string()
    .regex(
      new RegExp(`^\\d{${OTP_LENGTH}}$`),
      `Enter the ${OTP_LENGTH}-digit code`,
    ),
});
type IdentityValues = z.infer<typeof identitySchema>;

const ownershipSchema = z.object({
  ownershipDocType: z.enum([
    "c_of_o",
    "deed_of_assignment",
    "purchase_receipt",
    "governors_consent",
    "family_resolution",
    "letter_of_administration",
  ]),
  documentUploaded: z
    .boolean()
    .refine((value) => value, "Upload your document to continue"),
});
type OwnershipValues = z.infer<typeof ownershipSchema>;

const propertySchema = z.object({
  propertyAddress: z
    .string()
    .trim()
    .min(
      ADDRESS_MIN_CHARS,
      `Enter the full property address (at least ${ADDRESS_MIN_CHARS} characters).`,
    ),
  legitimacyDoc: z.enum(["survey_plan", "luc_receipt", "none"]),
});
type PropertyValues = z.infer<typeof propertySchema>;

interface VerificationDraft {
  identity: IdentityValues;
  ownership: OwnershipValues;
  property: PropertyValues;
}

function createEmptyDraft(): VerificationDraft {
  return {
    identity: { nin: "", phone: "", otp: "" },
    ownership: { ownershipDocType: "c_of_o", documentUploaded: false },
    property: { propertyAddress: "", legitimacyDoc: "none" },
  };
}

/** Cosmetic mask matching how a submitted NIN is displayed elsewhere in the
 * demo (see `MOCK_VERIFICATIONS`) — only the last 4 digits stay visible. */
function maskNin(nin: string): string {
  const visible = nin.slice(-4);
  return "*".repeat(Math.max(nin.length - visible.length, 0)) + visible;
}

/**
 * Trust Layer 1: the landlord verification centre. Approved landlords see a
 * summary of what was reviewed; everyone else sees either the 4-step wizard
 * or — once they've submitted — a status timeline. All three branches read
 * straight from the store's `verifications` (never local component state),
 * so an admin's approval in Task 18's console shows up here on the next
 * render without any extra wiring.
 */
export function LandlordVerification() {
  const hydrated = useHydrated();
  const { user, isLandlordVerified } = useSession();
  const verifications = useHectaStore((state) => state.verifications);
  const submitVerification = useHectaStore((state) => state.submitVerification);

  if (!hydrated) {
    return <Skeleton className="h-96 w-full rounded-3xl" aria-hidden />;
  }

  const mySubmissions = verifications
    .filter((submission) => submission.landlordId === user.id)
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  const latest = mySubmissions[0];

  if (isLandlordVerified) {
    const approved = mySubmissions.find(
      (submission) => submission.status === "approved",
    );
    return <ApprovedStatusCard submission={approved} />;
  }

  if (latest !== undefined) {
    return <SubmissionStatusView submission={latest} />;
  }

  return (
    <VerificationWizard
      landlordId={user.id}
      landlordName={user.name}
      onSubmit={submitVerification}
    />
  );
}

function SummaryField({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt
        className={cn(
          "text-xs font-semibold tracking-wide uppercase",
          tone === "primary" ? "text-primary-700" : "text-muted-ink",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm font-medium",
          tone === "primary" ? "text-primary-900" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ApprovedStatusCard({
  submission,
}: {
  submission: VerificationSubmission | undefined;
}) {
  // Guards against misreporting even if a caller ever passes something other
  // than an approved submission (e.g. `landlordVerified` and the submission
  // list momentarily disagreeing, as they can once Task 18's admin console
  // starts changing statuses) — only a submission whose own status is
  // "approved" gets to claim an approval date.
  const approvedSubmission =
    submission?.status === "approved" ? submission : undefined;

  return (
    <Card className="rounded-3xl bg-primary-50 ring-1 ring-primary-200">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <SealCheckIcon
            weight="fill"
            aria-hidden
            className="size-10 shrink-0 text-primary-600"
          />
          <div>
            <h2 className="font-heading text-xl font-bold text-primary-900">
              Verified landlord
            </h2>
            <p className="text-sm text-primary-800">
              Seekers see your Verified badge on every listing.
            </p>
          </div>
        </div>
        {approvedSubmission !== undefined && (
          <dl className="grid gap-4 border-t border-primary-200 pt-5 sm:grid-cols-3">
            <SummaryField
              label="Ownership document"
              value={OWNERSHIP_DOC_LABEL[approvedSubmission.ownershipDocType]}
              tone="primary"
            />
            <SummaryField
              label="Property address"
              value={approvedSubmission.propertyAddress}
              tone="primary"
            />
            <SummaryField
              label="Approved"
              value={formatDate(approvedSubmission.submittedAt)}
              tone="primary"
            />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineStage({ label, filled }: { label: string; filled: boolean }) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center">
      <span
        aria-hidden
        className={cn(
          "flex size-6 items-center justify-center rounded-full border-2",
          filled
            ? "border-primary-500 bg-primary-500"
            : "border-border bg-card",
        )}
      >
        {filled && (
          <CheckIcon
            weight="bold"
            className="size-3.5 text-primary-foreground"
          />
        )}
      </span>
      <span
        className={cn(
          "text-xs font-semibold",
          filled ? "text-ink" : "text-muted-ink",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function SubmissionStatusView({
  submission,
}: {
  submission: VerificationSubmission;
}) {
  if (submission.status === "rejected") {
    return (
      <Card className="rounded-3xl ring-1 ring-destructive/30">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <WarningCircleIcon
              weight="fill"
              aria-hidden
              className="size-8 shrink-0 text-destructive"
            />
            <h2 className="font-heading text-xl font-bold text-ink">
              Verification not approved
            </h2>
          </div>
          <p className="text-sm text-muted-ink">
            {submission.reviewNote ??
              "Our team could not approve this submission."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const stageIndex = submission.status === "submitted" ? 0 : 1;

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <ClockIcon
              weight="duotone"
              aria-hidden
              className="size-9 shrink-0 text-secondary-600"
            />
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Verification in progress
              </h2>
              <p className="text-sm text-muted-ink">
                Submitted {formatDate(submission.submittedAt)}
              </p>
            </div>
          </div>

          <div className="relative flex items-start justify-between px-2">
            <div
              aria-hidden
              className="absolute top-3 right-12 left-12 h-px bg-border"
            />
            <TimelineStage label="Submitted" filled={stageIndex >= 0} />
            <TimelineStage label="Under review" filled={stageIndex >= 1} />
            <TimelineStage label="Approved" filled={false} />
          </div>

          <p className="text-sm text-muted-ink">
            Our team reviews within 48 hours. You&apos;ll be able to list as
            soon as you&apos;re approved.
          </p>

          {submission.status === "info_requested" &&
            submission.reviewNote !== undefined && (
              <div className="flex flex-col gap-1.5 rounded-2xl bg-secondary-50 p-4 ring-1 ring-secondary-300">
                <p className="text-sm font-semibold text-secondary-900">
                  We need a bit more information
                </p>
                <p className="text-sm text-secondary-800">
                  {submission.reviewNote}
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      <Card size="sm" className="rounded-2xl ring-1 ring-border">
        <CardContent className="flex flex-col gap-3">
          <SummaryField
            label="Ownership document"
            value={OWNERSHIP_DOC_LABEL[submission.ownershipDocType]}
          />
          <SummaryField
            label="Property address"
            value={submission.propertyAddress}
          />
          <SummaryField label="NIN" value={submission.nin} />
        </CardContent>
      </Card>
    </div>
  );
}

function StepIntro({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="font-heading text-xl font-bold text-ink">{title}</h2>
      <p className="text-sm text-muted-ink">{blurb}</p>
    </div>
  );
}

function StepFooter({
  onBack,
  nextLabel = "Continue",
}: {
  onBack?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      {onBack === undefined ? (
        <span />
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-11 rounded-full px-4 text-sm font-semibold tracking-normal normal-case"
        >
          <ArrowLeftIcon weight="bold" aria-hidden className="size-4" />
          Back
        </Button>
      )}
      <Button
        type="submit"
        className="h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
      >
        {nextLabel}
        <ArrowRightIcon weight="bold" aria-hidden className="size-4" />
      </Button>
    </div>
  );
}

function IdentityStep({
  defaultValues,
  onNext,
}: {
  defaultValues: IdentityValues;
  onNext: (values: IdentityValues) => void;
}) {
  const fieldId = useId();
  const [stage, setStage] = useState<"details" | "otp">(
    defaultValues.otp !== "" ? "otp" : "details",
  );
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues,
  });

  const phone = watch("phone");
  const nin = watch("nin") ?? "";

  async function handleSendCode() {
    const valid = await trigger(["nin", "phone"]);
    if (valid) setStage("otp");
  }

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="Confirm it's really you"
        blurb="A quick identity check is what lets seekers trust a listing came from a real landlord."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-nin`}>
          National Identification Number (NIN)
        </Label>
        <Input
          id={`${fieldId}-nin`}
          inputMode="numeric"
          maxLength={NIN_LENGTH}
          disabled={stage === "otp"}
          autoComplete="off"
          placeholder="12345678901"
          className="font-mono tracking-widest"
          aria-invalid={errors.nin !== undefined}
          aria-describedby={
            errors.nin === undefined
              ? `${fieldId}-nin-hint`
              : `${fieldId}-nin-error`
          }
          {...register("nin")}
        />
        <p id={`${fieldId}-nin-hint`} className="text-xs text-muted-ink">
          {nin.length} of {NIN_LENGTH} digits entered.
        </p>
        <FieldError id={`${fieldId}-nin-error`} message={errors.nin?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-phone`}>Phone number</Label>
        <Input
          id={`${fieldId}-phone`}
          type="tel"
          inputMode="tel"
          disabled={stage === "otp"}
          autoComplete="tel"
          placeholder="080X XXX XXXX"
          aria-invalid={errors.phone !== undefined}
          aria-describedby={
            errors.phone === undefined ? undefined : `${fieldId}-phone-error`
          }
          {...register("phone")}
        />
        <FieldError
          id={`${fieldId}-phone-error`}
          message={errors.phone?.message}
        />
      </div>

      {stage === "details" && (
        <Button
          type="button"
          onClick={handleSendCode}
          className="h-11 self-start rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
        >
          Send code
        </Button>
      )}

      {stage === "otp" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-otp`}>
            Enter the {OTP_LENGTH}-digit code
          </Label>
          <Input
            id={`${fieldId}-otp`}
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            autoComplete="one-time-code"
            placeholder="123456"
            className="font-mono text-lg tracking-widest"
            aria-invalid={errors.otp !== undefined}
            aria-describedby={
              errors.otp === undefined
                ? `${fieldId}-otp-hint`
                : `${fieldId}-otp-error`
            }
            {...register("otp")}
          />
          <p id={`${fieldId}-otp-hint`} className="text-xs text-muted-ink">
            We sent a code to {phone || "your phone"}. This is a demo — any{" "}
            {OTP_LENGTH} digits will do.
          </p>
          <FieldError
            id={`${fieldId}-otp-error`}
            message={errors.otp?.message}
          />
        </div>
      )}

      {stage === "otp" && <StepFooter nextLabel="Continue" />}
    </form>
  );
}

interface DocumentUploadTileProps {
  docLabel: string;
  fileName: string | undefined;
  onUpload: () => void;
  invalid?: boolean;
  describedById?: string;
}

const DocumentUploadTile = forwardRef<
  HTMLButtonElement,
  DocumentUploadTileProps
>(function DocumentUploadTile(
  { docLabel, fileName, onUpload, invalid = false, describedById },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onUpload}
      aria-describedby={describedById}
      aria-invalid={invalid}
      className={cn(
        "flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
        fileName !== undefined
          ? "border-primary-400 bg-primary-50"
          : invalid
            ? "border-destructive"
            : "border-border bg-card hover:bg-paper-2",
      )}
    >
      {fileName !== undefined ? (
        <>
          <CheckIcon
            weight="bold"
            aria-hidden
            className="size-7 text-primary-600"
          />
          <span className="text-sm font-semibold text-ink">{fileName}</span>
          <span className="text-xs text-muted-ink">Tap to replace</span>
        </>
      ) : (
        <>
          <UploadSimpleIcon
            weight="bold"
            aria-hidden
            className="size-7 text-muted-ink"
          />
          <span className="text-sm font-semibold text-ink">
            Upload {docLabel}
          </span>
          <span className="text-xs text-muted-ink">
            PDF, JPG or PNG — tap to select (demo)
          </span>
        </>
      )}
    </button>
  );
});

function OwnershipStep({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: OwnershipValues;
  onNext: (values: OwnershipValues) => void;
  onBack: () => void;
}) {
  const fieldId = useId();
  const [fileName, setFileName] = useState<string | undefined>(
    defaultValues.documentUploaded
      ? MOCK_FILE_NAME[defaultValues.ownershipDocType]
      : undefined,
  );
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OwnershipValues>({
    resolver: zodResolver(ownershipSchema),
    defaultValues,
  });

  const ownershipDocType = watch("ownershipDocType");

  function handleDocTypeChange(next: string) {
    setFileName(undefined);
    setValue("documentUploaded", false);
    return next;
  }

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="Prove you own the property"
        blurb="Pick whichever document you actually have — the family-land path is reviewed exactly the same way."
      />

      <Controller
        control={control}
        name="ownershipDocType"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
              Which document do you have?
            </legend>
            <RadioGroup
              value={field.value}
              onValueChange={(value) => {
                field.onChange(handleDocTypeChange(value));
              }}
            >
              {STANDARD_DOC_TYPES.map((doc, index) => {
                const optionId = `${fieldId}-doc-${doc}`;
                const isActive = field.value === doc;
                return (
                  <label
                    key={doc}
                    htmlFor={optionId}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors",
                      isActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-border bg-card hover:bg-paper-2",
                    )}
                  >
                    <RadioGroupItem
                      value={doc}
                      id={optionId}
                      ref={index === 0 ? field.ref : undefined}
                    />
                    <span className="text-sm font-semibold text-ink normal-case">
                      {OWNERSHIP_DOC_LABEL[doc]}
                    </span>
                  </label>
                );
              })}

              {/* Same RadioGroup (not a second one) — the family-land docs are
               * arrow-key reachable from the standard docs above, not a
               * separately-tabbed cluster. Only the divider + heading below
               * are non-item content sitting inside the group. */}
              <div className="flex flex-col gap-1 border-t border-border pt-4">
                <p className="text-sm font-semibold text-ink normal-case">
                  Family land?
                </p>
                <p className="text-xs text-muted-ink normal-case">
                  A meaningful share of Lagos property is held under family or
                  inherited title rather than a registered C of O — this path is
                  a legitimate, equally valid way to verify, not a fallback.
                </p>
              </div>

              {FAMILY_DOC_TYPES.map((doc) => {
                const optionId = `${fieldId}-doc-${doc}`;
                const isActive = field.value === doc;
                return (
                  <label
                    key={doc}
                    htmlFor={optionId}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors",
                      isActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-border bg-card hover:bg-paper-2",
                    )}
                  >
                    <RadioGroupItem value={doc} id={optionId} />
                    <span className="text-sm font-semibold text-ink normal-case">
                      {OWNERSHIP_DOC_LABEL[doc]}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="documentUploaded"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <DocumentUploadTile
              ref={field.ref}
              docLabel={OWNERSHIP_DOC_LABEL[ownershipDocType]}
              fileName={fileName}
              onUpload={() => {
                setFileName(MOCK_FILE_NAME[ownershipDocType]);
                field.onChange(true);
              }}
              invalid={errors.documentUploaded !== undefined}
              describedById={`${fieldId}-upload-error`}
            />
            <FieldError
              id={`${fieldId}-upload-error`}
              message={errors.documentUploaded?.message}
            />
          </div>
        )}
      />

      <StepFooter onBack={onBack} />
    </form>
  );
}

function PropertyStep({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: PropertyValues;
  onNext: (values: PropertyValues) => void;
  onBack: () => void;
}) {
  const fieldId = useId();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyValues>({
    resolver: zodResolver(propertySchema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="Where is it?"
        blurb="The address you'll list homes under once you're verified."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-address`}>Property address</Label>
        <Input
          id={`${fieldId}-address`}
          placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
          aria-invalid={errors.propertyAddress !== undefined}
          aria-describedby={
            errors.propertyAddress === undefined
              ? undefined
              : `${fieldId}-address-error`
          }
          {...register("propertyAddress")}
        />
        <FieldError
          id={`${fieldId}-address-error`}
          message={errors.propertyAddress?.message}
        />
      </div>

      <Controller
        control={control}
        name="legitimacyDoc"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
              Any of these on hand? (optional — speeds up review)
            </legend>
            <RadioGroup
              value={field.value}
              // Safe: every value RadioGroupItem can emit here comes from
              // LEGITIMACY_OPTIONS, which enumerates exactly the
              // VerificationSubmission["legitimacyDoc"] union.
              onValueChange={(value) => field.onChange(value as LegitimacyDoc)}
            >
              {LEGITIMACY_OPTIONS.map((option, index) => {
                const optionId = `${fieldId}-legit-${option.value}`;
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
                    <RadioGroupItem
                      value={option.value}
                      id={optionId}
                      ref={index === 0 ? field.ref : undefined}
                    />
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

      <StepFooter onBack={onBack} />
    </form>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-wide text-muted-ink uppercase">
          {label}
        </span>
        <span className="text-sm font-medium text-ink">{value}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={onEdit}
        className="h-11 shrink-0 rounded-full px-3 text-xs font-semibold tracking-normal normal-case"
      >
        Edit
      </Button>
    </div>
  );
}

function ReviewStep({
  draft,
  onEdit,
  onBack,
  onSubmit,
}: {
  draft: VerificationDraft;
  onEdit: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <StepIntro
        title="Check it over"
        blurb="This goes straight to our review team — usually a decision within 48 hours."
      />

      <div className="flex flex-col gap-4 rounded-2xl bg-paper-2 p-4">
        <ReviewRow
          label="NIN"
          value={maskNin(draft.identity.nin)}
          onEdit={() => onEdit(0)}
        />
        <ReviewRow
          label="Phone"
          value={draft.identity.phone}
          onEdit={() => onEdit(0)}
        />
        <ReviewRow
          label="Ownership document"
          value={OWNERSHIP_DOC_LABEL[draft.ownership.ownershipDocType]}
          onEdit={() => onEdit(1)}
        />
        <ReviewRow
          label="Property address"
          value={draft.property.propertyAddress}
          onEdit={() => onEdit(2)}
        />
        <ReviewRow
          label="Legitimacy document"
          value={LEGITIMACY_LABEL[draft.property.legitimacyDoc]}
          onEdit={() => onEdit(2)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-11 rounded-full px-4 text-sm font-semibold tracking-normal normal-case"
        >
          <ArrowLeftIcon weight="bold" aria-hidden className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          className="h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
        >
          Submit for review
        </Button>
      </div>
    </div>
  );
}

function WizardHeader({
  stepIndex,
  onJump,
}: {
  stepIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <header className="flex flex-col gap-3">
      <Progress
        value={((stepIndex + 1) / WIZARD_STEP_LABELS.length) * 100}
        aria-hidden
        className="h-1"
      />
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-xs font-semibold tracking-wide text-primary-700 uppercase"
      >
        Step {stepIndex + 1} of {WIZARD_STEP_LABELS.length}:{" "}
        {WIZARD_STEP_LABELS[stepIndex]}
      </p>
      <ol className="hidden list-none flex-wrap gap-1 p-0 sm:flex">
        {WIZARD_STEP_LABELS.map((label, index) => {
          const isCurrent = index === stepIndex;
          const isDone = index < stepIndex;
          return (
            <li key={label}>
              {isDone ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onJump(index)}
                  className="h-11 rounded-full px-3 text-xs font-semibold tracking-normal text-primary-700 normal-case"
                >
                  {label}
                </Button>
              ) : (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex h-11 items-center rounded-full px-3 text-xs font-semibold",
                    isCurrent
                      ? "bg-primary-50 text-primary-900"
                      : "text-muted-ink",
                  )}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}

function VerificationWizard({
  landlordId,
  landlordName,
  onSubmit,
}: {
  landlordId: string;
  landlordName: string;
  onSubmit: (
    payload: Omit<VerificationSubmission, "id" | "status" | "submittedAt">,
  ) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<VerificationDraft>(createEmptyDraft);

  function goNext() {
    setStepIndex((index) => Math.min(index + 1, WIZARD_STEP_LABELS.length - 1));
  }
  function goBack() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  function saveIdentity(values: IdentityValues) {
    setDraft((prev) => ({ ...prev, identity: values }));
    goNext();
  }
  function saveOwnership(values: OwnershipValues) {
    setDraft((prev) => ({ ...prev, ownership: values }));
    goNext();
  }
  function saveProperty(values: PropertyValues) {
    setDraft((prev) => ({ ...prev, property: values }));
    goNext();
  }

  function handleFinalSubmit() {
    onSubmit({
      landlordId,
      landlordName,
      nin: maskNin(draft.identity.nin),
      propertyAddress: draft.property.propertyAddress,
      ownershipDocType: draft.ownership.ownershipDocType,
      legitimacyDoc: draft.property.legitimacyDoc,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <WizardHeader stepIndex={stepIndex} onJump={setStepIndex} />
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-6">
          {stepIndex === 0 && (
            <IdentityStep
              defaultValues={draft.identity}
              onNext={saveIdentity}
            />
          )}
          {stepIndex === 1 && (
            <OwnershipStep
              defaultValues={draft.ownership}
              onNext={saveOwnership}
              onBack={goBack}
            />
          )}
          {stepIndex === 2 && (
            <PropertyStep
              defaultValues={draft.property}
              onNext={saveProperty}
              onBack={goBack}
            />
          )}
          {stepIndex === 3 && (
            <ReviewStep
              draft={draft}
              onEdit={setStepIndex}
              onBack={goBack}
              onSubmit={handleFinalSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
