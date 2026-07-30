import {
  AUTO_SUSPEND_REPORT_COUNT,
  DAILY_APPLICATION_LIMIT,
  MIN_COMPARABLES_FOR_PRICE_CHECK,
  MONTHLY_APPLICATION_LIMIT,
  SUSPICIOUS_PRICE_HIGH_RATIO,
  SUSPICIOUS_PRICE_LOW_RATIO,
} from "@/constants/marketplace";
import type {
  Application,
  Furnishing,
  Intent,
  IntentProfile,
  LeaseType,
  Listing,
  PaymentPlan,
  PropertyType,
  Report,
  ServicedLevel,
  Timeline,
} from "@/lib/types";

const WAT_OFFSET_MS = 60 * 60 * 1000; // Africa/Lagos is UTC+1 year-round (no DST)

function watDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() + WAT_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export interface CostBreakdown {
  price: number;
  nonRefundable: number;
  refundable: number;
  total: number;
}

export function costBreakdown(listing: Listing): CostBreakdown {
  const nonRefundable = listing.otherCharges
    .filter((charge) => !charge.refundable)
    .reduce((sum, charge) => sum + charge.amount, 0);
  const refundable = listing.otherCharges
    .filter((charge) => charge.refundable)
    .reduce((sum, charge) => sum + charge.amount, 0);
  return {
    price: listing.price,
    nonRefundable,
    refundable,
    total: listing.price + nonRefundable + refundable,
  };
}

export function totalMoveInCost(listing: Listing): number {
  return costBreakdown(listing).total;
}

export interface ListingFilters {
  intent: Intent;
  state?: string;
  cityLga?: string;
  areas?: string[];
  priceMin?: number;
  priceMax?: number;
  propertyTypes?: PropertyType[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  furnishing?: Furnishing;
  serviced?: ServicedLevel;
  petsAllowed?: boolean;
  leaseType?: LeaseType;
  amenities?: string[];
  verifiedOnly?: boolean; // default true at call sites
  moveInBy?: string; // ISO date; matches listings available by this date
}

export function filterListings(
  listings: Listing[],
  filters: ListingFilters,
): Listing[] {
  return listings.filter((listing) => {
    if (listing.status !== "active") return false;
    if (listing.intent !== filters.intent) return false;
    if (filters.state !== undefined && listing.location.state !== filters.state)
      return false;
    if (
      filters.cityLga !== undefined &&
      listing.location.cityLga !== filters.cityLga
    )
      return false;
    if (
      filters.areas !== undefined &&
      !filters.areas.includes(listing.location.area)
    )
      return false;
    if (filters.priceMin !== undefined && listing.price < filters.priceMin)
      return false;
    if (filters.priceMax !== undefined && listing.price > filters.priceMax)
      return false;
    if (
      filters.propertyTypes !== undefined &&
      !filters.propertyTypes.includes(listing.propertyType)
    )
      return false;
    if (
      filters.bedroomsMin !== undefined &&
      listing.bedrooms < filters.bedroomsMin
    )
      return false;
    if (
      filters.bathroomsMin !== undefined &&
      listing.bathrooms < filters.bathroomsMin
    )
      return false;
    if (
      filters.furnishing !== undefined &&
      listing.furnishing !== filters.furnishing
    )
      return false;
    if (filters.serviced !== undefined && listing.serviced !== filters.serviced)
      return false;
    if (
      filters.petsAllowed !== undefined &&
      listing.petsAllowed !== filters.petsAllowed
    )
      return false;
    if (
      filters.leaseType !== undefined &&
      listing.leaseType !== filters.leaseType
    )
      return false;
    if (
      filters.amenities !== undefined &&
      !filters.amenities.every((amenity) => listing.amenities.includes(amenity))
    )
      return false;
    if (filters.verifiedOnly === true && !listing.verifiedProperty)
      return false;
    if (filters.moveInBy !== undefined && listing.moveInDate > filters.moveInBy)
      return false;
    return true;
  });
}

export type SortKey = "newest" | "price_asc" | "price_desc" | "freshness";

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const sorted = [...listings];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "freshness":
      return sorted.sort(
        (a, b) =>
          new Date(b.lastConfirmedAvailableAt).getTime() -
          new Date(a.lastConfirmedAvailableAt).getTime(),
      );
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): { items: T[]; totalPages: number; total: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    totalPages,
    total,
  };
}

export function remainingQuota(
  applications: Application[],
  applicantId: string,
  nowIso: string,
): { day: number; month: number } {
  const mine = applications.filter((a) => a.applicantId === applicantId);
  const day = mine.filter(
    (a) => watDayKey(a.createdAt) === watDayKey(nowIso),
  ).length;
  const month = mine.filter(
    (a) => watDayKey(a.createdAt).slice(0, 7) === watDayKey(nowIso).slice(0, 7),
  ).length;
  return {
    day: Math.max(0, DAILY_APPLICATION_LIMIT - day),
    month: Math.max(0, MONTHLY_APPLICATION_LIMIT - month),
  };
}

export function qualificationScore(
  profile: IntentProfile,
  listing: Listing,
): number {
  const timeline: Record<Timeline, number> = {
    immediate: 40,
    within_1_month: 30,
    "1_3_months": 15,
    exploring: 5,
  };
  const payment: Record<PaymentPlan, number> = {
    full: 20,
    mortgage: 12,
    instalments: 8,
  };
  const total = totalMoveInCost(listing);
  const budget =
    profile.budgetMax >= total ? 40 : profile.budgetMax >= total * 0.8 ? 20 : 0;
  return timeline[profile.timeline] + budget + payment[profile.paymentPlan];
}

export function sortApplicationsByQualification(
  apps: Application[],
  listings: Listing[],
): Application[] {
  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  return [...apps].sort((a, b) => {
    const listingA = listingById.get(a.listingId);
    const listingB = listingById.get(b.listingId);
    const scoreA = listingA ? qualificationScore(a.intentProfile, listingA) : 0;
    const scoreB = listingB ? qualificationScore(b.intentProfile, listingB) : 0;
    return scoreB - scoreA;
  });
}

export function isSuspiciousPrice(listing: Listing, all: Listing[]): boolean {
  const comps = all.filter(
    (l) =>
      l.id !== listing.id &&
      l.intent === listing.intent &&
      l.propertyType === listing.propertyType &&
      l.location.cityLga === listing.location.cityLga,
  );
  if (comps.length < MIN_COMPARABLES_FOR_PRICE_CHECK) return false;
  const prices = comps.map((c) => c.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  return (
    listing.price > median * SUSPICIOUS_PRICE_HIGH_RATIO ||
    listing.price < median * SUSPICIOUS_PRICE_LOW_RATIO
  );
}

export function shouldAutoSuspend(
  reports: Report[],
  listingId: string,
): boolean {
  const distinctReporters = new Set(
    reports
      .filter((r) => r.targetListingId === listingId && r.status === "open")
      .map((r) => r.reporterId),
  );
  return distinctReporters.size >= AUTO_SUSPEND_REPORT_COUNT;
}

export function isReconfirmDue(listing: Listing, nowIso: string): boolean {
  return (
    new Date(nowIso).getTime() >= new Date(listing.reconfirmDueAt).getTime()
  );
}

export function similarListings(
  listing: Listing,
  all: Listing[],
  limit: number,
): Listing[] {
  return all
    .filter(
      (l) =>
        l.id !== listing.id &&
        l.status === "active" &&
        l.intent === listing.intent &&
        l.location.cityLga === listing.location.cityLga,
    )
    .sort(
      (a, b) =>
        Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price),
    )
    .slice(0, limit);
}
