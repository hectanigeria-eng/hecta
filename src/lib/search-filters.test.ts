import { describe, expect, it } from "vitest";
import { activeFilterCount, toListingFilters } from "@/lib/search-filters";
import { parseSearchParams } from "@/lib/search-params";

describe("toListingFilters", () => {
  it("maps location and intent onto the ListingFilters shape", () => {
    const filters = toListingFilters(
      parseSearchParams({ intent: "buy", state: "lagos", city: "eti-osa" }),
    );
    expect(filters.intent).toBe("buy");
    expect(filters.state).toBe("lagos");
    expect(filters.cityLga).toBe("eti-osa");
  });

  it("keeps verifiedOnly on by default", () => {
    expect(toListingFilters(parseSearchParams({})).verifiedOnly).toBe(true);
    expect(
      toListingFilters(parseSearchParams({ verifiedOnly: "false" }))
        .verifiedOnly,
    ).toBe(false);
  });

  it("drops property types that are not real PropertyType slugs", () => {
    const filters = toListingFilters(
      parseSearchParams({ types: "duplex,banana,studio" }),
    );
    expect(filters.propertyTypes).toEqual(["duplex", "studio"]);
  });

  it("collapses an all-invalid type list to undefined rather than match-nothing", () => {
    expect(
      toListingFilters(parseSearchParams({ types: "banana" })).propertyTypes,
    ).toBeUndefined();
  });

  it("collapses empty array params to undefined", () => {
    const filters = toListingFilters(
      parseSearchParams({ areas: "", amenities: "" }),
    );
    expect(filters.areas).toBeUndefined();
    expect(filters.amenities).toBeUndefined();
  });

  it("renames beds/baths/city/lease/pets to their ListingFilters keys", () => {
    const filters = toListingFilters(
      parseSearchParams({
        beds: "3",
        baths: "2",
        lease: "long_term",
        pets: "true",
      }),
    );
    expect(filters.bedroomsMin).toBe(3);
    expect(filters.bathroomsMin).toBe(2);
    expect(filters.leaseType).toBe("long_term");
    expect(filters.petsAllowed).toBe(true);
  });

  it("maps moveInDate onto moveInBy", () => {
    const filters = toListingFilters(
      parseSearchParams({ moveInDate: "2026-09-01" }),
    );
    expect(filters.moveInBy).toBe("2026-09-01");
  });

  it("leaves moveInBy undefined when moveInDate is absent", () => {
    expect(toListingFilters(parseSearchParams({})).moveInBy).toBeUndefined();
  });
});

describe("activeFilterCount", () => {
  it("ignores location, intent, sort, view and the verified default", () => {
    expect(
      activeFilterCount(
        parseSearchParams({
          intent: "buy",
          state: "lagos",
          city: "eti-osa",
          sort: "price_asc",
          view: "list",
          page: "3",
        }),
      ),
    ).toBe(0);
  });

  it("counts each narrowing filter once", () => {
    expect(
      activeFilterCount(
        parseSearchParams({
          priceMin: "500000",
          types: "duplex",
          beds: "3",
          amenities: "Generator,Parking",
        }),
      ),
    ).toBe(4);
  });

  it("does not count a bedrooms/bathrooms minimum of zero", () => {
    expect(
      activeFilterCount(parseSearchParams({ beds: "0", baths: "0" })),
    ).toBe(0);
  });

  it("counts a moveInDate filter", () => {
    expect(
      activeFilterCount(parseSearchParams({ moveInDate: "2026-09-01" })),
    ).toBe(1);
  });
});
