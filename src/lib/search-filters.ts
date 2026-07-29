import { PROPERTY_TYPE_LABELS } from "@/constants/marketplace";
import type { ListingFilters } from "@/lib/marketplace";
import type { SearchQuery } from "@/lib/search-params";
import type { PropertyType } from "@/lib/types";

// `SearchQuery` carries URL-shaped values (loose `string[]`s that survived a
// hand-edited query string); `ListingFilters` is the typed shape
// `filterListings` consumes. This module is the single translation point
// between the two so every consumer — the results grid and the filters
// sheet's live preview count — narrows results identically.

function isPropertyType(value: string): value is PropertyType {
  return Object.hasOwn(PROPERTY_TYPE_LABELS, value);
}

/**
 * Display label for a property-type slug that arrived as a raw URL string.
 * Unknown slugs fall back to the slug itself so a hand-edited URL renders
 * something readable instead of `undefined`.
 */
export function propertyTypeLabel(value: string): string {
  return isPropertyType(value) ? PROPERTY_TYPE_LABELS[value] : value;
}

/**
 * `filterListings` treats an *empty* array as "match nothing" (no listing can
 * satisfy `[].includes(...)` / every amenity of an empty set is vacuous but
 * `areas`/`propertyTypes` use `includes`), while the URL's absence of a param
 * means "no constraint". Collapsing empty to `undefined` keeps those two
 * cases from being confused.
 */
function constrainedBy<T>(values: T[] | undefined): T[] | undefined {
  return values !== undefined && values.length > 0 ? values : undefined;
}

export function toListingFilters(query: SearchQuery): ListingFilters {
  return {
    intent: query.intent,
    state: query.state,
    cityLga: query.city,
    areas: constrainedBy(query.areas),
    priceMin: query.priceMin,
    priceMax: query.priceMax,
    propertyTypes: constrainedBy(query.types?.filter(isPropertyType)),
    bedroomsMin: query.beds,
    bathroomsMin: query.baths,
    furnishing: query.furnishing,
    serviced: query.serviced,
    petsAllowed: query.pets,
    leaseType: query.lease,
    amenities: constrainedBy(query.amenities),
    verifiedOnly: query.verifiedOnly,
  };
}

/**
 * How many narrowing filters the seeker has applied beyond location, intent
 * and display preferences — drives the badge on the "All filters" pill.
 * `verifiedOnly` is excluded because it defaults to on.
 */
export function activeFilterCount(query: SearchQuery): number {
  const flags = [
    query.priceMin !== undefined,
    query.priceMax !== undefined,
    constrainedBy(query.types) !== undefined,
    query.beds !== undefined && query.beds > 0,
    query.baths !== undefined && query.baths > 0,
    query.furnishing !== undefined,
    query.serviced !== undefined,
    query.pets !== undefined,
    query.lease !== undefined,
    constrainedBy(query.amenities) !== undefined,
  ];
  return flags.filter(Boolean).length;
}
