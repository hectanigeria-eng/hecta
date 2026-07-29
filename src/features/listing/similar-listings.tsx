import { ListingCard } from "@/features/search/listing-card";
import type { Listing } from "@/lib/types";

interface SimilarListingsProps {
  listings: Listing[];
}

export function SimilarListings({ listings }: SimilarListingsProps) {
  if (listings.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-listings-heading"
      className="flex flex-col gap-4"
    >
      <h2
        id="similar-listings-heading"
        className="font-heading text-xl font-bold text-ink"
      >
        Similar homes nearby
      </h2>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-3">
        {listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} view="grid" />
          </li>
        ))}
      </ul>
    </section>
  );
}
