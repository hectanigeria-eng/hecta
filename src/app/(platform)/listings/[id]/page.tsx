import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locationLabel } from "@/constants/locations";
import { ListingDetail } from "@/features/listing/listing-detail";
import { formatNaira, pricePeriodLabel } from "@/lib/format";
import { MOCK_LISTINGS } from "@/lib/mock";
import type { Listing } from "@/lib/types";

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;
const TITLE_SUFFIX = " — Hecta";
const ELLIPSIS = "…";

// Listings a landlord creates at runtime live only in the browser store, so
// the server can never look them up. Their ids are `crypto.randomUUID()`
// values, which is enough to tell "an id this app could plausibly have
// minted" from "a hand-typed URL that was never real" — the latter gets a
// true 404, the former reaches the client, which renders its own
// "Listing not found" state if the store has since dropped it.
const RUNTIME_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function seedListing(id: string): Listing | undefined {
  return MOCK_LISTINGS.find((listing) => listing.id === id);
}

function isRoutableId(id: string): boolean {
  return seedListing(id) !== undefined || RUNTIME_ID_PATTERN.test(id);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = seedListing(id);

  if (listing === undefined) {
    return {
      title: isRoutableId(id)
        ? "Home details — Hecta"
        : "Listing not found — Hecta",
      description:
        "Browse verified homes to rent or buy across Nigeria, with every upfront cost shown before you apply.",
      robots: { index: false },
    };
  }

  const place = locationLabel(
    listing.location.state,
    listing.location.cityLga,
    listing.location.area,
  );
  const priceLine = `${formatNaira(listing.price)}${pricePeriodLabel(listing.pricePeriod)}`;
  const costWords =
    listing.intent === "buy"
      ? "purchase price, agency and legal fees"
      : "rent, agency, legal and caution fees";
  const description = `${priceLine} in ${place}. See the full move-in cost — ${costWords} — upfront before you apply.`;

  return {
    title: `${truncate(listing.title, MAX_TITLE_LENGTH - TITLE_SUFFIX.length)}${TITLE_SUFFIX}`,
    description: truncate(description, MAX_DESCRIPTION_LENGTH),
    alternates: { canonical: `/listings/${listing.id}` },
    openGraph: {
      title: listing.title,
      description: truncate(description, MAX_DESCRIPTION_LENGTH),
      type: "article",
      images: [{ url: listing.images[0], alt: `${listing.title} in ${place}` }],
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;

  // The route only exists for ids this app could have produced; everything
  // else is a genuine 404 (crawlers and hand-typed URLs alike). The live
  // listing itself is read client-side from the store so admin/landlord
  // status changes made in this session are reflected here.
  if (!isRoutableId(id)) {
    notFound();
  }

  return <ListingDetail id={id} />;
}
