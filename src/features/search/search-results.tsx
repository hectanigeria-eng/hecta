"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  MapTrifoldIcon,
  RowsIcon,
  SmileySadIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { RESULTS_PER_PAGE } from "@/constants/marketplace";
import {
  ListingCard,
  ListingCardSkeleton,
} from "@/features/search/listing-card";
import { ListingMap } from "@/features/search/listing-map";
import { QuickFilters } from "@/features/search/quick-filters";
import { ResultsToolbar } from "@/features/search/results-toolbar";
import { useHydrated } from "@/hooks/use-hydrated";
import { filterListings, paginate, sortListings } from "@/lib/marketplace";
import { toListingFilters } from "@/lib/search-filters";
import { buildSearchUrl, type SearchQuery } from "@/lib/search-params";
import { useHectaStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SKELETON_CARD_COUNT = 8;
// The first grid row is visible without scrolling on a laptop viewport, so
// those photos are eagerly loaded to keep LCP off a lazy image.
const ABOVE_THE_FOLD_CARDS = 2;
const SKELETON_KEYS = Array.from(
  { length: SKELETON_CARD_COUNT },
  (_, index) => `listing-skeleton-${index}`,
);

// How many numbered page links flank the current page before collapsing to
// an ellipsis.
const PAGE_WINDOW = 1;

/** A numbered page link, or a gap standing in for the pages it skipped. */
interface PageSlot {
  key: string;
  page: number | null;
}

function pageWindow(current: number, totalPages: number): PageSlot[] {
  const slots: PageSlot[] = [];
  let previous = 0;
  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNear = Math.abs(page - current) <= PAGE_WINDOW;
    if (!isEdge && !isNear) continue;
    if (previous > 0 && page - previous > 1) {
      slots.push({ key: `gap-after-${previous}`, page: null });
    }
    slots.push({ key: `page-${page}`, page });
    previous = page;
  }
  return slots;
}

interface SearchResultsProps {
  query: SearchQuery;
}

