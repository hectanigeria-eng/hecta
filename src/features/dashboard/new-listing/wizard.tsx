"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SealCheckIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import {
  Controller,
  type UseFormGetValues,
  type UseFormWatch,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  cityBySlug,
  NIGERIA_LOCATIONS,
  stateBySlug,
} from "@/constants/locations";
import {
  AMENITY_OPTIONS,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  MIN_LISTING_IMAGES,
  PROPERTY_TYPE_LABELS,
} from "@/constants/marketplace";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";
import type { Intent, PropertyType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChargeBuilder } from "./charge-builder";
import { FieldError } from "./field-error";
import {
  defaultPricePeriodFor,
  FURNISHING_OPTIONS,
  INTENT_OPTIONS,
  LEASE_OPTIONS,
  pricePeriodOptionsFor,
  SERVICED_OPTIONS,
} from "./labels";
import { PhotoPicker } from "./photo-picker";
import { ReviewStep } from "./review-step";
import {
  type BasicsValues,
  basicsSchema,
  type CostsValues,
  costsSchema,
  createEmptyDraft,
  type DetailsValues,
  detailsSchema,
  isSizeSqmRequired,
  type ListingDraft,
  type LocationValues,
  locationSchema,
  MAX_ROOM_COUNT,
  type NewListingInput,
  type PhotosValues,
  photosSchema,
  type SpecsValues,
  specsSchemaFor,
  stepIndexOf,
  TITLE_MAX_CHARS,
  WIZARD_STEPS,
  type WizardStepId,
} from "./steps";

const REDIRECT_DELAY_MS = 1800;
const REVIEW_STEP_INDEX = stepIndexOf("review");
const RESUME_LABEL = "Back to review";
const PROPERTY_TYPE_ENTRIES = Object.entries(PROPERTY_TYPE_LABELS).filter(
  // Object.entries widens the key to `string`; re-narrowing through the source
  // record keeps `value` a PropertyType without a type assertion.
  (entry): entry is [PropertyType, string] => entry[0] in PROPERTY_TYPE_LABELS,
);

/**
 * Seven short steps between a verified landlord and the approval queue.
 *
 * Every keystroke is mirrored into the parent `draft` as it happens (see
 * `useDraftSync`), so Back, the stepper, and the review page's Edit links all
 * return the landlord to a step exactly as they left it — losing a half-typed
 * answer is the fastest way to lose the landlord.
 */
