import { describe, expect, it } from "vitest";
import {
  buildSearchUrl,
  parseSearchParams,
  type SearchQuery,
} from "@/lib/search-params";

describe("parseSearchParams", () => {
  it("applies schema defaults when params are absent", () => {
    expect(parseSearchParams({})).toEqual({
      intent: "rent",
      verifiedOnly: true,
      sort: "newest",
      page: 1,
      view: "grid",
      map: true,
    });
  });

  it("round-trips comma-separated array params", () => {
    const result = parseSearchParams({ areas: "ikeja,lekki,yaba" });
    expect(result.areas).toEqual(["ikeja", "lekki", "yaba"]);
  });

  it("joins a repeated-key string[] param with commas before parsing", () => {
    const result = parseSearchParams({ types: ["apartment", "duplex"] });
    expect(result.types).toEqual(["apartment", "duplex"]);
  });

  it("falls back to full schema defaults on an invalid enum value", () => {
    const result = parseSearchParams({ intent: "lease", state: "lagos" });
    expect(result).toEqual({
      intent: "rent",
      verifiedOnly: true,
      sort: "newest",
      page: 1,
      view: "grid",
      map: true,
    });
  });

  it("falls back to full schema defaults on a non-numeric price", () => {
    const result = parseSearchParams({ priceMin: "not-a-number" });
    expect(result.priceMin).toBeUndefined();
    expect(result).toEqual({
      intent: "rent",
      verifiedOnly: true,
      sort: "newest",
      page: 1,
      view: "grid",
      map: true,
    });
  });

  it("never throws on a garbage query object", () => {
    expect(() =>
      parseSearchParams({ page: "-5", sort: "trending", view: "carousel" }),
    ).not.toThrow();
  });

  it("parses explicit 'false' string booleans as false, not true", () => {
    const result = parseSearchParams({
      verifiedOnly: "false",
      pets: "false",
      map: "false",
    });
    expect(result.verifiedOnly).toBe(false);
    expect(result.pets).toBe(false);
    expect(result.map).toBe(false);
  });
});

describe("buildSearchUrl", () => {
  it("omits every param that equals its schema default", () => {
    expect(buildSearchUrl({})).toBe("/search");
    expect(
      buildSearchUrl({
        intent: "rent",
        verifiedOnly: true,
        sort: "newest",
        page: 1,
        view: "grid",
        map: true,
      }),
    ).toBe("/search");
  });

  it("serializes only the non-default fields", () => {
    expect(buildSearchUrl({ intent: "buy", page: 2 })).toBe(
      "/search?intent=buy&page=2",
    );
  });

  it("serializes array params comma-separated", () => {
    expect(
      buildSearchUrl({ areas: ["ikeja", "lekki"], types: ["duplex"] }),
    ).toBe("/search?areas=ikeja%2Clekki&types=duplex");
  });

  it("merges partial changes over a supplied base query", () => {
    const base: SearchQuery = {
      intent: "rent",
      state: "lagos",
      city: "ikeja",
      verifiedOnly: true,
      sort: "newest",
      page: 3,
      view: "grid",
      map: true,
    };
    expect(buildSearchUrl({ page: 4 }, base)).toBe(
      "/search?state=lagos&city=ikeja&page=4",
    );
  });

  it("serializes an explicit non-default boolean false", () => {
    expect(buildSearchUrl({ verifiedOnly: false })).toBe(
      "/search?verifiedOnly=false",
    );
  });

  it("round-trips through parseSearchParams and preserves the query", () => {
    const query = buildSearchUrl({
      intent: "buy",
      state: "lagos",
      city: "ikeja",
      areas: ["ikeja", "lekki"],
      priceMin: 500_000,
      priceMax: 5_000_000,
      types: ["apartment", "duplex"],
      beds: 3,
      baths: 2,
      furnishing: "furnished",
      serviced: "full",
      pets: true,
      lease: "long_term",
      amenities: ["gym", "pool"],
      verifiedOnly: false,
      sort: "price_asc",
      page: 2,
      view: "list",
      map: false,
    });

    const [, qs] = query.split("?");
    const raw = Object.fromEntries(new URLSearchParams(qs));
    const parsed = parseSearchParams(raw);

    expect(parsed).toEqual({
      intent: "buy",
      state: "lagos",
      city: "ikeja",
      areas: ["ikeja", "lekki"],
      priceMin: 500_000,
      priceMax: 5_000_000,
      types: ["apartment", "duplex"],
      beds: 3,
      baths: 2,
      furnishing: "furnished",
      serviced: "full",
      pets: true,
      lease: "long_term",
      amenities: ["gym", "pool"],
      verifiedOnly: false,
      sort: "price_asc",
      page: 2,
      view: "list",
      map: false,
    });
  });

  it("round-trips the all-defaults query back to a bare /search URL", () => {
    const query = buildSearchUrl({});
    const [, qs] = query.split("?");
    const raw = qs ? Object.fromEntries(new URLSearchParams(qs)) : {};
    expect(parseSearchParams(raw)).toEqual(parseSearchParams({}));
  });
});
