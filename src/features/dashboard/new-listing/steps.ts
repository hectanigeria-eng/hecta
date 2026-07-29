import { z } from "zod";
import { AREA_COORDS } from "@/constants/locations";
import {
  AMENITY_OPTIONS,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  MIN_LISTING_IMAGES,
} from "@/constants/marketplace";
import type { HectaState } from "@/lib/store";
import type { Intent, PropertyType } from "@/lib/types";

/**
 * Every field the landlord types is held as a **string** on the form (exactly
 * what the DOM input carries) and only becomes a number on the way out, via
 * each schema's `.transform`. That keeps `z.input` — the type react-hook-form
 * is generic over — identical to the raw field values, so a half-typed price
 * can survive a Back/Next round trip without being coerced to `NaN`.
 */

export const TITLE_MIN_CHARS = 10;
export const TITLE_MAX_CHARS = 90;
export const STREET_MAX_CHARS = 120;
export const MAX_LISTING_IMAGES = 20;
export const MAX_ROOM_COUNT = 20;
export const MAX_FLOOR = 60;
export const MAX_SIZE_SQM = 100_000;
export const CHARGE_LABEL_MIN_CHARS = 2;
export const CHARGE_LABEL_MAX_CHARS = 40;
export const MAX_OTHER_CHARGES = 12;
export const SUPPLY_MIN_CHARS = 3;
export const SUPPLY_MAX_CHARS = 80;

const WHOLE_NUMBER = /^\d+$/;
const MONEY_AMOUNT = /^\d+(\.\d{1,2})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const SIZE_SQM_REQUIRED_MESSAGE =
  "Buyers filter by size, so this one is required — enter the size in square metres.";

function duplicateChargeMessage(label: string): string {
  return `You already added a charge called "${label}". Rename it or remove this row.`;
}

function wholeNumberField(noun: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `Enter how many ${noun} — put 0 if there are none.`)
    .refine(
      (value) => WHOLE_NUMBER.test(value),
      `Enter ${noun} as a whole number, like 3.`,
    )
    .refine(
      (value) => Number(value) <= max,
      `That is more ${noun} than we can list (max ${max}).`,
    )
    .transform(Number);
}

function moneyField(missingMessage: string, zeroMessage: string) {
  return z
    .string()
    .trim()
    .min(1, missingMessage)
    .refine(
      (value) => MONEY_AMOUNT.test(value),
      "Enter the amount in figures only, like 2500000.",
    )
    .refine((value) => Number(value) > 0, zeroMessage)
    .transform(Number);
}

/** Blank stays blank (`undefined`); anything typed must be a positive number. */
function optionalPositiveField(message: string, max: number) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (MONEY_AMOUNT.test(value) && Number(value) > 0 && Number(value) <= max),
      message,
    )
    .transform((value) => (value === "" ? undefined : Number(value)));
}

/** Blank stays blank; anything typed must be a whole number (0 allowed). */
function optionalWholeNumberField(message: string, max: number) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (WHOLE_NUMBER.test(value) && Number(value) <= max),
      message,
    )
    .transform((value) => (value === "" ? undefined : Number(value)));
}

export const basicsSchema = z.object({
  intent: z.enum(["rent", "buy"]),
  propertyType: z.enum([
    "house",
    "apartment",
    "duplex",
    "bungalow",
    "terrace",
    "self_contain",
    "mini_flat",
    "studio",
    "land",
    "commercial",
  ]),
  title: z
    .string()
    .trim()
    .min(
      TITLE_MIN_CHARS,
      `Give the listing a headline of at least ${TITLE_MIN_CHARS} characters — for example "3 bedroom flat in Lekki Phase 1".`,
    )
    .max(
      TITLE_MAX_CHARS,
      `Keep the headline under ${TITLE_MAX_CHARS} characters.`,
    ),
});

export const locationSchema = z
  .object({
    state: z.string().min(1, "Choose the state the property is in."),
    cityLga: z.string().min(1, "Choose the city or LGA."),
    area: z.string().min(1, "Choose the area — seekers search by area."),
    street: z
      .string()
      .trim()
      .max(
        STREET_MAX_CHARS,
        `Keep the street under ${STREET_MAX_CHARS} characters.`,
      )
      .optional(),
  })
  .refine((values) => AREA_COORDS[values.area] !== undefined, {
    message: "We do not cover that area yet — pick one from the list.",
    path: ["area"],
  });

