import {
  AUTO_SUSPEND_REPORT_COUNT,
  DAILY_APPLICATION_LIMIT,
  MEDIUM_MATCH_THRESHOLD,
  MIN_COMPARABLES_FOR_PRICE_CHECK,
  MONTHLY_APPLICATION_LIMIT,
  QUALIFICATION_BUDGET_FULL_SCORE,
  QUALIFICATION_BUDGET_NONE_SCORE,
  QUALIFICATION_BUDGET_PARTIAL_RATIO,
  QUALIFICATION_BUDGET_PARTIAL_SCORE,
  QUALIFICATION_PAYMENT_SCORE,
  QUALIFICATION_TIMELINE_SCORE,
  STRONG_MATCH_THRESHOLD,
  SUSPICIOUS_PRICE_HIGH_RATIO,
  SUSPICIOUS_PRICE_LOW_RATIO,
} from "@/constants/marketplace";
import type {
  Application,
  ApplicationStatus,
  Furnishing,
  Intent,
  IntentProfile,
  LeaseType,
  Listing,
  PropertyType,
  Report,
  ServicedLevel,
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

// A landlord's own reply is still owed while an application sits in either
// of these two statuses — "submitted" (not yet opened) or "viewed" (opened
// but not yet actioned). Backs the "awaiting reply" badge/tile shown in both
// the landlord dashboard's nav sidebar and its overview stats, so both stay
// in lockstep by construction rather than by two copies of the same rule
// agreeing.
const AWAITING_REPLY_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  "submitted",
  "viewed",
]);

/**
 * Count of applications on `landlordId`'s own listings that are still
 * awaiting a reply (accepted/declined/info-requested applications don't
 * count — the landlord has already acted on those).
 */
export function landlordAwaitingReplyCount(
  listings: Listing[],
  applications: Application[],
  landlordId: string,
): number {
  const myListingIds = new Set(
    listings
      .filter((listing) => listing.landlordId === landlordId)
      .map((listing) => listing.id),
  );
  return applications.filter(
    (application) =>
      myListingIds.has(application.listingId) &&
      AWAITING_REPLY_STATUSES.has(application.status),
  ).length;
}

export function qualificationScore(
  profile: IntentProfile,
  listing: Listing,
): number {
  const total = totalMoveInCost(listing);
  const budget =
    profile.budgetMax >= total
      ? QUALIFICATION_BUDGET_FULL_SCORE
      : profile.budgetMax >= total * QUALIFICATION_BUDGET_PARTIAL_RATIO
        ? QUALIFICATION_BUDGET_PARTIAL_SCORE
        : QUALIFICATION_BUDGET_NONE_SCORE;
  return (
    QUALIFICATION_TIMELINE_SCORE[profile.timeline] +
    budget +
    QUALIFICATION_PAYMENT_SCORE[profile.paymentPlan]
  );
}

export interface QualificationTier {
  label: string;
  className: string;
}

/**
 * Maps a 0–100 `qualificationScore` to the three-tier badge the landlord
 * scans first in the applications inbox. The word ("Strong"/"Medium"/"Low")
 * plus the number both carry the meaning — colour is decoration, never the
 * only signal.
 */
export function qualificationTier(score: number): QualificationTier {
  if (score >= STRONG_MATCH_THRESHOLD) {
    return {
      label: `Strong match ${score}`,
      className: "bg-primary-100 text-primary-800",
    };
  }
  if (score >= MEDIUM_MATCH_THRESHOLD) {
    return {
      label: `Medium match ${score}`,
      className: "bg-secondary-100 text-secondary-900",
    };
  }
  return {
    label: `Low match ${score}`,
    className: "bg-muted text-muted-foreground",
  };
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

/**
 * Median price of `listing`'s comparable set — same intent, property type,
 * and city/LGA, excluding the listing itself. Returns `undefined` when there
 * are fewer than `MIN_COMPARABLES_FOR_PRICE_CHECK` comparables, the same
 * guard `isSuspiciousPrice` (below) applies, so this is the single place
 * that decides whether a comparable set is large enough to trust — nothing
 * else should re-derive that threshold. Used both to decide suspiciousness
 * and, in the admin approval queue, to display the median a reviewer can
 * weigh a flagged listing against.
 */
export function comparableMedianPrice(
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
  if (comps.length < MIN_COMPARABLES_FOR_PRICE_CHECK) return undefined;
  const prices = comps.map((c) => c.price).sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}

export function isSuspiciousPrice(listing: Listing, all: Listing[]): boolean {
  const median = comparableMedianPrice(listing, all);
  if (median === undefined) return false;
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
