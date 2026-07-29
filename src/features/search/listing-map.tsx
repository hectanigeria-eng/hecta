"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

// Leaflet touches `window` at import time and crashes server rendering, so
// the real map (`listing-map-inner.tsx`) is only ever reached through this
// `ssr: false` dynamic boundary — never import it directly.
const ListingMapInner = dynamic(() => import("./listing-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="size-full" />,
});

// The sticky, full-height layout the search split-view uses. Task 10's
// listing-detail page passes its own `className` (a short, non-sticky
// `h-64`) instead of relying on this.
const DEFAULT_MAP_CLASSNAME =
  "rounded-2xl overflow-hidden border sticky top-20 h-[calc(100dvh-6rem)]";

export interface ListingMapProps {
  listings: Listing[];
  activeId?: string;
  onPinClick?: (listingId: string) => void;
  /** Overrides the default sticky search-column layout entirely (it is not
   * merged with it) — pass whatever box the call site needs. */
  className?: string;
}

export function ListingMap({
  listings,
  activeId,
  onPinClick,
  className,
}: ListingMapProps) {
  return (
    <div className={cn(className ?? DEFAULT_MAP_CLASSNAME)}>
      <ListingMapInner
        listings={listings}
        activeId={activeId}
        onPinClick={onPinClick}
      />
    </div>
  );
}
