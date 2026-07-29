"use client";

import {
  InfoIcon,
  PencilSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { locationLabel } from "@/constants/locations";
import { PROPERTY_TYPE_LABELS } from "@/constants/marketplace";
import { ListingCard } from "@/features/search/listing-card";
import { formatDate, formatNaira, pricePeriodLabel } from "@/lib/format";
import type { Listing } from "@/lib/types";
import {
  FURNISHING_OPTIONS,
  INTENT_OPTIONS,
  LEASE_OPTIONS,
  optionLabel,
  PRICE_PERIOD_OPTIONS,
  SERVICED_OPTIONS,
} from "./labels";
import {
  buildListingPayload,
  draftMoveInTotal,
  draftRefundableTotal,
  type ListingDraft,
  type NewListingInput,
  type WizardStepId,
} from "./steps";

const PREVIEW_LISTING_ID = "listing-preview";

interface SummaryEntry {
  term: string;
  value: string;
}

interface ReviewStepProps {
  draft: ListingDraft;
  landlordId: string;
  submitting: boolean;
  onEdit: (stepId: WizardStepId) => void;
  onSubmit: (payload: NewListingInput) => void;
}

/**
 * Last stop before the approval queue: the landlord sees their listing exactly
 * as a seeker will, then every answer they gave with a one-tap route back to
 * the step that owns it — so a correction never means restarting the wizard.
 */
export function ReviewStep({
  draft,
  landlordId,
  submitting,
  onEdit,
  onSubmit,
}: ReviewStepProps) {
  const result = useMemo(
    () => buildListingPayload(draft, landlordId),
    [draft, landlordId],
  );

  // Frozen at mount so the preview card's "confirmed available" line does not
  // re-render on every keystroke elsewhere in the wizard.
  const previewStamp = useMemo(() => new Date().toISOString(), []);

  if (!result.ok) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-destructive/40 bg-card p-5">
        <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
          <WarningCircleIcon
            weight="fill"
            aria-hidden
            className="size-5 text-destructive"
          />
          One thing still needs you
        </h3>
        <p className="text-sm text-muted-ink">{result.message}</p>
        <Button
          type="button"
          onClick={() => onEdit(result.stepId)}
          className="h-11 rounded-full px-5 text-sm font-semibold tracking-normal normal-case"
        >
          Take me there
        </Button>
      </div>
    );
  }

  const payload = result.payload;
  const preview: Listing = {
    ...payload,
    id: PREVIEW_LISTING_ID,
    status: "pending_review",
    verifiedProperty: false,
    createdAt: previewStamp,
    lastConfirmedAvailableAt: previewStamp,
    reconfirmDueAt: previewStamp,
  };

  const place = locationLabel(
    payload.location.state,
    payload.location.cityLga,
    payload.location.area,
  );
  const total = draftMoveInTotal(draft.costs);
  const refundable = draftRefundableTotal(draft.costs);

  const basicsEntries: SummaryEntry[] = [
    {
      term: "Listing type",
      value: optionLabel(INTENT_OPTIONS, payload.intent),
    },
    {
      term: "Property type",
      value: PROPERTY_TYPE_LABELS[payload.propertyType],
    },
    { term: "Headline", value: payload.title },
  ];

  const locationEntries: SummaryEntry[] = [
    { term: "Area", value: place },
    {
      term: "Street",
      value: payload.location.street ?? "Not shared",
    },
  ];

  const specsEntries: SummaryEntry[] = [
    { term: "Bedrooms", value: String(payload.bedrooms) },
    { term: "Bathrooms", value: String(payload.bathrooms) },
    { term: "Toilets", value: String(payload.toilets) },
    {
      term: "Size",
      value:
        payload.sizeSqm === undefined
          ? "Not given"
          : `${payload.sizeSqm.toLocaleString("en-NG")} sqm`,
    },
    {
      term: "Floor",
      value: payload.floor === undefined ? "Not given" : String(payload.floor),
    },
    {
      term: "Serviced",
      value: optionLabel(SERVICED_OPTIONS, payload.serviced),
    },
    {
      term: "Furnishing",
      value: optionLabel(FURNISHING_OPTIONS, payload.furnishing),
    },
    { term: "Lease", value: optionLabel(LEASE_OPTIONS, payload.leaseType) },
    { term: "Pets", value: payload.petsAllowed ? "Allowed" : "Not allowed" },
    { term: "Available from", value: formatDate(payload.moveInDate) },
    { term: "Power", value: payload.powerSupply },
    { term: "Water", value: payload.waterSupply },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-lg font-bold text-ink">
          How seekers will see it
        </h3>
        {/* `inert` keeps the preview strictly a picture: its card links to a
         * listing id that does not exist yet, so it must not be reachable by
         * click or by keyboard. The summary below carries the same content. */}
        <div inert className="max-w-sm">
          <ListingCard listing={preview} />
        </div>
      </section>

      <Separator />

      <SummarySection
        title="Basics"
        stepId="basics"
        entries={basicsEntries}
        onEdit={onEdit}
      />
      <SummarySection
        title="Location"
        stepId="location"
        entries={locationEntries}
        onEdit={onEdit}
      />
      <SummarySection
        title="Specs"
        stepId="specs"
        entries={specsEntries}
        onEdit={onEdit}
      />

      <section className="flex flex-col gap-3">
        <SectionHeader title="Costs" stepId="costs" onEdit={onEdit} />
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-ink">
              Asking price
              {pricePeriodLabel(payload.pricePeriod) === ""
                ? ` (${optionLabel(PRICE_PERIOD_OPTIONS, payload.pricePeriod)})`
                : pricePeriodLabel(payload.pricePeriod)}
            </dt>
            <dd className="font-semibold text-ink">
              {formatNaira(payload.price)}
            </dd>
          </div>
          {payload.otherCharges.map((charge, index) => (
            <div
              // Labels are unique within a listing (the costs schema rejects
              // repeats), but the index keeps the key stable even mid-edit.
              key={`${index}-${charge.label}`}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="flex items-center gap-2 text-muted-ink">
                {charge.label}
                {charge.refundable && (
                  <Badge className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-900">
                    Refundable
                  </Badge>
                )}
              </dt>
              <dd className="font-semibold text-ink">
                {formatNaira(charge.amount)}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
            <dt className="font-heading font-bold text-ink">
              Total move-in cost
            </dt>
            <dd className="font-heading font-bold text-ink">
              {formatNaira(total)}
            </dd>
          </div>
          {refundable > 0 && (
            <p className="text-xs text-muted-ink">
              {formatNaira(refundable)} of that is refundable to the tenant.
            </p>
          )}
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Photos" stepId="photos" onEdit={onEdit} />
        <p className="text-sm text-muted-ink">
          {payload.images.length} photos selected — the first is your cover.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Details" stepId="details" onEdit={onEdit} />
        <p className="text-sm whitespace-pre-line text-ink">
          {payload.description}
        </p>
        {payload.amenities.length > 0 ? (
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {payload.amenities.map((amenity) => (
              <li key={amenity}>
                <Badge className="rounded-full bg-paper-2 px-3 py-1 text-ink">
                  {amenity}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-ink">No amenities selected.</p>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-primary-50 p-4 text-sm text-primary-900 ring-1 ring-primary-200">
        <InfoIcon
          weight="fill"
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          Your listing will be reviewed by Hecta before going live (usually
          under 48 hours).
        </span>
      </p>

      <Button
        type="button"
        disabled={submitting}
        onClick={() => onSubmit(payload)}
        className="h-12 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </Button>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  stepId: WizardStepId;
  onEdit: (stepId: WizardStepId) => void;
}

function SectionHeader({ title, stepId, onEdit }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-heading text-lg font-bold text-ink">{title}</h3>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onEdit(stepId)}
        className="h-11 rounded-full px-4 text-xs font-semibold tracking-normal text-primary-700 normal-case"
      >
        <PencilSimpleIcon weight="bold" aria-hidden className="size-3.5" />
        Edit {title.toLowerCase()}
      </Button>
    </div>
  );
}

interface SummarySectionProps extends SectionHeaderProps {
  entries: SummaryEntry[];
}

function SummarySection({
  title,
  stepId,
  entries,
  onEdit,
}: SummarySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title={title} stepId={stepId} onEdit={onEdit} />
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {entries.map((entry) => (
          <div
            key={entry.term}
            className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
          >
            <dt className="text-muted-ink">{entry.term}</dt>
            <dd className="text-right font-semibold text-ink">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
