import type {
  Furnishing,
  Intent,
  LeaseType,
  PricePeriod,
  ServicedLevel,
} from "@/lib/types";

/**
 * Ordered option lists shared by the wizard's controls and the review
 * summary, so a value can never be selectable in one place and unlabelled in
 * the other.
 */
export interface Option<TValue extends string> {
  value: TValue;
  label: string;
  description?: string;
}

export const INTENT_OPTIONS: readonly Option<Intent>[] = [
  {
    value: "rent",
    label: "To rent",
    description: "Tenants pay rent for a fixed term",
  },
  {
    value: "buy",
    label: "For sale",
    description: "Buyers pay once and own the property",
  },
];

export const SERVICED_OPTIONS: readonly Option<ServicedLevel>[] = [
  { value: "none", label: "Not serviced" },
  { value: "semi", label: "Semi-serviced" },
  { value: "full", label: "Fully serviced" },
];

export const FURNISHING_OPTIONS: readonly Option<Furnishing>[] = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
];

export const LEASE_OPTIONS: readonly Option<LeaseType>[] = [
  { value: "long_term", label: "Long term" },
  { value: "short_term", label: "Short term" },
];

export const PRICE_PERIOD_OPTIONS: readonly Option<PricePeriod>[] = [
  { value: "per_annum", label: "Per year" },
  { value: "per_month", label: "Per month" },
  { value: "outright", label: "Outright purchase" },
];

/** Rent is quoted per year or per month; a sale is a single outright price. */
export function pricePeriodOptionsFor(
  intent: Intent,
): readonly Option<PricePeriod>[] {
  return intent === "buy"
    ? PRICE_PERIOD_OPTIONS.filter((option) => option.value === "outright")
    : PRICE_PERIOD_OPTIONS.filter((option) => option.value !== "outright");
}

export function defaultPricePeriodFor(intent: Intent): PricePeriod {
  return intent === "buy" ? "outright" : "per_annum";
}

export function optionLabel<TValue extends string>(
  options: readonly Option<TValue>[],
  value: TValue,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
