import { describe, expect, it } from "vitest";
import { AREA_COORDS } from "@/constants/locations";
import { MIN_LISTING_IMAGES } from "@/constants/marketplace";
import {
  basicsSchema,
  buildListingPayload,
  costsSchema,
  createEmptyDraft,
  detailsSchema,
  draftMoveInTotal,
  draftRefundableTotal,
  isSizeSqmRequired,
  type ListingDraft,
  locationSchema,
  photosSchema,
  SIZE_SQM_REQUIRED_MESSAGE,
  type SpecsValues,
  specsSchema,
  specsSchemaFor,
} from "@/features/dashboard/new-listing/steps";

const PHOTOS = [
  "https://images.unsplash.com/photo-a?w=1200",
  "https://images.unsplash.com/photo-b?w=1200",
  "https://images.unsplash.com/photo-c?w=1200",
  "https://images.unsplash.com/photo-d?w=1200",
];

function validSpecs(overrides: Partial<SpecsValues> = {}): SpecsValues {
  return {
    bedrooms: "3",
    bathrooms: "3",
    toilets: "4",
    sizeSqm: "",
    floor: "",
    serviced: "none",
    furnishing: "unfurnished",
    leaseType: "long_term",
    petsAllowed: false,
    moveInDate: "2026-09-01",
    powerSupply: "Band A, about 20 hours daily",
    waterSupply: "Borehole with treatment plant",
    ...overrides,
  };
}

function completeDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  const base = createEmptyDraft();
  return {
    ...base,
    basics: {
      intent: "rent",
      propertyType: "apartment",
      title: "3 bedroom flat in Lekki Phase 1",
    },
    location: {
      state: "lagos",
      cityLga: "eti-osa",
      area: "lekki-phase-1",
      street: "12 Admiralty Way",
    },
    specs: validSpecs(),
    costs: {
      price: "6500000",
      pricePeriod: "per_annum",
      otherCharges: [
        { label: "Agency fee", amount: "650000", refundable: false },
        { label: "Caution deposit", amount: "650000", refundable: true },
      ],
    },
    photos: { images: PHOTOS },
    details: {
      description:
        "A bright three bedroom flat with fitted kitchen, ample parking and 24 hour estate security in Lekki Phase 1.",
      amenities: ["Parking", "Security"],
    },
    ...overrides,
  };
}

