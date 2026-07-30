"use client";

import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { AMENITY_OPTIONS, PROPERTY_TYPE_LABELS } from "@/constants/marketplace";
import { filterListings } from "@/lib/marketplace";
import { toListingFilters } from "@/lib/search-filters";
import { buildSearchUrl, type SearchQuery } from "@/lib/search-params";
import { useHectaStore } from "@/lib/store";
import type { Furnishing, LeaseType, ServicedLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const ANY = "any";
const ROOM_STEPS = [0, 1, 2, 3, 4, 5];

const FURNISHING_OPTIONS: Array<{ value: Furnishing; label: string }> = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
];

const SERVICED_OPTIONS: Array<{ value: ServicedLevel; label: string }> = [
  { value: "none", label: "Not serviced" },
  { value: "semi", label: "Semi-serviced" },
  { value: "full", label: "Fully serviced" },
];

const LEASE_OPTIONS: Array<{ value: LeaseType; label: string }> = [
  { value: "short_term", label: "Short term" },
  { value: "long_term", label: "Long term" },
];

interface FilterDraft {
  priceMin: string;
  priceMax: string;
  types: string[];
  beds: number;
  baths: number;
  furnishing: Furnishing | typeof ANY;
  serviced: ServicedLevel | typeof ANY;
  lease: LeaseType | typeof ANY;
  moveInDate: string;
  pets: boolean;
  amenities: string[];
  verifiedOnly: boolean;
}

const CLEARED_DRAFT: FilterDraft = {
  priceMin: "",
  priceMax: "",
  types: [],
  beds: 0,
  baths: 0,
  furnishing: ANY,
  serviced: ANY,
  lease: ANY,
  moveInDate: "",
  pets: false,
  amenities: [],
  // The trust layer is the product's differentiator, so "verified only" is
  // the resting state — clearing filters returns to it rather than off.
  verifiedOnly: true,
};

function draftFromQuery(query: SearchQuery): FilterDraft {
  return {
    priceMin: query.priceMin === undefined ? "" : String(query.priceMin),
    priceMax: query.priceMax === undefined ? "" : String(query.priceMax),
    types: query.types ?? [],
    beds: query.beds ?? 0,
    baths: query.baths ?? 0,
    furnishing: query.furnishing ?? ANY,
    serviced: query.serviced ?? ANY,
    lease: query.lease ?? ANY,
    moveInDate: query.moveInDate ?? "",
    pets: query.pets === true,
    amenities: query.amenities ?? [],
    verifiedOnly: query.verifiedOnly,
  };
}

function parseAmount(raw: string): number | undefined {
  const parsed = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

// Every key is written explicitly (including the `undefined`s) because
// `buildSearchUrl` merges over the current query — an omitted key would keep
// the old value instead of clearing it.
function draftToQuery(draft: FilterDraft): Partial<SearchQuery> {
  return {
    priceMin: parseAmount(draft.priceMin),
    priceMax: parseAmount(draft.priceMax),
    types: draft.types,
    beds: draft.beds > 0 ? draft.beds : undefined,
    baths: draft.baths > 0 ? draft.baths : undefined,
    furnishing: draft.furnishing === ANY ? undefined : draft.furnishing,
    serviced: draft.serviced === ANY ? undefined : draft.serviced,
    lease: draft.lease === ANY ? undefined : draft.lease,
    moveInDate: draft.moveInDate === "" ? undefined : draft.moveInDate,
    pets: draft.pets ? true : undefined,
    amenities: draft.amenities,
    verifiedOnly: draft.verifiedOnly,
    page: 1,
  };
}

function toggle(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 font-heading text-sm font-semibold text-ink">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function RoomStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      {ROOM_STEPS.map((step) => {
        const active = value === step;
        return (
          <Button
            key={step}
            type="button"
            variant="outline"
            aria-pressed={active}
            onClick={() => onChange(step)}
            className={cn(
              "h-11 min-w-14 rounded-full px-4 text-sm font-medium normal-case tracking-normal",
              active
                ? "border-primary-500 bg-primary-500 text-primary-foreground hover:bg-primary-600 hover:text-primary-foreground"
                : "border-border bg-card text-ink",
            )}
          >
            {step === 0 ? "Any" : `${step}+`}
          </Button>
        );
      })}
    </fieldset>
  );
}

