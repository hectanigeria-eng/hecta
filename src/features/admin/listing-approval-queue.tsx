"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  HouseLineIcon,
  SealCheckIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useId, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  MIN_LISTING_IMAGES,
} from "@/constants/marketplace";
import { FieldError } from "@/features/dashboard/new-listing/field-error";
import { CostBreakdownCard } from "@/features/listing/cost-breakdown-card";
import { SpecChips } from "@/features/listing/spec-chips";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate, formatNaira, pricePeriodLabel } from "@/lib/format";
import { isSuspiciousPrice } from "@/lib/marketplace";
import { useHectaStore } from "@/lib/store";
import type { Listing, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const REASON_MIN_LENGTH = 10;
const RECENTLY_REJECTED_LIMIT = 5;

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

interface CompletenessCheck {
  key: string;
  ok: boolean;
  label: string;
}

function completenessChecks(listing: Listing): CompletenessCheck[] {
  const descriptionLength = listing.description.trim().length;
  return [
    {
      key: "photos",
      ok: listing.images.length >= MIN_LISTING_IMAGES,
      label: `${listing.images.length} of ${MIN_LISTING_IMAGES}+ photos`,
    },
    {
      key: "description",
      ok:
        descriptionLength >= DESCRIPTION_MIN_CHARS &&
        descriptionLength <= DESCRIPTION_MAX_CHARS,
      label: `Description: ${descriptionLength} characters`,
    },
    {
      key: "charges",
      ok: listing.otherCharges.length > 0,
      label:
        listing.otherCharges.length > 0
          ? "Move-in charges disclosed"
          : "No charges listed",
    },
  ];
}

/**
 * Mirrors `isSuspiciousPrice`'s comparable-set filter (same intent +
 * propertyType + cityLga, excluding the listing itself) purely to *display*
 * the median an admin can weigh against — the suspicious verdict itself
 * always comes from `isSuspiciousPrice`, never recomputed here. Only ever
 * called once that verdict is already true, at which point
 * `isSuspiciousPrice` guarantees at least `MIN_COMPARABLES_FOR_PRICE_CHECK`
 * comps exist, so the empty-set case below is a defensive fallback rather
 * than a path this component expects to hit.
 */
function comparableMedian(
  listing: Listing,
  all: Listing[],
): number | undefined {
  const comps = all.filter(
    (l) =>
      l.id !== listing.id &&
      l.intent === listing.intent &&
      l.propertyType === listing.propertyType &&
      l.location.cityLga === listing.location.cityLga,
  );
  if (comps.length === 0) return undefined;
  const prices = comps.map((c) => c.price).sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}

function suspiciousPriceTooltip(
  listing: Listing,
  median: number | undefined,
): string {
  if (median === undefined) {
    return "Priced well outside comparable listings for this area.";
  }
  const direction = listing.price > median ? "well above" : "well below";
  return `${formatNaira(listing.price)} is ${direction} the ${formatNaira(median)} median for comparable listings in this area.`;
}

/**
 * The one screen where a landlord's `pending_review` listing actually goes
 * live in search — approving here flips `status` to `active`, rejecting
 * records a reason on `reviewNote` so the landlord knows what to fix (see
 * `MyListingsTable`, which surfaces it). Every completeness/price signal is
 * computed fresh from the live store, never hardcoded.
 */
export function ListingApprovalQueue() {
  const hydrated = useHydrated();
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);
  const reviewListing = useHectaStore((state) => state.reviewListing);

  const [rejectTarget, setRejectTarget] = useState<Listing | null>(null);

  if (!hydrated) {
    return <ListingApprovalQueueSkeleton />;
  }

  const pending = listings
    .filter((listing) => listing.status === "pending_review")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const recentlyRejected = listings
    .filter(
      (listing) =>
        listing.status === "rejected" && listing.reviewNote !== undefined,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, RECENTLY_REJECTED_LIMIT);

  function handleApprove(listing: Listing) {
    reviewListing(listing.id, true);
    toast.success(`"${listing.title}" approved — live on search.`);
  }

  function handleRejectSubmit(reason: string) {
    if (rejectTarget === null) return;
    reviewListing(rejectTarget.id, false, reason);
    toast.info(`"${rejectTarget.title}" rejected.`);
    setRejectTarget(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {pending.length === 0 ? (
        <EmptyQueueState />
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {pending.map((listing) => (
            <li key={listing.id}>
              <ListingRow
                listing={listing}
                landlord={users.find((u) => u.id === listing.landlordId)}
                allListings={listings}
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            </li>
          ))}
        </ul>
      )}

      {recentlyRejected.length > 0 && (
        <section
          aria-label="Recently rejected listings"
          className="flex flex-col gap-3"
        >
          <h2 className="font-heading text-lg font-bold text-ink">
            Recently rejected
          </h2>
          <ul className="flex list-none flex-col gap-2 p-0">
            {recentlyRejected.map((listing) => (
              <li key={listing.id}>
                <Card size="sm" className="rounded-2xl ring-1 ring-border">
                  <CardContent className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-ink">
                      {listing.title}
                    </span>
                    <p className="flex items-start gap-1.5 text-xs text-destructive">
                      <WarningCircleIcon
                        weight="fill"
                        aria-hidden
                        className="mt-0.5 size-3.5 shrink-0"
                      />
                      <span>{listing.reviewNote}</span>
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RejectDialog
        target={rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}

interface ListingRowProps {
  listing: Listing;
  landlord: User | undefined;
  allListings: Listing[];
  onApprove: (listing: Listing) => void;
  onReject: (listing: Listing) => void;
}

function ListingRow({
  listing,
  landlord,
  allListings,
  onApprove,
  onReject,
}: ListingRowProps) {
  const suspicious = isSuspiciousPrice(listing, allListings);
  const median = suspicious
    ? comparableMedian(listing, allListings)
    : undefined;
  const checks = completenessChecks(listing);
  const landlordVerified = landlord?.landlordVerified ?? false;

  return (
    <Card className="rounded-3xl ring-1 ring-border">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-paper-2">
            <Image
              src={listing.images[0]}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-bold text-ink">
                {listing.title}
              </h3>
              {suspicious && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="inline-flex cursor-default items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-semibold tracking-normal normal-case text-secondary-900">
                        <WarningIcon
                          weight="fill"
                          aria-hidden
                          className="size-3.5"
                        />
                        Suspicious price
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {suspiciousPriceTooltip(listing, median)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-ink">
              {landlord?.name ?? "Unknown landlord"}
              <Badge
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tracking-normal normal-case",
                  landlordVerified
                    ? "bg-primary-100 text-primary-800"
                    : "bg-transparent text-destructive ring-1 ring-destructive/40",
                )}
              >
                {landlordVerified && (
                  <SealCheckIcon weight="fill" aria-hidden className="size-3" />
                )}
                {landlordVerified ? "Verified" : "Unverified"}
              </Badge>
            </p>
            <p className="text-sm font-semibold text-ink">
              {formatNaira(listing.price)}
              <span className="text-xs font-normal text-muted-ink">
                {pricePeriodLabel(listing.pricePeriod)}
              </span>
            </p>
          </div>
        </div>

        <Separator />

        <ul className="flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          {checks.map((check) => (
            <li key={check.key} className="flex items-center gap-1.5 text-xs">
              {check.ok ? (
                <CheckIcon
                  weight="bold"
                  aria-hidden
                  className="size-3.5 shrink-0 text-primary-600"
                />
              ) : (
                <WarningIcon
                  weight="fill"
                  aria-hidden
                  className="size-3.5 shrink-0 text-secondary-600"
                />
              )}
              <span
                className={
                  check.ok ? "text-ink" : "font-medium text-secondary-900"
                }
              >
                {check.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={`Preview ${listing.title}`}
                className="h-11 rounded-full text-xs font-semibold tracking-normal normal-case"
              >
                Preview
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="normal-case tracking-tight">
                  {listing.title}
                </SheetTitle>
                <SheetDescription>
                  Submitted {formatDate(listing.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6 px-8 pb-8">
                <SpecChips listing={listing} />
                <p className="text-sm leading-relaxed text-ink">
                  {listing.description}
                </p>
                <CostBreakdownCard listing={listing} />
              </div>
            </SheetContent>
          </Sheet>
          <Button
            type="button"
            aria-label={`Approve and publish ${listing.title}`}
            onClick={() => onApprove(listing)}
            className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
          >
            Approve &amp; publish
          </Button>
          <Button
            type="button"
            variant="destructive"
            aria-label={`Reject ${listing.title}`}
            onClick={() => onReject(listing)}
            className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyQueueState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <HouseLineIcon weight="duotone" className="size-12 text-muted-ink" />
      <h2 className="font-heading text-lg font-semibold text-ink">
        Queue is clear
      </h2>
      <p className="max-w-sm text-sm text-muted-ink">
        No listings are waiting for review right now.
      </p>
    </div>
  );
}

function RejectDialog({
  target,
  onCancel,
  onSubmit,
}: {
  target: Listing | null;
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
          <RejectDialogForm
            key={target.id}
            target={target}
            onCancel={onCancel}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RejectDialogForm({
  target,
  onCancel,
  onSubmit,
}: {
  target: Listing;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const fieldId = useId();
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
        <DialogTitle>Reject this listing</DialogTitle>
        <DialogDescription>
          Explain what needs fixing — {target.title} will show this to its
          landlord.
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
          variant="destructive"
          className="h-11 rounded-full text-sm font-semibold tracking-normal normal-case"
        >
          Reject listing
        </Button>
      </DialogFooter>
    </form>
  );
}

function ListingApprovalQueueSkeleton() {
  const keys = ["a", "b", "c"];
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {keys.map((key) => (
        <Skeleton key={key} className="h-56 w-full rounded-3xl" />
      ))}
    </div>
  );
}