export function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const listings = useHectaStore((state) => state.listings);

  const { filtered, pageItems, total, totalPages, currentPage } =
    useMemo(() => {
      const matched = sortListings(
        filterListings(listings, toListingFilters(query)),
        query.sort,
      );
      const page = paginate(matched, query.page, RESULTS_PER_PAGE);
      return {
        // The full filtered+sorted set (every page), not just `pageItems` —
        // the map shows every matching home at once rather than only the
        // current page, so it re-fits the same bounds a "Next page" click
        // wouldn't otherwise touch.
        filtered: matched,
        pageItems: page.items,
        total: page.total,
        totalPages: page.totalPages,
        currentPage: Math.min(Math.max(1, query.page), page.totalPages),
      };
    }, [listings, query]);

  const isList = query.view === "list";
  const showMap = query.map;

  // Below `lg` the split view collapses to one full-screen pane at a time;
  // the floating pill button flips between them. Irrelevant at `lg` and up,
  // where both columns render side by side regardless of this state.
  const [mobilePane, setMobilePane] = useState<"list" | "map">("list");

  function handleClearFilters() {
    // Keeps location, intent and display preferences; every narrowing filter
    // returns to its default (which leaves "verified only" on).
    router.push(
      buildSearchUrl({
        intent: query.intent,
        state: query.state,
        city: query.city,
        areas: query.areas,
        sort: query.sort,
        view: query.view,
        map: query.map,
        page: 1,
      }),
    );
  }

  return (
    <section
      aria-labelledby="search-results-heading"
      className="flex flex-col gap-5"
    >
      <ResultsToolbar query={query} total={total} hydrated={hydrated} />
      <QuickFilters query={query} />

      <div
        className={cn(
          "gap-6",
          showMap && "lg:grid lg:grid-cols-[1fr_minmax(380px,42%)]",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-6",
            showMap && mobilePane === "map" && "hidden lg:flex",
          )}
        >
          <h3 id="search-results-heading" className="sr-only">
            Search results
          </h3>

          {!hydrated && (
            <div
              className={cn("grid gap-4", !isList && "sm:grid-cols-2")}
              aria-hidden
            >
              {SKELETON_KEYS.map((key) => (
                <ListingCardSkeleton key={key} view={query.view} />
              ))}
            </div>
          )}

          {hydrated && pageItems.length > 0 && (
            <ul
              className={cn(
                "grid list-none gap-4 p-0",
                !isList && "sm:grid-cols-2",
              )}
            >
              {pageItems.map((listing, index) => (
                <li key={listing.id}>
                  <ListingCard
                    listing={listing}
                    view={query.view}
                    priority={index < ABOVE_THE_FOLD_CARDS}
                  />
                </li>
              ))}
            </ul>
          )}

          {hydrated && pageItems.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <SmileySadIcon
                weight="duotone"
                className="size-12 text-muted-ink"
              />
              <h4 className="font-heading text-lg font-semibold text-ink">
                No homes match these filters
              </h4>
              <p className="max-w-sm text-sm text-muted-ink">
                Try widening your price range or removing a filter — there may
                be more homes nearby than these settings allow.
              </p>
              <Button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 h-11 rounded-full px-6 text-sm font-semibold normal-case tracking-normal"
              >
                Clear filters
              </Button>
            </div>
          )}

          {hydrated && totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      asChild
                      size="default"
                      aria-label="Go to previous page"
                      className="gap-1 rounded-full pl-3 normal-case tracking-normal"
                    >
                      <Link
                        href={buildSearchUrl({ page: currentPage - 1 }, query)}
                        scroll
                      >
                        <CaretLeftIcon />
                        <span className="hidden sm:block">Previous</span>
                      </Link>
                    </PaginationLink>
                  </PaginationItem>
                )}

                {pageWindow(currentPage, totalPages).map((slot) =>
                  slot.page === null ? (
                    <PaginationItem key={slot.key}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={slot.key}>
                      <PaginationLink
                        asChild
                        isActive={slot.page === currentPage}
                        aria-label={`Go to page ${slot.page}`}
                        className="rounded-full"
                      >
                        <Link
                          href={buildSearchUrl({ page: slot.page }, query)}
                          scroll
                        >
                          {slot.page}
                        </Link>
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink
                      asChild
                      size="default"
                      aria-label="Go to next page"
                      className="gap-1 rounded-full pr-3 normal-case tracking-normal"
                    >
                      <Link
                        href={buildSearchUrl({ page: currentPage + 1 }, query)}
                        scroll
                      >
                        <span className="hidden sm:block">Next</span>
                        <CaretRightIcon />
                      </Link>
                    </PaginationLink>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {showMap && (
          <aside
            aria-label="Map of these results"
            className={cn(
              "lg:static lg:z-auto lg:block",
              mobilePane === "map" ? "fixed inset-0 z-30 block" : "hidden",
            )}
          >
            <ListingMap
              listings={filtered}
              className="size-full lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)] lg:rounded-2xl lg:border lg:overflow-hidden"
            />
          </aside>
        )}
      </div>

      {showMap && (
        <Button
          type="button"
          onClick={() =>
            setMobilePane((pane) => (pane === "list" ? "map" : "list"))
          }
          aria-label={
            mobilePane === "list" ? "Show map view" : "Show list view"
          }
          className="fixed bottom-4 left-1/2 z-40 h-11 -translate-x-1/2 gap-1.5 rounded-full px-6 text-sm font-semibold normal-case tracking-normal shadow-lg lg:hidden"
        >
          {mobilePane === "list" ? (
            <>
              <MapTrifoldIcon weight="bold" />
              Map
            </>
          ) : (
            <>
              <RowsIcon weight="bold" />
              List
            </>
          )}
        </Button>
      )}
    </section>
  );
}
