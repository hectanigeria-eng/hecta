import { describe, expect, it } from "vitest";
import {
  formatListingAddress,
  hasDuplicateAddress,
  maskNinLast4,
  ninFormatValid,
  sortVerificationsForQueue,
  verificationReferenceNumber,
} from "@/lib/admin";
import type { Listing, VerificationSubmission } from "@/lib/types";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    landlordId: "user-amaka",
    intent: "rent",
    title: "Bright 2-Bed Flat off Admiralty Way",
    price: 3_500_000,
    pricePeriod: "per_annum",
    otherCharges: [],
    location: {
      state: "lagos",
      cityLga: "eti-osa",
      area: "lekki-phase-1",
      street: "Admiralty Way",
      geoPoint: { lat: 6.43, lng: 3.47 },
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
    powerSupply: "PHCN",
    waterSupply: "Borehole",
    amenities: [],
    description: "",
    images: [],
    status: "active",
    verifiedProperty: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastConfirmedAvailableAt: "2026-01-01T00:00:00.000Z",
    reconfirmDueAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeVerification(
  overrides: Partial<VerificationSubmission> = {},
): VerificationSubmission {
  return {
    id: "verification-2",
    landlordId: "user-emeka",
    landlordName: "Emeka Nwachukwu",
    nin: "***********5678",
    propertyAddress: "University Road, Akoka, Yaba, Lagos",
    ownershipDocType: "family_resolution",
    legitimacyDoc: "none",
    status: "submitted",
    submittedAt: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("maskNinLast4", () => {
  it("keeps only the last 4 digits, regardless of existing mask characters", () => {
    expect(maskNinLast4("***********1234")).toBe("••• •••• 1234");
  });

  it("strips digits out of raw unmasked input too", () => {
    expect(maskNinLast4("12345678901")).toBe("••• •••• 8901");
  });
});

describe("ninFormatValid", () => {
  it("accepts a masked NIN with exactly 4 trailing digits", () => {
    expect(ninFormatValid("***********1234")).toBe(true);
  });

  it("rejects a value with digits before the trailing group", () => {
    expect(ninFormatValid("12345678901")).toBe(false);
  });

  it("rejects a value with fewer than 4 trailing digits", () => {
    expect(ninFormatValid("***123")).toBe(false);
  });
});

describe("formatListingAddress", () => {
  it("joins street, area, city, and state labels", () => {
    expect(formatListingAddress(makeListing())).toBe(
      "Admiralty Way, Lekki Phase 1, Eti-Osa, Lagos",
    );
  });

  it("omits the street when the listing has none", () => {
    const listing = makeListing({
      location: {
        state: "lagos",
        cityLga: "eti-osa",
        area: "lekki-phase-1",
        geoPoint: { lat: 6.43, lng: 3.47 },
      },
    });
    expect(formatListingAddress(listing)).toBe("Lekki Phase 1, Eti-Osa, Lagos");
  });
});

describe("hasDuplicateAddress", () => {
  it("flags a real match against an existing listing's address", () => {
    const listing = makeListing({
      id: "listing-31",
      landlordId: "user-emeka",
      location: {
        state: "lagos",
        cityLga: "yaba",
        area: "akoka",
        street: "University Road",
        geoPoint: { lat: 6.51, lng: 3.38 },
      },
    });
    expect(
      hasDuplicateAddress("University Road, Akoka, Yaba, Lagos", [listing]),
    ).toBe(true);
  });

  it("matches through case and punctuation differences", () => {
    const listing = makeListing({
      location: {
        state: "lagos",
        cityLga: "eti-osa",
        area: "lekki-phase-1",
        street: "admiralty way",
        geoPoint: { lat: 6.43, lng: 3.47 },
      },
    });
    expect(
      hasDuplicateAddress("ADMIRALTY WAY, Lekki Phase 1, Eti-Osa, Lagos.", [
        listing,
      ]),
    ).toBe(true);
  });

  it("returns false when no listing shares the address", () => {
    const listing = makeListing();
    expect(
      hasDuplicateAddress("10th Avenue, Gwarinpa, AMAC, Abuja", [listing]),
    ).toBe(false);
  });

  it("returns false for an empty address rather than matching everything", () => {
    expect(hasDuplicateAddress("", [makeListing()])).toBe(false);
  });
});

describe("verificationReferenceNumber", () => {
  it("is deterministic for the same submission id", () => {
    const submission = makeVerification({ id: "verification-2" });
    expect(verificationReferenceNumber(submission)).toBe(
      verificationReferenceNumber(submission),
    );
  });

  it("differs between two different submission ids", () => {
    const a = verificationReferenceNumber(
      makeVerification({ id: "verification-2" }),
    );
    const b = verificationReferenceNumber(
      makeVerification({ id: "verification-3" }),
    );
    expect(a).not.toBe(b);
  });
});

describe("sortVerificationsForQueue", () => {
  it("puts actionable submissions before decided ones", () => {
    const approved = makeVerification({
      id: "v-approved",
      status: "approved",
      submittedAt: "2026-07-28T00:00:00.000Z",
    });
    const submitted = makeVerification({
      id: "v-submitted",
      status: "submitted",
      submittedAt: "2026-07-20T00:00:00.000Z",
    });
    const infoRequested = makeVerification({
      id: "v-info",
      status: "info_requested",
      submittedAt: "2026-07-10T00:00:00.000Z",
    });

    const sorted = sortVerificationsForQueue([
      approved,
      submitted,
      infoRequested,
    ]);

    expect(sorted.map((v) => v.id)).toEqual([
      "v-submitted",
      "v-info",
      "v-approved",
    ]);
  });

  it("orders ties within a group by most recently submitted first", () => {
    const older = makeVerification({
      id: "v-older",
      status: "submitted",
      submittedAt: "2026-07-01T00:00:00.000Z",
    });
    const newer = makeVerification({
      id: "v-newer",
      status: "submitted",
      submittedAt: "2026-07-20T00:00:00.000Z",
    });

    expect(sortVerificationsForQueue([older, newer]).map((v) => v.id)).toEqual([
      "v-newer",
      "v-older",
    ]);
  });
});
