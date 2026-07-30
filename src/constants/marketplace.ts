import type { PaymentPlan, PropertyType, Timeline } from "@/lib/types";

export const DAILY_APPLICATION_LIMIT = 5;
export const MONTHLY_APPLICATION_LIMIT = 30;
export const AUTO_SUSPEND_REPORT_COUNT = 3;
export const RECONFIRM_INTERVAL_DAYS = 60;
export const RECONFIRM_GRACE_DAYS = 7;
export const RESULTS_PER_PAGE = 12;
export const SUSPICIOUS_PRICE_HIGH_RATIO = 1.6;
export const SUSPICIOUS_PRICE_LOW_RATIO = 0.4;
export const MIN_COMPARABLES_FOR_PRICE_CHECK = 3;
export const MIN_LISTING_IMAGES = 4;
export const DESCRIPTION_MIN_CHARS = 50;
export const DESCRIPTION_MAX_CHARS = 2000;

// Weights feeding `qualificationScore` (0–100 total): how many points an
// applicant earns for each factor of their `IntentProfile`. Carried over
// verbatim from the original planning brief's example scoring, now named so
// the relative weighting (timeline matters most, then budget, then payment
// method) reads as an intentional policy rather than bare numbers in the
// function body.
export const QUALIFICATION_TIMELINE_SCORE: Record<Timeline, number> = {
  immediate: 40,
  within_1_month: 30,
  "1_3_months": 15,
  exploring: 5,
};
export const QUALIFICATION_PAYMENT_SCORE: Record<PaymentPlan, number> = {
  full: 20,
  mortgage: 12,
  instalments: 8,
};
// Budget component: full points when the applicant's stated max budget
// covers the listing's total move-in cost outright, partial credit when it
// covers at least `QUALIFICATION_BUDGET_PARTIAL_RATIO` of it, none otherwise.
export const QUALIFICATION_BUDGET_FULL_SCORE = 40;
export const QUALIFICATION_BUDGET_PARTIAL_SCORE = 20;
export const QUALIFICATION_BUDGET_NONE_SCORE = 0;
export const QUALIFICATION_BUDGET_PARTIAL_RATIO = 0.8;

// Tier cutoffs for the 0–100 `qualificationScore` scale, used to label an
// application "Strong"/"Medium"/"Low" match in the landlord's applications
// inbox.
export const STRONG_MATCH_THRESHOLD = 70;
export const MEDIUM_MATCH_THRESHOLD = 40;

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment / Flat",
  duplex: "Duplex",
  bungalow: "Bungalow",
  terrace: "Terrace",
  self_contain: "Self-contain",
  mini_flat: "Mini-flat",
  studio: "Studio",
  land: "Land",
  commercial: "Commercial",
};

export const AMENITY_OPTIONS = [
  "Generator",
  "Parking",
  "Security",
  "Gym",
  "Pool",
  "Borehole",
  "POP ceiling",
  "Fitted kitchen",
  "Wardrobe",
  "Air conditioning",
  "Elevator",
  "Estate/gated",
] as const;
