import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsOutIcon,
  BathtubIcon,
  BedIcon,
  BuildingsIcon,
  HouseLineIcon,
  ToiletIcon,
} from "@phosphor-icons/react";
import { PROPERTY_TYPE_LABELS } from "@/constants/marketplace";
import type { Listing } from "@/lib/types";

interface Spec {
  key: string;
  icon: Icon;
  label: string;
}

const GROUND_FLOOR = 0;

function plural(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function specsFor(listing: Listing): Spec[] {
  const specs: Spec[] = [
    {
      key: "type",
      icon: HouseLineIcon,
      label: PROPERTY_TYPE_LABELS[listing.propertyType],
    },
  ];

  if (listing.bedrooms > 0) {
    specs.push({
      key: "bedrooms",
      icon: BedIcon,
      label: plural(listing.bedrooms, "bedroom"),
    });
  }
  if (listing.bathrooms > 0) {
    specs.push({
      key: "bathrooms",
      icon: BathtubIcon,
      label: plural(listing.bathrooms, "bathroom"),
    });
  }
  // Nigerian listings quote toilets separately from bathrooms (a WC without a
  // shower is still a selling point), so both are shown rather than merged.
  if (listing.toilets > 0) {
    specs.push({
      key: "toilets",
      icon: ToiletIcon,
      label: plural(listing.toilets, "toilet"),
    });
  }
  if (listing.sizeSqm !== undefined) {
    specs.push({
      key: "size",
      icon: ArrowsOutIcon,
      label: `${listing.sizeSqm} sqm`,
    });
  }
  if (listing.floor !== undefined) {
    specs.push({
      key: "floor",
      icon: BuildingsIcon,
      label:
        listing.floor === GROUND_FLOOR
          ? "Ground floor"
          : `Floor ${listing.floor}`,
    });
  }

  return specs;
}

interface SpecChipsProps {
  listing: Listing;
}

export function SpecChips({ listing }: SpecChipsProps) {
  return (
    <ul className="flex list-none flex-wrap gap-2 p-0">
      {specsFor(listing).map((spec) => (
        <li
          key={spec.key}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink"
        >
          <spec.icon
            weight="duotone"
            aria-hidden
            className="size-4 shrink-0 text-primary-600"
          />
          {spec.label}
        </li>
      ))}
    </ul>
  );
}
