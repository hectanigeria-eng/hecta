import { z } from "zod";

// URL query params are UI state, not a privilege boundary — a mangled or
// hand-edited URL must render the ordinary search entry state rather than an
// error page, so every value here is optional/defaulted and the top-level
// parse never throws (see `parseSearchParams`).

// `z.coerce.boolean()` treats *any* non-empty string (including "false") as
// `true`, which would silently break the buildSearchUrl -> parseSearchParams
// round trip for every boolean param whenever it's serialized as "false".
// This preprocesses the two literal string forms produced by
// `buildSearchUrl` ("true" / "false") into real booleans before the boolean
// schema runs, and leaves anything else untouched so bogus values (e.g.
// "banana") still fail validation and fall back to defaults.
function coerceBooleanString(value: unknown): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

const booleanParam = z.preprocess(coerceBooleanString, z.boolean());

export const searchParamsSchema = z.object({
  intent: z.enum(["rent", "buy"]).default("rent"),
  state: z.string().optional(),
  city: z.string().optional(),
  areas: z
    .string()
    .transform((s) => s.split(",").filter(Boolean))
    .optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  types: z
    .string()
    .transform((s) => s.split(",").filter(Boolean))
    .optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
  serviced: z.enum(["none", "semi", "full"]).optional(),
  pets: booleanParam.optional(),
  lease: z.enum(["short_term", "long_term"]).optional(),
  moveInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  amenities: z
    .string()
    .transform((s) => s.split(",").filter(Boolean))
    .optional(),
  verifiedOnly: booleanParam.default(true),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "freshness"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  view: z.enum(["grid", "list"]).default("grid"),
  map: booleanParam.default(true),
});

export type SearchQuery = z.infer<typeof searchParamsSchema>;

// The schema's own defaults, computed once. Used both as the fallback for a
// failed parse and as the base a partial `buildSearchUrl` change is merged
// over when no explicit `base` is supplied.
const DEFAULT_QUERY: SearchQuery = searchParamsSchema.parse({});

// Canonical key order for serialized URLs — the order fields were declared
// in the schema — so `buildSearchUrl` output is deterministic regardless of
// which fields happened to be set on `base` vs. `query`. `Object.keys` is
// typed as `string[]`; the cast is safe because `.shape`'s own keys are, by
// construction, exactly `SearchQuery`'s keys.
const QUERY_KEYS = Object.keys(searchParamsSchema.shape) as Array<
  keyof SearchQuery
>;

/**
 * Parses a Next.js `searchParams` record into a `SearchQuery`. Never throws:
 * on any validation failure (unknown enum value, non-numeric price, etc.)
 * the full set of schema defaults is returned instead, so a mangled URL
 * still renders the ordinary search entry state.
 */
export function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchQuery {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    normalized[key] = Array.isArray(value) ? value.join(",") : value;
  }

  const result = searchParamsSchema.safeParse(normalized);
  return result.success ? result.data : DEFAULT_QUERY;
}

function isDefaultValue<K extends keyof SearchQuery>(
  key: K,
  value: SearchQuery[K],
): boolean {
  return (
    key in DEFAULT_QUERY &&
    JSON.stringify(value) === JSON.stringify(DEFAULT_QUERY[key])
  );
}

/**
 * Merges a partial set of changes over `base` (or the schema defaults, when
 * omitted) and serializes the result back into a `/search?...` URL. Params
 * that equal their schema default are omitted so URLs stay clean; array
 * params (`areas`, `types`, `amenities`) serialize comma-separated.
 */
export function buildSearchUrl(
  query: Partial<SearchQuery>,
  base?: SearchQuery,
): string {
  const merged: SearchQuery = { ...DEFAULT_QUERY, ...base, ...query };
  const params = new URLSearchParams();

  for (const key of QUERY_KEYS) {
    const value = merged[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.join(","));
      continue;
    }
    if (isDefaultValue(key, value)) continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
