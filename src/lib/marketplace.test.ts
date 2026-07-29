import { describe, expect, it } from "vitest";
import {
  AUTO_SUSPEND_REPORT_COUNT,
  DAILY_APPLICATION_LIMIT,
  MONTHLY_APPLICATION_LIMIT,
} from "@/constants/marketplace";
import {
  costBreakdown,
  filterListings,
  isReconfirmDue,
  isSuspiciousPrice,
  paginate,
  qualificationScore,
  remainingQuota,
  shouldAutoSuspend,
  similarListings,
  sortApplicationsByQualification,
  sortListings,
  totalMoveInCost,
} from "@/lib/marketplace";
import type { Application, IntentProfile, Listing, Report } from "@/lib/types";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    landlordId: "landlord-1",
    intent: "rent",
    title: "Nice flat",
    price: 1_000_000,
    pricePeriod: "per_annum",
    otherCharges: [],
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "yaba",
      geoPoint: { lat: 6.5, lng: 3.3 },
    },
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    toilets: 2,
    serviced: "none",
    furnishing: "unfurnished",
    petsAllowed: false,
    moveInDate: "2026-08-01",
    leaseType: "long_term",
    powerSupply: "Band A",
    waterSupply: "Borehole",
    amenities: [],
    description: "A nice flat",
    images: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"],
    status: "active",
    verifiedProperty: true,
    createdAt: "2026-01-01T00:00:00Z",
    lastConfirmedAvailableAt: "2026-01-01T00:00:00Z",
    reconfirmDueAt: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeIntentProfile(
  overrides: Partial<IntentProfile> = {},
): IntentProfile {
  return {
    timeline: "within_1_month",
    paymentPlan: "full",
    budgetMin: 500_000,
    budgetMax: 1_500_000,
    ...overrides,
  };
}

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    listingId: "listing-1",
    applicantId: "applicant-1",
    message: "Interested",
    intentProfile: makeIntentProfile(),
    status: "submitted",
    createdAt: "2026-07-15T10:00:00Z",
    ...overrides,
  };
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    targetListingId: "listing-1",
    reporterId: "reporter-1",
    category: "scam_listing",
    reason: "Suspicious",
    status: "open",
    createdAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("costBreakdown", () => {
  it("sums non-refundable and refundable charges into total", () => {
    const listing = makeListing({
      price: 1_000_000,
      otherCharges: [
        { label: "Agency fee", amount: 100_000, refundable: false },
        { label: "Caution deposit", amount: 50_000, refundable: true },
      ],
    });
    expect(costBreakdown(listing)).toEqual({
      price: 1_000_000,
      nonRefundable: 100_000,
      refundable: 50_000,
      total: 1_150_000,
    });
  });

  it("handles a listing with no other charges", () => {
    const listing = makeListing({ price: 750_000, otherCharges: [] });
    expect(costBreakdown(listing)).toEqual({
      price: 750_000,
      nonRefundable: 0,
      refundable: 0,
      total: 750_000,
    });
  });
});

describe("totalMoveInCost", () => {
  it("returns costBreakdown().total", () => {
    const listing = makeListing({
      price: 1_000_000,
      otherCharges: [
        { label: "Agency fee", amount: 100_000, refundable: false },
        { label: "Caution deposit", amount: 50_000, refundable: true },
      ],
    });
    expect(totalMoveInCost(listing)).toBe(1_150_000);
  });
});