interface FiltersSheetProps {
  query: SearchQuery;
  activeCount: number;
}

export function FiltersSheet({ query, activeCount }: FiltersSheetProps) {
  const router = useRouter();
  const listings = useHectaStore((state) => state.listings);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(() => draftFromQuery(query));

  const priceMinId = useId();
  const priceMaxId = useId();
  const moveInDateId = useId();
  const petsId = useId();
  const verifiedId = useId();
  const typePrefix = useId();
  const amenityPrefix = useId();

  const previewCount = useMemo(() => {
    const preview: SearchQuery = { ...query, ...draftToQuery(draft) };
    return filterListings(listings, toListingFilters(preview)).length;
  }, [listings, query, draft]);

  function handleOpenChange(next: boolean) {
    // Re-seed from the URL on every open so a sheet abandoned without Apply
    // never resurfaces stale draft values.
    if (next) setDraft(draftFromQuery(query));
    setOpen(next);
  }

  function handleApply() {
    router.push(buildSearchUrl(draftToQuery(draft), query));
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 gap-2 rounded-full border-border bg-card px-4 text-sm font-medium text-ink normal-case tracking-normal"
        >
          <SlidersHorizontalIcon />
          All filters
          {activeCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="normal-case tracking-normal">
            Filters
          </SheetTitle>
          <SheetDescription>
            Narrow these results down to the homes worth your time.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
          <FilterSection title="Price range (₦)">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={priceMinId}>Minimum</Label>
                <Input
                  id={priceMinId}
                  inputMode="numeric"
                  placeholder="No minimum"
                  value={draft.priceMin}
                  onChange={(event) =>
                    setDraft({ ...draft, priceMin: event.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={priceMaxId}>Maximum</Label>
                <Input
                  id={priceMaxId}
                  inputMode="numeric"
                  placeholder="No maximum"
                  value={draft.priceMax}
                  onChange={(event) =>
                    setDraft({ ...draft, priceMax: event.target.value })
                  }
                />
              </div>
            </div>
          </FilterSection>

          <Separator />

          <FilterSection title="Property type">
            <ul className="grid grid-cols-2 gap-x-4">
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => {
                const id = `${typePrefix}-${value}`;
                return (
                  <li
                    key={value}
                    className="flex min-h-11 items-center gap-2.5"
                  >
                    <Checkbox
                      id={id}
                      checked={draft.types.includes(value)}
                      onCheckedChange={() =>
                        setDraft({
                          ...draft,
                          types: toggle(draft.types, value),
                        })
                      }
                    />
                    <Label htmlFor={id} className="w-full cursor-pointer py-2">
                      {label}
                    </Label>
                  </li>
                );
              })}
            </ul>
          </FilterSection>

          <Separator />

          <FilterSection title="Bedrooms">
            <RoomStepper
              label="Minimum bedrooms"
              value={draft.beds}
              onChange={(beds) => setDraft({ ...draft, beds })}
            />
          </FilterSection>

          <FilterSection title="Bathrooms">
            <RoomStepper
              label="Minimum bathrooms"
              value={draft.baths}
              onChange={(baths) => setDraft({ ...draft, baths })}
            />
          </FilterSection>

          <Separator />

          <FilterSection title="Furnishing">
            <RadioGroup
              aria-label="Furnishing"
              value={draft.furnishing}
              onValueChange={(value) =>
                setDraft({
                  ...draft,
                  furnishing:
                    FURNISHING_OPTIONS.find((o) => o.value === value)?.value ??
                    ANY,
                })
              }
              className="gap-0"
            >
              <OptionRow value={ANY} label="Any" name="furnishing" />
              {FURNISHING_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  name="furnishing"
                />
              ))}
            </RadioGroup>
          </FilterSection>

          <Separator />

          <FilterSection title="Serviced">
            <RadioGroup
              aria-label="Serviced level"
              value={draft.serviced}
              onValueChange={(value) =>
                setDraft({
                  ...draft,
                  serviced:
                    SERVICED_OPTIONS.find((o) => o.value === value)?.value ??
                    ANY,
                })
              }
              className="gap-0"
            >
              <OptionRow value={ANY} label="Any" name="serviced" />
              {SERVICED_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  name="serviced"
                />
              ))}
            </RadioGroup>
          </FilterSection>

          <Separator />

          <FilterSection title="Lease type">
            <RadioGroup
              aria-label="Lease type"
              value={draft.lease}
              onValueChange={(value) =>
                setDraft({
                  ...draft,
                  lease:
                    LEASE_OPTIONS.find((o) => o.value === value)?.value ?? ANY,
                })
              }
              className="gap-0"
            >
              <OptionRow value={ANY} label="Any" name="lease" />
              {LEASE_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  name="lease"
                />
              ))}
            </RadioGroup>
          </FilterSection>

          <Separator />

          <FilterSection title="Move-in date">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={moveInDateId}>Available by</Label>
              <Input
                id={moveInDateId}
                type="date"
                value={draft.moveInDate}
                onChange={(event) =>
                  setDraft({ ...draft, moveInDate: event.target.value })
                }
              />
            </div>
          </FilterSection>

          <Separator />

          <div className="flex min-h-11 items-center justify-between gap-4">
            <Label
              htmlFor={petsId}
              className="flex-1 cursor-pointer text-sm font-medium tracking-normal normal-case"
            >
              Pets allowed only
            </Label>
            <Switch
              id={petsId}
              checked={draft.pets}
              onCheckedChange={(pets) => setDraft({ ...draft, pets })}
            />
          </div>

          <Separator />

          <FilterSection title="Amenities">
            <ul className="grid grid-cols-2 gap-x-4">
              {AMENITY_OPTIONS.map((amenity) => {
                const id = `${amenityPrefix}-${amenity}`;
                return (
                  <li
                    key={amenity}
                    className="flex min-h-11 items-center gap-2.5"
                  >
                    <Checkbox
                      id={id}
                      checked={draft.amenities.includes(amenity)}
                      onCheckedChange={() =>
                        setDraft({
                          ...draft,
                          amenities: toggle(draft.amenities, amenity),
                        })
                      }
                    />
                    <Label htmlFor={id} className="w-full cursor-pointer py-2">
                      {amenity}
                    </Label>
                  </li>
                );
              })}
            </ul>
          </FilterSection>

          <Separator />

          <div className="flex min-h-11 items-start justify-between gap-4">
            <div className="flex-1">
              <Label
                htmlFor={verifiedId}
                className="cursor-pointer text-sm font-medium tracking-normal normal-case"
              >
                Verified homes only
              </Label>
              <p className="mt-1 text-xs text-muted-ink">
                Only show homes whose ownership documents Hecta has checked.
              </p>
            </div>
            <Switch
              id={verifiedId}
              checked={draft.verifiedOnly}
              onCheckedChange={(verifiedOnly) =>
                setDraft({ ...draft, verifiedOnly })
              }
              className="mt-1.5"
            />
          </div>
        </div>

        <SheetFooter className="mt-0 flex-row items-center gap-3 border-t border-border p-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDraft(CLEARED_DRAFT)}
            className="h-11 rounded-full px-4 text-sm font-medium text-muted-ink normal-case tracking-normal"
          >
            Clear all
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="h-11 flex-1 rounded-full text-sm font-semibold normal-case tracking-normal"
          >
            Show {previewCount} {previewCount === 1 ? "home" : "homes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function OptionRow({
  value,
  label,
  name,
}: {
  value: string;
  label: string;
  name: string;
}) {
  const id = `${name}-${value}`;
  return (
    <div className="flex min-h-11 items-center gap-2.5">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="w-full cursor-pointer py-2">
        {label}
      </Label>
    </div>
  );
}