describe("basicsSchema", () => {
  it("rejects a headline shorter than 10 characters", () => {
    const result = basicsSchema.safeParse({
      intent: "rent",
      propertyType: "apartment",
      title: "Nice flat",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["title"]);
    expect(result.error?.issues[0].message).toContain("10 characters");
  });

  it("accepts a full headline and trims it", () => {
    const result = basicsSchema.safeParse({
      intent: "buy",
      propertyType: "land",
      title: "  900sqm dry land in Ajah  ",
    });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("900sqm dry land in Ajah");
  });
});

describe("locationSchema", () => {
  it("flags a missing city with a message on that field", () => {
    const result = locationSchema.safeParse({
      state: "lagos",
      cityLga: "",
      area: "lekki-phase-1",
      street: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["cityLga"]);
  });

  it("rejects an area with no known coordinate", () => {
    const result = locationSchema.safeParse({
      state: "lagos",
      cityLga: "eti-osa",
      area: "atlantis",
      street: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["area"]);
  });
});

describe("isSizeSqmRequired", () => {
  it("is required for anything for sale", () => {
    expect(isSizeSqmRequired("buy", "apartment")).toBe(true);
    expect(isSizeSqmRequired("buy", "land")).toBe(true);
  });

  it("is required for land even when it is being rented", () => {
    expect(isSizeSqmRequired("rent", "land")).toBe(true);
  });

  it("is optional for an ordinary rental", () => {
    expect(isSizeSqmRequired("rent", "apartment")).toBe(false);
    expect(isSizeSqmRequired("rent", "duplex")).toBe(false);
  });
});

describe("specsSchemaFor", () => {
  it("lets a rented flat leave the size blank", () => {
    const result = specsSchemaFor({
      intent: "rent",
      propertyType: "apartment",
    }).safeParse(validSpecs());
    expect(result.success).toBe(true);
    expect(result.data?.sizeSqm).toBeUndefined();
  });

  it("requires the size when the listing is for sale", () => {
    const result = specsSchemaFor({
      intent: "buy",
      propertyType: "duplex",
    }).safeParse(validSpecs());
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["sizeSqm"]);
    expect(result.error?.issues[0].message).toBe(SIZE_SQM_REQUIRED_MESSAGE);
  });

  it("requires the size for land, even to rent", () => {
    const result = specsSchemaFor({
      intent: "rent",
      propertyType: "land",
    }).safeParse(validSpecs());
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["sizeSqm"]);
  });

  it("passes once the size is filled in for a sale", () => {
    const result = specsSchemaFor({
      intent: "buy",
      propertyType: "duplex",
    }).safeParse(validSpecs({ sizeSqm: "450" }));
    expect(result.success).toBe(true);
    expect(result.data?.sizeSqm).toBe(450);
  });

  it("does not mutate the shared base schema", () => {
    specsSchemaFor({ intent: "buy", propertyType: "land" });
    expect(specsSchema.safeParse(validSpecs()).success).toBe(true);
  });

  it("turns typed counts into numbers and keeps a blank floor undefined", () => {
    const result = specsSchema.safeParse(validSpecs({ floor: "" }));
    expect(result.data?.bedrooms).toBe(3);
    expect(result.data?.floor).toBeUndefined();
  });

  it("rejects a fractional bedroom count with a plain-language message", () => {
    const result = specsSchema.safeParse(validSpecs({ bedrooms: "2.5" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("whole number");
  });
});

describe("costsSchema", () => {
  it("accepts distinct charge labels and converts amounts to numbers", () => {
    const result = costsSchema.safeParse({
      price: "6500000",
      pricePeriod: "per_annum",
      otherCharges: [
        { label: "Agency fee", amount: "650000", refundable: false },
        { label: "Legal fee", amount: "325000", refundable: false },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data?.otherCharges[0].amount).toBe(650000);
  });

  it("rejects two charges with the same label, pointing at the second row", () => {
    const result = costsSchema.safeParse({
      price: "6500000",
      pricePeriod: "per_annum",
      otherCharges: [
        { label: "Agency fee", amount: "650000", refundable: false },
        { label: "Agency fee", amount: "100000", refundable: false },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["otherCharges", 1, "label"]);
    expect(result.error?.issues[0].message).toContain("already added a charge");
  });

  it("treats labels differing only by case or spacing as duplicates", () => {
    const result = costsSchema.safeParse({
      price: "6500000",
      pricePeriod: "per_annum",
      otherCharges: [
        { label: "Agency fee", amount: "650000", refundable: false },
        { label: "  AGENCY FEE ", amount: "100000", refundable: false },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["otherCharges", 1, "label"]);
  });

  it("flags a third row that repeats the first label", () => {
    const result = costsSchema.safeParse({
      price: "6500000",
      pricePeriod: "per_annum",
      otherCharges: [
        { label: "Service charge", amount: "500000", refundable: false },
        { label: "Legal fee", amount: "325000", refundable: false },
        { label: "Service charge", amount: "200000", refundable: false },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["otherCharges", 2, "label"]);
  });

  it("rejects a zero-naira charge", () => {
    const result = costsSchema.safeParse({
      price: "6500000",
      pricePeriod: "per_annum",
      otherCharges: [{ label: "Agency fee", amount: "0", refundable: false }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["otherCharges", 0, "amount"]);
  });
});

describe("photosSchema", () => {
  it(`rejects fewer than ${MIN_LISTING_IMAGES} photos`, () => {
    const result = photosSchema.safeParse({ images: PHOTOS.slice(0, 3) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(
      `at least ${MIN_LISTING_IMAGES}`,
    );
  });

  it(`accepts exactly ${MIN_LISTING_IMAGES} photos`, () => {
    expect(photosSchema.safeParse({ images: PHOTOS }).success).toBe(true);
  });

  it("rejects the same photo picked twice", () => {
    const result = photosSchema.safeParse({
      images: [...PHOTOS.slice(0, 3), PHOTOS[0]],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("selected twice");
  });
});

describe("detailsSchema", () => {
  it("rejects a 20-character description", () => {
    const result = detailsSchema.safeParse({
      description: "Very nice flat oo!!!",
      amenities: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["description"]);
  });

  it("rejects an amenity that is not on the shortlist", () => {
    const result = detailsSchema.safeParse({
      description:
        "A bright three bedroom flat with fitted kitchen and ample parking in Lekki.",
      amenities: ["Helipad"],
    });
    expect(result.success).toBe(false);
  });
});

describe("draft totals", () => {
  it("adds every charge to the price, refundable or not", () => {
    expect(draftMoveInTotal(completeDraft().costs)).toBe(7800000);
  });

  it("ignores half-typed amounts instead of returning NaN", () => {
    expect(
      draftMoveInTotal({
        price: "",
        otherCharges: [{ label: "Agency fee", amount: "", refundable: false }],
      }),
    ).toBe(0);
  });

  it("counts only refundable rows in the refundable total", () => {
    expect(draftRefundableTotal(completeDraft().costs)).toBe(650000);
  });
});

describe("buildListingPayload", () => {
  it("shapes a complete draft into the store's create payload", () => {
    const result = buildListingPayload(completeDraft(), "user-amaka");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.landlordId).toBe("user-amaka");
    expect(result.payload.price).toBe(6500000);
    expect(result.payload.bedrooms).toBe(3);
    expect(result.payload.images).toHaveLength(MIN_LISTING_IMAGES);
    expect(result.payload.location.geoPoint).toEqual(
      AREA_COORDS["lekki-phase-1"],
    );
    expect(result.payload.otherCharges).toEqual([
      { label: "Agency fee", amount: 650000, refundable: false },
      { label: "Caution deposit", amount: 650000, refundable: true },
    ]);
  });

  it("drops a blank street rather than sending an empty string", () => {
    const draft = completeDraft();
    draft.location.street = "   ";
    const result = buildListingPayload(draft, "user-amaka");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.location.street).toBeUndefined();
  });

  it("sends the landlord back to Specs when a sale has no size", () => {
    const draft = completeDraft();
    draft.basics.intent = "buy";
    draft.costs.pricePeriod = "outright";
    const result = buildListingPayload(draft, "user-amaka");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stepId).toBe("specs");
    expect(result.message).toBe(SIZE_SQM_REQUIRED_MESSAGE);
  });

  it("sends the landlord back to Costs when two charges clash", () => {
    const draft = completeDraft();
    draft.costs.otherCharges = [
      { label: "Agency fee", amount: "650000", refundable: false },
      { label: "agency fee", amount: "10000", refundable: false },
    ];
    const result = buildListingPayload(draft, "user-amaka");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stepId).toBe("costs");
  });

  it("sends the landlord back to Photos when the minimum is not met", () => {
    const draft = completeDraft();
    draft.photos.images = PHOTOS.slice(0, 2);
    const result = buildListingPayload(draft, "user-amaka");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stepId).toBe("photos");
  });
});