describe("filterListings", () => {
  const l1 = makeListing({
    id: "l1",
    status: "active",
    verifiedProperty: true,
    price: 500_000,
    bedrooms: 2,
    bathrooms: 2,
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "yaba",
      geoPoint: { lat: 6.5, lng: 3.3 },
    },
    intent: "rent",
  });
  const l2 = makeListing({
    id: "l2",
    status: "active",
    verifiedProperty: false,
    price: 600_000,
    bedrooms: 3,
    bathrooms: 3,
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "ikeja-gra",
      geoPoint: { lat: 6.6, lng: 3.35 },
    },
    intent: "rent",
  });
  const l3 = makeListing({
    id: "l3",
    status: "hidden",
    verifiedProperty: true,
    price: 700_000,
    bedrooms: 4,
    bathrooms: 4,
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "yaba",
      geoPoint: { lat: 6.5, lng: 3.3 },
    },
    intent: "rent",
  });
  const l4 = makeListing({
    id: "l4",
    status: "active",
    verifiedProperty: true,
    price: 1_000_000,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      state: "lagos",
      cityLga: "eti-osa",
      area: "lekki",
      geoPoint: { lat: 6.45, lng: 3.5 },
    },
    intent: "rent",
  });
  const l5 = makeListing({
    id: "l5",
    status: "active",
    verifiedProperty: true,
    price: 800_000,
    bedrooms: 3,
    bathrooms: 2,
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "ikeja-gra",
      geoPoint: { lat: 6.6, lng: 3.35 },
    },
    intent: "buy",
  });
  const all = [l1, l2, l3, l4, l5];

  it("always excludes non-active listings and requires matching intent, even with no other filters", () => {
    const result = filterListings(all, { intent: "rent" });
    expect(result.map((l) => l.id)).toEqual(["l1", "l2", "l4"]);
  });

  it("excludes verifiedProperty=false when verifiedOnly is true", () => {
    const result = filterListings(all, { intent: "rent", verifiedOnly: true });
    expect(result.map((l) => l.id)).toEqual(["l1", "l4"]);
  });

  it("ORs within the areas filter (multi-select)", () => {
    const result = filterListings(all, {
      intent: "rent",
      areas: ["yaba", "lekki"],
    });
    expect(result.map((l) => l.id)).toEqual(["l1", "l4"]);
  });

  it("applies priceMin/priceMax inclusively", () => {
    const result = filterListings(all, {
      intent: "rent",
      priceMin: 500_000,
      priceMax: 600_000,
    });
    expect(result.map((l) => l.id)).toEqual(["l1", "l2"]);
  });

  it("applies bedroomsMin as >=", () => {
    const result = filterListings(all, { intent: "rent", bedroomsMin: 3 });
    expect(result.map((l) => l.id)).toEqual(["l2"]);
  });

  it("applies bathroomsMin as >=", () => {
    const result = filterListings(all, { intent: "rent", bathroomsMin: 2 });
    expect(result.map((l) => l.id)).toEqual(["l1", "l2"]);
  });
});

