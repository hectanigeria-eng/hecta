"use client";

// This module touches `window` at import time (Leaflet reads it during
// `L.Icon.Default` setup and DOM feature detection), which crashes server
// rendering. It must only ever be reached through the `next/dynamic`
// boundary in `listing-map.tsx` — never import it directly from a Server
// Component or from anything that isn't already client-only.
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { formatNaira, pricePeriodLabel } from "@/lib/format";
import type { Listing } from "@/lib/types";

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const DEFAULT_ZOOM = 11;
const FIT_BOUNDS_MAX_ZOOM = 15;
const FIT_BOUNDS_PADDING: [number, number] = [40, 40];
const NAIRA_MILLION = 1_000_000;
const NAIRA_THOUSAND = 1_000;
const POPUP_IMAGE_SIZE = 80;

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface ListingMapInnerProps {
  listings: Listing[];
  activeId?: string;
  onPinClick?: (listingId: string) => void;
}

/**
 * A short label for the pin bubble. `formatNaira` renders a full figure
 * (e.g. "₦45,000,000") that overflows a small pin, so amounts of ₦1,000 and
 * up are abbreviated to "K"/"M" here; anything smaller falls back to the
 * shared formatter.
 */
function pinLabel(price: number): string {
  if (price >= NAIRA_MILLION) {
    const millions = Math.round((price / NAIRA_MILLION) * 10) / 10;
    return `₦${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (price >= NAIRA_THOUSAND) {
    return `₦${Math.round(price / NAIRA_THOUSAND)}K`;
  }
  return formatNaira(price);
}

function buildPinIcon(listing: Listing, isActive: boolean): L.DivIcon {
  const className = isActive ? "map-pin map-pin-active" : "map-pin";
  return L.divIcon({
    className: "",
    html: `<span class="${className}">${pinLabel(listing.price)}</span>`,
  });
}

/**
 * Fits the map to every listing's coordinate on mount and whenever the
 * (already-filtered) listing set changes, so narrowing filters refits the
 * bounds instead of leaving the camera on stale territory. Falls back to
 * the Lagos default view when there is nothing to show.
 *
 * Also guards the classic Leaflet grey-tile bug: a map that was initialised
 * (or last measured) while its container was hidden or zero-height keeps
 * stale tile geometry *and* an over-zoomed camera — `fitBounds` computed
 * its zoom from a zero-size container — until something re-measures. A
 * `ResizeObserver` on the map's own container catches both the
 * `hidden lg:block` search column and the mobile full-screen toggle, and
 * re-running the exact same fit (not just `invalidateSize`) once the
 * container reports its real dimensions is what actually corrects the zoom.
 */
function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();

  const fit = useCallback(() => {
    if (listings.length === 0) {
      map.setView(LAGOS_CENTER, DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(
      listings.map((listing): [number, number] => [
        listing.location.geoPoint.lat,
        listing.location.geoPoint.lng,
      ]),
    );
    map.fitBounds(bounds, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: FIT_BOUNDS_MAX_ZOOM,
    });
  }, [map, listings]);

  useEffect(() => {
    fit();
  }, [fit]);

  // Re-registers on every listing-set change (cheap: a handful of markers),
  // which keeps the callback's `fit` from ever going stale.
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fit();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, fit]);

  return null;
}

function ListingPopupCard({ listing }: { listing: Listing }) {
  return (
    <div className="flex w-56 gap-3">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-paper-2">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes={`${POPUP_IMAGE_SIZE}px`}
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1 py-0.5">
        <p className="font-heading text-sm leading-tight font-bold text-ink">
          {formatNaira(listing.price)}
          <span className="text-xs font-medium text-muted-ink">
            {pricePeriodLabel(listing.pricePeriod)}
          </span>
        </p>
        <p className="truncate text-xs text-muted-ink">
          {listing.bedrooms} {listing.bedrooms === 1 ? "bed" : "beds"}
        </p>
        <Link
          href={`/listings/${listing.id}`}
          className="text-xs font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700"
        >
          View
        </Link>
      </div>
    </div>
  );
}

export default function ListingMapInner({
  listings,
  activeId,
  onPinClick,
}: ListingMapInnerProps) {
  return (
    <MapContainer
      center={LAGOS_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="size-full"
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      <FitBounds listings={listings} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[
            listing.location.geoPoint.lat,
            listing.location.geoPoint.lng,
          ]}
          icon={buildPinIcon(listing, listing.id === activeId)}
          eventHandlers={{
            click: () => onPinClick?.(listing.id),
          }}
        >
          <Popup>
            <ListingPopupCard listing={listing} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
