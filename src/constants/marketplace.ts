import type { PropertyType } from "@/lib/types";

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