describe("sortListings", () => {
  const a = makeListing({
    id: "a",
    price: 300_000,
    createdAt: "2026-01-01T00:00:00Z",
    lastConfirmedAvailableAt: "2026-01-10T00:00:00Z",
  });
  const b = makeListing({
    id: "b",
    price: 100_000,
    createdAt: "2026-03-01T00:00:00Z",
    lastConfirmedAvailableAt: "2026-01-05T00:00:00Z",
  });
  const c = makeListing({
    id: "c",
    price: 200_000,
    createdAt: "2026-02-01T00:00:00Z",
    lastConfirmedAvailableAt: "2026-01-20T00:00:00Z",
  });
  const listings = [a, b, c];

  it("price_asc sorts ascending by price", () => {
    expect(sortListings(listings, "price_asc").map((l) => l.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("price_desc sorts descending by price", () => {
    expect(sortListings(listings, "price_desc").map((l) => l.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("newest sorts by createdAt desc", () => {
    expect(sortListings(listings, "newest").map((l) => l.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("freshness sorts by lastConfirmedAvailableAt desc", () => {
    expect(sortListings(listings, "freshness").map((l) => l.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("computes totalPages and page contents", () => {
    const page1 = paginate(items, 1, 12);
    expect(page1.totalPages).toBe(3);
    expect(page1.total).toBe(25);
    expect(page1.items).toEqual(items.slice(0, 12));

    const page3 = paginate(items, 3, 12);
    expect(page3.items).toEqual([25]);
  });

  it("clamps an out-of-range page to the last page", () => {
    const outOfRange = paginate(items, 99, 12);
    expect(outOfRange.totalPages).toBe(3);
    expect(outOfRange.items).toEqual([25]);
  });
});

describe("remainingQuota", () => {
  it("returns 0 remaining for the day after 5 applications today (WAT)", () => {
    const apps: Application[] = Array.from({ length: 5 }, (_, i) =>
      makeApplication({
        id: `app-${i}`,
        applicantId: "applicant-1",
        createdAt: "2026-07-29T08:00:00Z",
      }),
    );
    const result = remainingQuota(apps, "applicant-1", "2026-07-29T10:00:00Z");
    expect(result.day).toBe(0);
  });

  it("counts an application at 23:30 UTC toward the next WAT day", () => {
    const apps: Application[] = [
      makeApplication({
        id: "boundary-app",
        applicantId: "applicant-1",
        createdAt: "2026-07-28T23:30:00Z",
      }),
    ];
    const result = remainingQuota(apps, "applicant-1", "2026-07-29T00:00:00Z");
    expect(result.day).toBe(DAILY_APPLICATION_LIMIT - 1);
  });

  it("caps the monthly count at MONTHLY_APPLICATION_LIMIT applications", () => {
    const apps: Application[] = Array.from({ length: 30 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return makeApplication({
        id: `month-app-${i}`,
        applicantId: "applicant-1",
        createdAt: `2026-07-${day}T10:00:00Z`,
      });
    });
    const result = remainingQuota(apps, "applicant-1", "2026-07-15T12:00:00Z");
    expect(result.month).toBe(MONTHLY_APPLICATION_LIMIT - 30);
    expect(result.day).toBe(DAILY_APPLICATION_LIMIT - 1);
  });

  it("only counts applications belonging to the given applicant", () => {
    const apps: Application[] = [
      makeApplication({
        id: "mine",
        applicantId: "applicant-1",
        createdAt: "2026-07-29T08:00:00Z",
      }),
      makeApplication({
        id: "theirs-1",
        applicantId: "applicant-2",
        createdAt: "2026-07-29T08:00:00Z",
      }),
      makeApplication({
        id: "theirs-2",
        applicantId: "applicant-2",
        createdAt: "2026-07-29T08:00:00Z",
      }),
    ];
    const result = remainingQuota(apps, "applicant-1", "2026-07-29T10:00:00Z");
    expect(result.day).toBe(DAILY_APPLICATION_LIMIT - 1);
  });
});

describe("qualificationScore", () => {
  it("scores 100 for immediate timeline, full payment, and sufficient budget", () => {
    const listing = makeListing({ price: 1_000_000, otherCharges: [] });
    const profile = makeIntentProfile({
      timeline: "immediate",
      paymentPlan: "full",
      budgetMax: 1_200_000,
    });
    expect(qualificationScore(profile, listing)).toBe(100);
  });

  it("scores 13 for exploring timeline, instalments, and low budget", () => {
    const listing = makeListing({ price: 1_000_000, otherCharges: [] });
    const profile = makeIntentProfile({
      timeline: "exploring",
      paymentPlan: "instalments",
      budgetMax: 700_000,
    });
    expect(qualificationScore(profile, listing)).toBe(13);
  });

  it("scores the mid budget tier when budgetMax is exactly 80% of total", () => {
    const listing = makeListing({ price: 1_000_000, otherCharges: [] });
    const profile = makeIntentProfile({
      timeline: "within_1_month",
      paymentPlan: "mortgage",
      budgetMax: 800_000,
    });
    expect(qualificationScore(profile, listing)).toBe(62);
  });
});

describe("sortApplicationsByQualification", () => {
  it("orders applications by descending qualification score", () => {
    const listing = makeListing({
      id: "listing-x",
      price: 1_000_000,
      otherCharges: [],
    });
    const high = makeApplication({
      id: "high",
      listingId: "listing-x",
      intentProfile: makeIntentProfile({
        timeline: "immediate",
        paymentPlan: "full",
        budgetMax: 1_200_000,
      }),
    });
    const mid = makeApplication({
      id: "mid",
      listingId: "listing-x",
      intentProfile: makeIntentProfile({
        timeline: "within_1_month",
        paymentPlan: "mortgage",
        budgetMax: 800_000,
      }),
    });
    const low = makeApplication({
      id: "low",
      listingId: "listing-x",
      intentProfile: makeIntentProfile({
        timeline: "exploring",
        paymentPlan: "instalments",
        budgetMax: 700_000,
      }),
    });
    const result = sortApplicationsByQualification([low, high, mid], [listing]);
    expect(result.map((a) => a.id)).toEqual(["high", "mid", "low"]);
  });
});

describe("isSuspiciousPrice", () => {
  const comparableProps = {
    intent: "rent" as const,
    propertyType: "apartment" as const,
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "ikeja-gra",
      geoPoint: { lat: 6.6, lng: 3.35 },
    },
  };

  it("returns false when fewer than MIN_COMPARABLES_FOR_PRICE_CHECK comparables exist", () => {
    const target = makeListing({
      id: "target",
      price: 500_000,
      ...comparableProps,
    });
    const comps = [
      makeListing({ id: "c1", price: 100_000, ...comparableProps }),
      makeListing({ id: "c2", price: 200_000, ...comparableProps }),
    ];
    expect(isSuspiciousPrice(target, [target, ...comps])).toBe(false);
  });

  it("returns true when price is 1.7x the median of 3 comparables", () => {
    const comps = [
      makeListing({ id: "c1", price: 100_000, ...comparableProps }),
      makeListing({ id: "c2", price: 200_000, ...comparableProps }),
      makeListing({ id: "c3", price: 300_000, ...comparableProps }),
    ];
    const target = makeListing({
      id: "target",
      price: 340_000,
      ...comparableProps,
    });
    expect(isSuspiciousPrice(target, [target, ...comps])).toBe(true);
  });

  it("returns true when price is 0.3x the median of 3 comparables", () => {
    const comps = [
      makeListing({ id: "c1", price: 100_000, ...comparableProps }),
      makeListing({ id: "c2", price: 200_000, ...comparableProps }),
      makeListing({ id: "c3", price: 300_000, ...comparableProps }),
    ];
    const target = makeListing({
      id: "target",
      price: 60_000,
      ...comparableProps,
    });
    expect(isSuspiciousPrice(target, [target, ...comps])).toBe(true);
  });

  it("returns false when price is 1.2x the median of 3 comparables", () => {
    const comps = [
      makeListing({ id: "c1", price: 100_000, ...comparableProps }),
      makeListing({ id: "c2", price: 200_000, ...comparableProps }),
      makeListing({ id: "c3", price: 300_000, ...comparableProps }),
    ];
    const target = makeListing({
      id: "target",
      price: 240_000,
      ...comparableProps,
    });
    expect(isSuspiciousPrice(target, [target, ...comps])).toBe(false);
  });

  it("returns false exactly at the high ratio threshold (strictly greater required)", () => {
    const comps = [
      makeListing({ id: "c1", price: 100_000, ...comparableProps }),
      makeListing({ id: "c2", price: 200_000, ...comparableProps }),
      makeListing({ id: "c3", price: 300_000, ...comparableProps }),
    ];
    const target = makeListing({
      id: "target",
      price: 320_000,
      ...comparableProps,
    });
    expect(isSuspiciousPrice(target, [target, ...comps])).toBe(false);
  });

  it("returns false exactly at the low ratio threshold (strictly less required)", () => {
    const comps = [
      makeListing({ id: "c1", price: 100_000, ...comparableProps }),
      makeListing({ id: "c2", price: 200_000, ...comparableProps }),
      makeListing({ id: "c3", price: 300_000, ...comparableProps }),
    ];
    const target = makeListing({
      id: "target",
      price: 80_000,
      ...comparableProps,
    });
    expect(isSuspiciousPrice(target, [target, ...comps])).toBe(false);
  });
});

describe("shouldAutoSuspend", () => {
  it("returns true for 3 open reports from distinct reporters", () => {
    const reports: Report[] = [
      makeReport({
        id: "r1",
        targetListingId: "l1",
        reporterId: "u1",
        status: "open",
      }),
      makeReport({
        id: "r2",
        targetListingId: "l1",
        reporterId: "u2",
        status: "open",
      }),
      makeReport({
        id: "r3",
        targetListingId: "l1",
        reporterId: "u3",
        status: "open",
      }),
    ];
    expect(shouldAutoSuspend(reports, "l1")).toBe(true);
    expect(reports.length).toBeGreaterThanOrEqual(AUTO_SUSPEND_REPORT_COUNT);
  });

  it("returns false for 3 reports from the same reporter", () => {
    const reports: Report[] = [
      makeReport({
        id: "r1",
        targetListingId: "l1",
        reporterId: "u1",
        status: "open",
      }),
      makeReport({
        id: "r2",
        targetListingId: "l1",
        reporterId: "u1",
        status: "open",
      }),
      makeReport({
        id: "r3",
        targetListingId: "l1",
        reporterId: "u1",
        status: "open",
      }),
    ];
    expect(shouldAutoSuspend(reports, "l1")).toBe(false);
  });

  it("returns false for 2 open reports plus 1 dismissed report", () => {
    const reports: Report[] = [
      makeReport({
        id: "r1",
        targetListingId: "l1",
        reporterId: "u1",
        status: "open",
      }),
      makeReport({
        id: "r2",
        targetListingId: "l1",
        reporterId: "u2",
        status: "open",
      }),
      makeReport({
        id: "r3",
        targetListingId: "l1",
        reporterId: "u3",
        status: "dismissed",
      }),
    ];
    expect(shouldAutoSuspend(reports, "l1")).toBe(false);
  });

  it("ignores reports for other listings", () => {
    const reports: Report[] = [
      makeReport({
        id: "r1",
        targetListingId: "l1",
        reporterId: "u1",
        status: "open",
      }),
      makeReport({
        id: "r2",
        targetListingId: "l1",
        reporterId: "u2",
        status: "open",
      }),
      makeReport({
        id: "r3",
        targetListingId: "l1",
        reporterId: "u3",
        status: "open",
      }),
      makeReport({
        id: "r4",
        targetListingId: "l2",
        reporterId: "u4",
        status: "open",
      }),
    ];
    expect(shouldAutoSuspend(reports, "l2")).toBe(false);
  });
});

describe("isReconfirmDue", () => {
  it("returns true when now is past reconfirmDueAt", () => {
    const listing = makeListing({ reconfirmDueAt: "2026-07-01T00:00:00Z" });
    expect(isReconfirmDue(listing, "2026-07-29T00:00:00Z")).toBe(true);
  });

  it("returns false when now is before reconfirmDueAt", () => {
    const listing = makeListing({ reconfirmDueAt: "2026-08-01T00:00:00Z" });
    expect(isReconfirmDue(listing, "2026-07-29T00:00:00Z")).toBe(false);
  });

  it("returns true when now exactly equals reconfirmDueAt", () => {
    const listing = makeListing({ reconfirmDueAt: "2026-07-29T00:00:00Z" });
    expect(isReconfirmDue(listing, "2026-07-29T00:00:00Z")).toBe(true);
  });
});

describe("similarListings", () => {
  const target = makeListing({
    id: "target",
    intent: "rent",
    price: 500_000,
    status: "active",
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "yaba",
      geoPoint: { lat: 6.5, lng: 3.3 },
    },
  });
  const closest = makeListing({
    id: "closest",
    intent: "rent",
    price: 520_000,
    status: "active",
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "ikeja-gra",
      geoPoint: { lat: 6.6, lng: 3.35 },
    },
  });
  const mid = makeListing({
    id: "mid",
    intent: "rent",
    price: 600_000,
    status: "active",
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "ikeja-gra",
      geoPoint: { lat: 6.6, lng: 3.35 },
    },
  });
  const farthest = makeListing({
    id: "farthest",
    intent: "rent",
    price: 750_000,
    status: "active",
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "ikeja-gra",
      geoPoint: { lat: 6.6, lng: 3.35 },
    },
  });
  const wrongStatus = makeListing({
    id: "wrong-status",
    intent: "rent",
    price: 510_000,
    status: "hidden",
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "yaba",
      geoPoint: { lat: 6.5, lng: 3.3 },
    },
  });
  const wrongCity = makeListing({
    id: "wrong-city",
    intent: "rent",
    price: 505_000,
    status: "active",
    location: {
      state: "lagos",
      cityLga: "eti-osa",
      area: "lekki",
      geoPoint: { lat: 6.45, lng: 3.5 },
    },
  });
  const wrongIntent = makeListing({
    id: "wrong-intent",
    intent: "buy",
    price: 505_000,
    status: "active",
    location: {
      state: "lagos",
      cityLga: "ikeja",
      area: "yaba",
      geoPoint: { lat: 6.5, lng: 3.3 },
    },
  });
  const all = [
    target,
    closest,
    mid,
    farthest,
    wrongStatus,
    wrongCity,
    wrongIntent,
  ];

  it("excludes self, wrong status, wrong city, and wrong intent, ordering by price closeness", () => {
    const result = similarListings(target, all, 2);
    expect(result.map((l) => l.id)).toEqual(["closest", "mid"]);
  });

  it("respects a larger limit by returning all valid matches ordered by closeness", () => {
    const result = similarListings(target, all, 10);
    expect(result.map((l) => l.id)).toEqual(["closest", "mid", "farthest"]);
  });
});
