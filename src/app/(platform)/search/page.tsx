import type { Metadata } from "next";
import { cityBySlug, stateBySlug } from "@/constants/locations";
import { SearchResults } from "@/features/search/search-results";
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

  // Results themselves render client-side (they read the Zustand store so
  // later admin/landlord status changes are reflected), so the crawlable,
  // server-rendered page heading lives here rather than in SearchResults —
  // which keeps its own headings at <h2> and below.
  const cityLabel = cityBySlug(query.state ?? "", query.city ?? "")?.label;
  const stateLabel = stateBySlug(query.state ?? "")?.label;
  const place = [cityLabel, stateLabel].filter(Boolean).join(", ");
  const homesLabel =
    query.intent === "rent" ? "Homes to rent" : "Homes for sale";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="sr-only">
        {homesLabel}
        {place ? ` in ${place}` : ""}
      </h1>
      <SearchResults query={query} />
    </div>
  );
}