export const specsSchema = z.object({
  bedrooms: wholeNumberField("bedrooms", MAX_ROOM_COUNT),
  bathrooms: wholeNumberField("bathrooms", MAX_ROOM_COUNT),
  toilets: wholeNumberField("toilets", MAX_ROOM_COUNT),
  sizeSqm: optionalPositiveField(
    `Enter the size in square metres, like 450 (up to ${MAX_SIZE_SQM}).`,
    MAX_SIZE_SQM,
  ),
  floor: optionalWholeNumberField(
    `Enter the floor as a whole number, like 3 (ground floor is 0, up to ${MAX_FLOOR}).`,
    MAX_FLOOR,
  ),
  serviced: z.enum(["none", "semi", "full"]),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]),
  leaseType: z.enum(["short_term", "long_term"]),
  petsAllowed: z.boolean(),
  moveInDate: z
    .string()
    .min(1, "Choose the earliest date someone can move in.")
    .refine(
      (value) => ISO_DATE.test(value),
      "Choose a date from the calendar picker.",
    ),
  powerSupply: z
    .string()
    .trim()
    .min(
      SUPPLY_MIN_CHARS,
      'Say a little about power — for example "Band A, ~20 hours daily".',
    )
    .max(SUPPLY_MAX_CHARS, `Keep this under ${SUPPLY_MAX_CHARS} characters.`),
  waterSupply: z
    .string()
    .trim()
    .min(
      SUPPLY_MIN_CHARS,
      'Say a little about water — for example "Borehole with treatment plant".',
    )
    .max(SUPPLY_MAX_CHARS, `Keep this under ${SUPPLY_MAX_CHARS} characters.`),
});

/**
 * `sizeSqm` is optional for a rented flat but load-bearing when the listing is
 * for sale, or when there is no building at all — buyers and land seekers
 * filter on it. The rule spans two steps (intent + property type live on
 * Basics, size lives on Specs), so it is expressed once here and applied both
 * at the Specs step boundary (`specsSchemaFor`) and again over the whole draft
 * (`listingDraftSchema`).
 */
export function isSizeSqmRequired(
  intent: Intent,
  propertyType: PropertyType,
): boolean {
  return intent === "buy" || propertyType === "land";
}

export function specsSchemaFor(context: {
  intent: Intent;
  propertyType: PropertyType;
}): typeof specsSchema {
  if (!isSizeSqmRequired(context.intent, context.propertyType)) {
    return specsSchema;
  }
  return specsSchema.superRefine((values, ctx) => {
    if (values.sizeSqm === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["sizeSqm"],
        message: SIZE_SQM_REQUIRED_MESSAGE,
      });
    }
  });
}

export const otherChargeSchema = z.object({
  label: z
    .string()
    .trim()
    .min(
      CHARGE_LABEL_MIN_CHARS,
      "Name this charge so seekers know what it covers.",
    )
    .max(
      CHARGE_LABEL_MAX_CHARS,
      `Keep the name under ${CHARGE_LABEL_MAX_CHARS} characters.`,
    ),
  amount: moneyField(
    "Enter how much this charge is.",
    "A charge has to be more than ₦0 — remove the row if it does not apply.",
  ),
  refundable: z.boolean(),
});

export const costsSchema = z
  .object({
    price: moneyField(
      "Enter your asking price.",
      "The price has to be more than ₦0.",
    ),
    pricePeriod: z.enum(["per_annum", "per_month", "outright"]),
    otherCharges: z
      .array(otherChargeSchema)
      .max(
        MAX_OTHER_CHARGES,
        `That is a lot of charges — ${MAX_OTHER_CHARGES} is the maximum.`,
      ),
  })
  // Two charges sharing a label render as indistinguishable rows on the
  // listing's cost table, so they are rejected here rather than silently
  // merged — the landlord is told which row clashes and renames it.
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.otherCharges.forEach((charge, index) => {
      const key = charge.label.trim().toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["otherCharges", index, "label"],
          message: duplicateChargeMessage(charge.label),
        });
        return;
      }
      seen.add(key);
    });
  });

export const photosSchema = z.object({
  images: z
    .array(z.url("Photos must be valid image links."))
    .min(
      MIN_LISTING_IMAGES,
      `Pick at least ${MIN_LISTING_IMAGES} photos — listings with fewer get skipped by seekers.`,
    )
    .max(MAX_LISTING_IMAGES, `You can show up to ${MAX_LISTING_IMAGES} photos.`)
    .refine(
      (images) => new Set(images).size === images.length,
      "The same photo is selected twice — remove the duplicate.",
    ),
});

export const detailsSchema = z.object({
  description: z
    .string()
    .trim()
    .min(
      DESCRIPTION_MIN_CHARS,
      `Add a bit more — ${DESCRIPTION_MIN_CHARS} characters or more helps seekers picture the place.`,
    )
    .max(
      DESCRIPTION_MAX_CHARS,
      `Keep the description under ${DESCRIPTION_MAX_CHARS} characters.`,
    ),
  amenities: z
    .array(z.enum(AMENITY_OPTIONS))
    .max(AMENITY_OPTIONS.length, "That is more amenities than we track."),
});

export type BasicsValues = z.input<typeof basicsSchema>;
export type LocationValues = z.input<typeof locationSchema>;
export type SpecsValues = z.input<typeof specsSchema>;
export type CostsValues = z.input<typeof costsSchema>;
export type OtherChargeValues = z.input<typeof otherChargeSchema>;
export type PhotosValues = z.input<typeof photosSchema>;
export type DetailsValues = z.input<typeof detailsSchema>;

export interface ListingDraft {
  basics: BasicsValues;
  location: LocationValues;
  specs: SpecsValues;
  costs: CostsValues;
  photos: PhotosValues;
  details: DetailsValues;
}

