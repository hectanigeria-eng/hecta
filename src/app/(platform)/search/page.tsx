import type { Metadata } from "next";
import { SearchEntry } from "@/features/search/search-entry";
import { filterListings } from "@/lib/marketplace";
import { MOCK_LISTINGS } from "@/lib/mock";
import { parseSearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Find verified homes to rent or buy — Hecta",
  description:
    "Search verified rental and for-sale homes across Nigeria by state, city, and area — no agent runaround.",
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = parseSearchParams(await searchParams);
  const hasLocation = Boolean(query.state && query.city);

  if (!hasLocation) {
    return <SearchEntry query={query} />;
  }

  // Temporary placeholder — Task 8 replaces this entire branch with the real
  // results view (cards, filters, map) built on this same `filterListings`
  // call. Keep this to a single count element; do not add layout here.
  const matches = filterListings(MOCK_LISTINGS, {
    intent: query.intent,
    state: query.state,
    cityLga: query.city,
    areas: query.areas,
    verifiedOnly: query.verifiedOnly,
  });

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-lg text-ink" data-testid="results-count-placeholder">
        {matches.length} {matches.length === 1 ? "home" : "homes"} match your
        search.
      </p>
    </section>
  );
}