export function NewListingWizard() {
  const hydrated = useHydrated();
  const { user, isLandlordVerified } = useSession();
  const createListing = useHectaStore((state) => state.createListing);
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(createEmptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState<string | null>(null);

  // Set when the landlord jumps back from Review to fix one thing: their next
  // Continue returns them straight to Review instead of walking every step
  // again.
  const [resumeAtReview, setResumeAtReview] = useState(false);

  const goTo = useCallback((stepId: WizardStepId) => {
    setStepIndex(stepIndexOf(stepId));
    setResumeAtReview(stepId !== "review");
  }, []);
  const goNext = useCallback(() => {
    setStepIndex((index) =>
      resumeAtReview
        ? REVIEW_STEP_INDEX
        : Math.min(index + 1, WIZARD_STEPS.length - 1),
    );
    setResumeAtReview(false);
  }, [resumeAtReview]);
  const goBack = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
    setResumeAtReview(false);
  }, []);
  const jumpTo = useCallback((index: number) => {
    setStepIndex(index);
    setResumeAtReview(false);
  }, []);

  const saveBasics = useCallback((values: BasicsValues) => {
    setDraft((prev) => {
      const allowed = pricePeriodOptionsFor(values.intent);
      const keepsPeriod = allowed.some(
        (option) => option.value === prev.costs.pricePeriod,
      );
      return {
        ...prev,
        basics: values,
        costs: {
          ...prev.costs,
          pricePeriod: keepsPeriod
            ? prev.costs.pricePeriod
            : defaultPricePeriodFor(values.intent),
        },
      };
    });
  }, []);
  const saveLocation = useCallback((values: LocationValues) => {
    setDraft((prev) => ({ ...prev, location: values }));
  }, []);
  const saveSpecs = useCallback((values: SpecsValues) => {
    setDraft((prev) => ({ ...prev, specs: values }));
  }, []);
  const saveCosts = useCallback((values: CostsValues) => {
    setDraft((prev) => ({ ...prev, costs: values }));
  }, []);
  const savePhotos = useCallback((values: PhotosValues) => {
    setDraft((prev) => ({ ...prev, photos: values }));
  }, []);
  const saveDetails = useCallback((values: DetailsValues) => {
    setDraft((prev) => ({ ...prev, details: values }));
  }, []);

  const handleSubmitListing = useCallback(
    (payload: NewListingInput) => {
      setSubmitting(true);
      createListing(payload);
      setSubmittedTitle(payload.title);
      toast.success("Listing submitted for review.");
    },
    [createListing],
  );

  // Takes the landlord to their listings once the success panel has had a
  // moment to be read; the panel also carries a button for the impatient.
  useEffect(() => {
    if (submittedTitle === null) return;
    const timeout = window.setTimeout(() => {
      router.push("/dashboard/listings");
    }, REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [submittedTitle, router]);

  if (!hydrated) {
    return (
      <>
        <PageHeader showSteps={false} />
        <Skeleton className="h-128 w-full rounded-3xl" aria-hidden />
      </>
    );
  }

  if (!isLandlordVerified) {
    return (
      <>
        <PageHeader showSteps={false} />
        <VerificationRequiredCard />
      </>
    );
  }

  if (submittedTitle !== null) {
    return (
      <>
        <PageHeader showSteps={false} />
        <SubmittedPanel title={submittedTitle} />
      </>
    );
  }

  const step = WIZARD_STEPS[stepIndex];
  const resumeLabel = resumeAtReview ? RESUME_LABEL : undefined;

  return (
    <>
      <PageHeader showSteps />
      <div className="flex flex-col gap-6">
        <WizardHeader stepIndex={stepIndex} onJump={jumpTo} />

        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-6">
            {step.id === "basics" && (
              <BasicsStep
                defaultValues={draft.basics}
                onChange={saveBasics}
                onNext={goNext}
                nextLabel={resumeLabel}
              />
            )}
            {step.id === "location" && (
              <LocationStep
                defaultValues={draft.location}
                onChange={saveLocation}
                onNext={goNext}
                onBack={goBack}
                nextLabel={resumeLabel}
              />
            )}
            {step.id === "specs" && (
              <SpecsStep
                defaultValues={draft.specs}
                intent={draft.basics.intent}
                propertyType={draft.basics.propertyType}
                onChange={saveSpecs}
                onNext={goNext}
                onBack={goBack}
                nextLabel={resumeLabel}
              />
            )}
            {step.id === "costs" && (
              <CostsStep
                defaultValues={draft.costs}
                intent={draft.basics.intent}
                onChange={saveCosts}
                onNext={goNext}
                onBack={goBack}
                nextLabel={resumeLabel}
              />
            )}
            {step.id === "photos" && (
              <PhotosStep
                defaultValues={draft.photos}
                onChange={savePhotos}
                onNext={goNext}
                onBack={goBack}
                nextLabel={resumeLabel}
              />
            )}
            {step.id === "details" && (
              <DetailsStep
                defaultValues={draft.details}
                onChange={saveDetails}
                onNext={goNext}
                onBack={goBack}
                nextLabel={resumeLabel ?? "Review listing"}
              />
            )}
            {step.id === "review" && (
              <>
                <StepIntro
                  title="Check it over"
                  blurb="This is exactly what a seeker sees. Anything you want to change is one tap away."
                />
                <ReviewStep
                  draft={draft}
                  landlordId={user.id}
                  submitting={submitting}
                  onEdit={goTo}
                  onSubmit={handleSubmitListing}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  className="h-11 self-start rounded-full px-4 text-sm font-semibold tracking-normal normal-case"
                >
                  <ArrowLeftIcon weight="bold" aria-hidden className="size-4" />
                  Back
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PageHeader({ showSteps }: { showSteps: boolean }) {
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="font-heading text-2xl font-bold text-ink">
        List your property
      </h1>
      {showSteps && (
        <p className="text-sm text-muted-ink">
          Seven short steps. Everything you enter is kept as you move between
          them.
        </p>
      )}
    </header>
  );
}

interface WizardHeaderProps {
  stepIndex: number;
  onJump: (index: number) => void;
}

function WizardHeader({ stepIndex, onJump }: WizardHeaderProps) {
  const current = WIZARD_STEPS[stepIndex];
  return (
    <header className="flex flex-col gap-3">
      <Progress
        value={((stepIndex + 1) / WIZARD_STEPS.length) * 100}
        aria-hidden
        className="h-1"
      />
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-xs font-semibold tracking-wide text-primary-700 uppercase"
      >
        Step {stepIndex + 1} of {WIZARD_STEPS.length}: {current.label}
      </p>
      <ol className="hidden list-none flex-wrap gap-1 p-0 sm:flex">
        {WIZARD_STEPS.map((step, index) => {
          const isCurrent = index === stepIndex;
          const isDone = index < stepIndex;
          return (
            <li key={step.id}>
              {isDone ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onJump(index)}
                  className="h-11 rounded-full px-3 text-xs font-semibold tracking-normal text-primary-700 normal-case"
                >
                  {step.label}
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
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}

interface StepIntroProps {
  title: string;
  blurb: string;
}

function StepIntro({ title, blurb }: StepIntroProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="font-heading text-xl font-bold text-ink">{title}</h2>
      <p className="text-sm text-muted-ink">{blurb}</p>
    </div>
  );
}

interface StepFooterProps {
  onBack?: () => void;
  nextLabel?: string;
}

function StepFooter({ onBack, nextLabel = "Continue" }: StepFooterProps) {
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

/**
 * Mirrors the live form values into the wizard draft on every change, so the
 * parent always holds what the landlord has typed — even mid-step, and even
 * if the step never validates.
 */
function useDraftSync<TValues extends Record<string, unknown>>(
  watch: UseFormWatch<TValues>,
  getValues: UseFormGetValues<TValues>,
  onChange: (values: TValues) => void,
) {
  useEffect(() => {
    const subscription = watch(() => {
      onChange(getValues());
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onChange]);
}

interface StepProps<TValues> {
  defaultValues: TValues;
  onChange: (values: TValues) => void;
  onNext: () => void;
  onBack?: () => void;
  /** Overrides the forward button's label (e.g. "Back to review"). */
  nextLabel?: string;
}

function BasicsStep({
  defaultValues,
  onChange,
  onNext,
  nextLabel,
}: StepProps<BasicsValues>) {
  const fieldId = useId();
  const {
    control,
    register,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema, undefined, { raw: true }),
    defaultValues,
  });
  useDraftSync(watch, getValues, onChange);

  const title = watch("title") ?? "";

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="What are you listing?"
        blurb="Two taps and a headline — this is the shortest step."
      />

      <Controller
        control={control}
        name="intent"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
              Are you renting it out or selling it?
            </legend>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="sm:grid-cols-2"
            >
              {INTENT_OPTIONS.map((option, index) => {
                const optionId = `${fieldId}-intent-${option.value}`;
                const isActive = field.value === option.value;
                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
                      isActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-border bg-card hover:bg-paper-2",
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={optionId}
                      ref={index === 0 ? field.ref : undefined}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-0.5 normal-case">
                      <span className="text-sm font-semibold text-ink">
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-ink">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>
        )}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-type`}>Property type</Label>
        <Controller
          control={control}
          name="propertyType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={`${fieldId}-type`}
                ref={field.ref}
                className="w-full"
                aria-invalid={errors.propertyType !== undefined}
              >
                <SelectValue placeholder="Choose a property type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_ENTRIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-title`}>Headline</Label>
        <Input
          id={`${fieldId}-title`}
          placeholder="3 bedroom flat in Lekki Phase 1"
          maxLength={TITLE_MAX_CHARS}
          aria-invalid={errors.title !== undefined}
          aria-describedby={
            errors.title === undefined
              ? `${fieldId}-title-hint`
              : `${fieldId}-title-error`
          }
          {...register("title")}
        />
        <p id={`${fieldId}-title-hint`} className="text-xs text-muted-ink">
          Say the size, the type and the area — {title.trim().length} of{" "}
          {TITLE_MAX_CHARS} characters used.
        </p>
        <FieldError
          id={`${fieldId}-title-error`}
          message={errors.title?.message}
        />
      </div>

      <StepFooter nextLabel={nextLabel} />
    </form>
  );
}

function LocationStep({
  defaultValues,
  onChange,
  onNext,
  onBack,
  nextLabel,
}: StepProps<LocationValues>) {
  const fieldId = useId();
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema, undefined, { raw: true }),
    defaultValues,
  });
  useDraftSync(watch, getValues, onChange);

  const selectedState = watch("state");
  const selectedCity = watch("cityLga");
  const cities = stateBySlug(selectedState)?.cities ?? [];
  const areas = cityBySlug(selectedState, selectedCity)?.areas ?? [];

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="Where is it?"
        blurb="Seekers search by area, so this is the field that gets you found."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-state`}>State</Label>
        <Controller
          control={control}
          name="state"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                setValue("cityLga", "", { shouldValidate: false });
                setValue("area", "", { shouldValidate: false });
              }}
            >
              <SelectTrigger
                id={`${fieldId}-state`}
                ref={field.ref}
                className="w-full"
                aria-invalid={errors.state !== undefined}
                aria-describedby={
                  errors.state === undefined
                    ? undefined
                    : `${fieldId}-state-error`
                }
              >
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIA_LOCATIONS.map((state) => (
                  <SelectItem key={state.slug} value={state.slug}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError
          id={`${fieldId}-state-error`}
          message={errors.state?.message}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-city`}>City or LGA</Label>
        <Controller
          control={control}
          name="cityLga"
          render={({ field }) => (
            <Select
              value={field.value}
              disabled={cities.length === 0}
              onValueChange={(value) => {
                field.onChange(value);
                setValue("area", "", { shouldValidate: false });
              }}
            >
              <SelectTrigger
                id={`${fieldId}-city`}
                ref={field.ref}
                className="w-full"
                aria-invalid={errors.cityLga !== undefined}
                aria-describedby={
                  errors.cityLga === undefined
                    ? `${fieldId}-city-hint`
                    : `${fieldId}-city-error`
                }
              >
                <SelectValue placeholder="Choose a city or LGA" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p id={`${fieldId}-city-hint`} className="text-xs text-muted-ink">
          {cities.length === 0
            ? "Choose a state first."
            : "Pick the local government area."}
        </p>
        <FieldError
          id={`${fieldId}-city-error`}
          message={errors.cityLga?.message}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-area`}>Area</Label>
        <Controller
          control={control}
          name="area"
          render={({ field }) => (
            <Select
              value={field.value}
              disabled={areas.length === 0}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={`${fieldId}-area`}
                ref={field.ref}
                className="w-full"
                aria-invalid={errors.area !== undefined}
                aria-describedby={
                  errors.area === undefined
                    ? undefined
                    : `${fieldId}-area-error`
                }
              >
                <SelectValue placeholder="Choose an area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.slug} value={area.slug}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError
          id={`${fieldId}-area-error`}
          message={errors.area?.message}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-street`}>Street (optional)</Label>
        <Input
          id={`${fieldId}-street`}
          placeholder="12 Admiralty Way"
          aria-invalid={errors.street !== undefined}
          aria-describedby={
            errors.street === undefined
              ? `${fieldId}-street-hint`
              : `${fieldId}-street-error`
          }
          {...register("street")}
        />
        <p id={`${fieldId}-street-hint`} className="text-xs text-muted-ink">
          Shown only to seekers you accept — the map pin stays at area level.
        </p>
        <FieldError
          id={`${fieldId}-street-error`}
          message={errors.street?.message}
        />
      </div>

      <StepFooter onBack={onBack} nextLabel={nextLabel} />
    </form>
  );
}

interface SpecsStepProps extends StepProps<SpecsValues> {
  intent: Intent;
  propertyType: PropertyType;
}

function SpecsStep({
  defaultValues,
  intent,
  propertyType,
  onChange,
  onNext,
  onBack,
  nextLabel,
}: SpecsStepProps) {
  const fieldId = useId();
  const sizeRequired = isSizeSqmRequired(intent, propertyType);
  const {
    control,
    register,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<SpecsValues>({
    resolver: zodResolver(specsSchemaFor({ intent, propertyType }), undefined, {
      raw: true,
    }),
    defaultValues,
  });
  useDraftSync(watch, getValues, onChange);

  const counts: {
    name: "bedrooms" | "bathrooms" | "toilets";
    label: string;
  }[] = [
    { name: "bedrooms", label: "Bedrooms" },
    { name: "bathrooms", label: "Bathrooms" },
    { name: "toilets", label: "Toilets" },
  ];

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="What is it like inside?"
        blurb="The details seekers filter on. Put 0 where something does not apply."
      />

      <div className="grid grid-cols-3 gap-3">
        {counts.map((count) => (
          <div key={count.name} className="flex flex-col gap-1.5">
            <Label htmlFor={`${fieldId}-${count.name}`}>{count.label}</Label>
            <Input
              id={`${fieldId}-${count.name}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_ROOM_COUNT}
              step={1}
              placeholder="3"
              aria-invalid={errors[count.name] !== undefined}
              aria-describedby={
                errors[count.name] === undefined
                  ? undefined
                  : `${fieldId}-${count.name}-error`
              }
              {...register(count.name)}
            />
            <FieldError
              id={`${fieldId}-${count.name}-error`}
              message={errors[count.name]?.message}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-size`}>
            {`Size in sqm${sizeRequired ? "" : " (optional)"}`}
          </Label>
          <Input
            id={`${fieldId}-size`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="450"
            aria-invalid={errors.sizeSqm !== undefined}
            aria-describedby={
              errors.sizeSqm === undefined
                ? `${fieldId}-size-hint`
                : `${fieldId}-size-error`
            }
            {...register("sizeSqm")}
          />
          <p id={`${fieldId}-size-hint`} className="text-xs text-muted-ink">
            {sizeRequired
              ? "Buyers filter by size, so this one is required."
              : "Nice to have — renters rarely search on it."}
          </p>
          <FieldError
            id={`${fieldId}-size-error`}
            message={errors.sizeSqm?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-floor`}>Floor (optional)</Label>
          <Input
            id={`${fieldId}-floor`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="2"
            aria-invalid={errors.floor !== undefined}
            aria-describedby={
              errors.floor === undefined
                ? `${fieldId}-floor-hint`
                : `${fieldId}-floor-error`
            }
            {...register("floor")}
          />
          <p id={`${fieldId}-floor-hint`} className="text-xs text-muted-ink">
            Ground floor is 0.
          </p>
          <FieldError
            id={`${fieldId}-floor-error`}
            message={errors.floor?.message}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-serviced`}>Serviced</Label>
          <Controller
            control={control}
            name="serviced"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${fieldId}-serviced`}
                  ref={field.ref}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICED_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-furnishing`}>Furnishing</Label>
          <Controller
            control={control}
            name="furnishing"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${fieldId}-furnishing`}
                  ref={field.ref}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FURNISHING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-lease`}>Lease type</Label>
          <Controller
            control={control}
            name="leaseType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${fieldId}-lease`}
                  ref={field.ref}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEASE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-power`}>Power supply</Label>
          <Input
            id={`${fieldId}-power`}
            placeholder="Band A, about 20 hours daily"
            aria-invalid={errors.powerSupply !== undefined}
            aria-describedby={
              errors.powerSupply === undefined
                ? undefined
                : `${fieldId}-power-error`
            }
            {...register("powerSupply")}
          />
          <FieldError
            id={`${fieldId}-power-error`}
            message={errors.powerSupply?.message}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-water`}>Water supply</Label>
          <Input
            id={`${fieldId}-water`}
            placeholder="Borehole with treatment plant"
            aria-invalid={errors.waterSupply !== undefined}
            aria-describedby={
              errors.waterSupply === undefined
                ? undefined
                : `${fieldId}-water-error`
            }
            {...register("waterSupply")}
          />
          <FieldError
            id={`${fieldId}-water-error`}
            message={errors.waterSupply?.message}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-move-in`}>Available from</Label>
          <Input
            id={`${fieldId}-move-in`}
            type="date"
            aria-invalid={errors.moveInDate !== undefined}
            aria-describedby={
              errors.moveInDate === undefined
                ? undefined
                : `${fieldId}-move-in-error`
            }
            {...register("moveInDate")}
          />
          <FieldError
            id={`${fieldId}-move-in-error`}
            message={errors.moveInDate?.message}
          />
        </div>
        <Controller
          control={control}
          name="petsAllowed"
          render={({ field }) => (
            <label
              htmlFor={`${fieldId}-pets`}
              className="flex min-h-11 cursor-pointer items-center gap-3 self-end pb-2"
            >
              <Switch
                id={`${fieldId}-pets`}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
              <span className="text-sm text-ink">Pets allowed</span>
            </label>
          )}
        />
      </div>

      <StepFooter onBack={onBack} nextLabel={nextLabel} />
    </form>
  );
}

interface CostsStepProps extends StepProps<CostsValues> {
  intent: Intent;
}

function CostsStep({
  defaultValues,
  intent,
  onChange,
  onNext,
  onBack,
  nextLabel,
}: CostsStepProps) {
  const fieldId = useId();
  const {
    control,
    register,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<CostsValues>({
    resolver: zodResolver(costsSchema, undefined, { raw: true }),
    defaultValues,
  });
  useDraftSync(watch, getValues, onChange);

  const periodOptions = pricePeriodOptionsFor(intent);

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="What will it cost to move in?"
        blurb="Listing every charge up front is why seekers trust Hecta listings — and why yours gets replies instead of questions."
      />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-price`}>
            {intent === "buy" ? "Asking price (₦)" : "Rent (₦)"}
          </Label>
          <Input
            id={`${fieldId}-price`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="6500000"
            aria-invalid={errors.price !== undefined}
            aria-describedby={
              errors.price === undefined ? undefined : `${fieldId}-price-error`
            }
            {...register("price")}
          />
          <FieldError
            id={`${fieldId}-price-error`}
            message={errors.price?.message}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-period`}>Charged</Label>
          <Controller
            control={control}
            name="pricePeriod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${fieldId}-period`}
                  ref={field.ref}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <ChargeBuilder control={control} register={register} errors={errors} />

      <StepFooter onBack={onBack} nextLabel={nextLabel} />
    </form>
  );
}

function PhotosStep({
  defaultValues,
  onChange,
  onNext,
  onBack,
  nextLabel,
}: StepProps<PhotosValues>) {
  const fieldId = useId();
  const {
    control,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<PhotosValues>({
    resolver: zodResolver(photosSchema, undefined, { raw: true }),
    defaultValues,
  });
  useDraftSync(watch, getValues, onChange);

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="Add photos"
        blurb={`Pick at least ${MIN_LISTING_IMAGES}. Listings with good photos get far more replies.`}
      />

      <Controller
        control={control}
        name="images"
        render={({ field }) => (
          <PhotoPicker
            value={field.value}
            onChange={field.onChange}
            describedById={`${fieldId}-images-error`}
            invalid={errors.images !== undefined}
            firstTileRef={field.ref}
          />
        )}
      />
      <FieldError
        id={`${fieldId}-images-error`}
        message={errors.images?.message ?? errors.images?.root?.message}
      />

      <StepFooter onBack={onBack} nextLabel={nextLabel} />
    </form>
  );
}

function DetailsStep({
  defaultValues,
  onChange,
  onNext,
  onBack,
  nextLabel = "Review listing",
}: StepProps<DetailsValues>) {
  const fieldId = useId();
  const {
    control,
    register,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema, undefined, { raw: true }),
    defaultValues,
  });
  useDraftSync(watch, getValues, onChange);

  const description = watch("description") ?? "";
  const used = description.trim().length;

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      noValidate
      className="flex flex-col gap-6"
    >
      <StepIntro
        title="Tell seekers about it"
        blurb="A few honest lines about the place and the neighbourhood."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-description`}>Description</Label>
        <Textarea
          id={`${fieldId}-description`}
          rows={6}
          maxLength={DESCRIPTION_MAX_CHARS}
          placeholder="Bright three bedroom flat with a fitted kitchen, ample parking and 24 hour estate security…"
          aria-invalid={errors.description !== undefined}
          aria-describedby={
            errors.description === undefined
              ? `${fieldId}-description-hint`
              : `${fieldId}-description-error`
          }
          {...register("description")}
        />
        <p
          id={`${fieldId}-description-hint`}
          className="text-xs text-muted-ink"
        >
          {used < DESCRIPTION_MIN_CHARS
            ? `${DESCRIPTION_MIN_CHARS - used} more characters to go.`
            : `${used} of ${DESCRIPTION_MAX_CHARS} characters used.`}
        </p>
        <FieldError
          id={`${fieldId}-description-error`}
          message={errors.description?.message}
        />
      </div>

      <Controller
        control={control}
        name="amenities"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
              Amenities (optional)
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITY_OPTIONS.map((amenity, index) => {
                const amenityId = `${fieldId}-amenity-${index}`;
                const isChecked = field.value.includes(amenity);
                return (
                  <label
                    key={amenity}
                    htmlFor={amenityId}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2 transition-colors hover:bg-paper-2"
                  >
                    <Checkbox
                      id={amenityId}
                      checked={isChecked}
                      ref={index === 0 ? field.ref : undefined}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked === true
                            ? [...field.value, amenity]
                            : field.value.filter((item) => item !== amenity),
                        );
                      }}
                    />
                    <span className="text-sm text-ink">{amenity}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <StepFooter onBack={onBack} nextLabel={nextLabel} />
    </form>
  );
}

function VerificationRequiredCard() {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col items-start gap-4">
        <SealCheckIcon
          weight="duotone"
          aria-hidden
          className="size-10 text-primary-600"
        />
        <h2 className="font-heading text-xl font-bold text-ink">
          Verify your account before you list
        </h2>
        <p className="max-w-prose text-sm text-muted-ink">
          Hecta only publishes homes from verified landlords — it is the single
          biggest reason seekers reply to listings here instead of ghosting
          them. Verification takes a few minutes and you only do it once.
        </p>
        <p className="flex items-center gap-2 text-sm text-primary-800">
          <ShieldCheckIcon weight="fill" aria-hidden className="size-4" />
          Verified listings carry a badge seekers can see.
        </p>
        <Button
          asChild
          className="h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
        >
          <Link href="/dashboard/verification">Start verification</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function SubmittedPanel({ title }: { title: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex flex-col items-start gap-4">
        <CheckCircleIcon
          weight="fill"
          aria-hidden
          className="size-10 text-primary-600"
        />
        <h2 className="font-heading text-xl font-bold text-ink">
          Sent for review
        </h2>
        <p className="max-w-prose text-sm text-muted-ink">
          “{title}” is with our team now. Your listing will be reviewed by Hecta
          before going live (usually under 48 hours) — you will find it under My
          listings marked <strong className="text-ink">pending review</strong>{" "}
          until then.
        </p>
        <Button
          asChild
          className="h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
        >
          <Link href="/dashboard/listings">Go to my listings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