export const listingDraftSchema = z
  .object({
    basics: basicsSchema,
    location: locationSchema,
    specs: specsSchema,
    costs: costsSchema,
    photos: photosSchema,
    details: detailsSchema,
  })
  .superRefine((values, ctx) => {
    if (
      isSizeSqmRequired(values.basics.intent, values.basics.propertyType) &&
      values.specs.sizeSqm === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["specs", "sizeSqm"],
        message: SIZE_SQM_REQUIRED_MESSAGE,
      });
    }
  });

export type WizardStepId =
  | "basics"
  | "location"
  | "specs"
  | "costs"
  | "photos"
  | "details"
  | "review";

export interface WizardStepDef {
  id: WizardStepId;
  label: string;
}

export const WIZARD_STEPS: readonly WizardStepDef[] = [
  { id: "basics", label: "Basics" },
  { id: "location", label: "Location" },
  { id: "specs", label: "Specs" },
  { id: "costs", label: "Costs" },
  { id: "photos", label: "Photos" },
  { id: "details", label: "Details" },
  { id: "review", label: "Review" },
];

export function stepIndexOf(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((step) => step.id === id);
}

export function createEmptyDraft(): ListingDraft {
  return {
    basics: { intent: "rent", propertyType: "apartment", title: "" },
    location: { state: "", cityLga: "", area: "", street: "" },
    specs: {
      bedrooms: "",
      bathrooms: "",
      toilets: "",
      sizeSqm: "",
      floor: "",
      serviced: "none",
      furnishing: "unfurnished",
      leaseType: "long_term",
      petsAllowed: false,
      moveInDate: "",
      powerSupply: "",
      waterSupply: "",
    },
    costs: { price: "", pricePeriod: "per_annum", otherCharges: [] },
    photos: { images: [] },
    details: { description: "", amenities: [] },
  };
}

/**
 * The exact argument `createListing` expects — derived from the store's own
 * signature so this wizard can never drift from it.
 */
export type NewListingInput = Parameters<HectaState["createListing"]>[0];

export type BuildPayloadResult =
  | { ok: true; payload: NewListingInput }
  | { ok: false; stepId: WizardStepId; message: string };

function stepIdFromIssuePath(path: PropertyKey[]): WizardStepId {
  const head = path[0];
  const match = WIZARD_STEPS.find((step) => step.id === head);
  return match === undefined ? "basics" : match.id;
}

/**
 * Re-validates the whole draft and shapes it into the store's create payload.
 * Returning a result (rather than throwing) means a draft that somehow reaches
 * Review with a gap sends the landlord back to the exact step that needs
 * attention instead of dead-ending on an error screen.
 */
export function buildListingPayload(
  draft: ListingDraft,
  landlordId: string,
): BuildPayloadResult {
  const parsed = listingDraftSchema.safeParse(draft);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      stepId: stepIdFromIssuePath(issue.path),
      message: issue.message,
    };
  }

  const { basics, location, specs, costs, photos, details } = parsed.data;
  const street =
    location.street === undefined || location.street === ""
      ? undefined
      : location.street;

  return {
    ok: true,
    payload: {
      landlordId,
      intent: basics.intent,
      title: basics.title,
      price: costs.price,
      pricePeriod: costs.pricePeriod,
      otherCharges: costs.otherCharges.map((charge) => ({
        label: charge.label,
        amount: charge.amount,
        refundable: charge.refundable,
      })),
      location: {
        state: location.state,
        cityLga: location.cityLga,
        area: location.area,
        street,
        geoPoint: AREA_COORDS[location.area],
      },
      propertyType: basics.propertyType,
      bedrooms: specs.bedrooms,
      bathrooms: specs.bathrooms,
      toilets: specs.toilets,
      sizeSqm: specs.sizeSqm,
      serviced: specs.serviced,
      furnishing: specs.furnishing,
      floor: specs.floor,
      petsAllowed: specs.petsAllowed,
      moveInDate: specs.moveInDate,
      leaseType: specs.leaseType,
      powerSupply: specs.powerSupply,
      waterSupply: specs.waterSupply,
      amenities: [...details.amenities],
      description: details.description,
      images: [...photos.images],
    },
  };
}

export type CostTotalsInput = Pick<CostsValues, "price" | "otherCharges">;

/** Sum used by the live "total move-in cost" line — mirrors `totalMoveInCost`. */
export function draftMoveInTotal(costs: CostTotalsInput): number {
  const price = Number(costs.price);
  const base = Number.isFinite(price) && costs.price.trim() !== "" ? price : 0;
  return costs.otherCharges.reduce((sum, charge) => {
    const amount = Number(charge.amount);
    return (
      sum +
      (Number.isFinite(amount) && charge.amount.trim() !== "" ? amount : 0)
    );
  }, base);
}

export function draftRefundableTotal(costs: CostTotalsInput): number {
  return costs.otherCharges.reduce((sum, charge) => {
    if (!charge.refundable) return sum;
    const amount = Number(charge.amount);
    return (
      sum +
      (Number.isFinite(amount) && charge.amount.trim() !== "" ? amount : 0)
    );
  }, 0);
}
