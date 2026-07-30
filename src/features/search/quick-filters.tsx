"use client";

import { CaretDownIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { PROPERTY_TYPE_LABELS } from "@/constants/marketplace";
import { FiltersSheet } from "@/features/search/filters-sheet";
import { formatNaira } from "@/lib/format";
import { activeFilterCount, propertyTypeLabel } from "@/lib/search-filters";
import { buildSearchUrl, type SearchQuery } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const BED_STEPS = [0, 1, 2, 3, 4, 5];
const ANY_BEDS = "0";

function pillClass(active: boolean): string {
  return cn(
    "h-11 shrink-0 gap-1.5 rounded-full border px-4 text-sm font-medium normal-case tracking-normal",
    active
      ? "border-primary-500 bg-primary-500 text-primary-foreground hover:bg-primary-600 hover:text-primary-foreground aria-expanded:bg-primary-600 aria-expanded:text-primary-foreground"
      : "border-border bg-card text-ink hover:bg-paper-2",
  );
}

function priceLabel(query: SearchQuery): string {
  if (query.priceMin !== undefined && query.priceMax !== undefined) {
    return `${formatNaira(query.priceMin)} – ${formatNaira(query.priceMax)}`;
  }
  if (query.priceMin !== undefined) return `${formatNaira(query.priceMin)}+`;
  if (query.priceMax !== undefined)
    return `Up to ${formatNaira(query.priceMax)}`;
  return "Price";
}

function typeLabel(query: SearchQuery): string {
  const types = query.types ?? [];
  const [first] = types;
  if (first === undefined) return "Property type";
  const firstLabel = propertyTypeLabel(first);
  return types.length === 1 ? firstLabel : `${firstLabel} +${types.length - 1}`;
}

function parseAmount(raw: string): number | undefined {
  const parsed = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

interface QuickFiltersProps {
  query: SearchQuery;
}

export function QuickFilters({ query }: QuickFiltersProps) {
  const router = useRouter();
  const priceMinId = useId();
  const priceMaxId = useId();
  const verifiedId = useId();

  const [priceMin, setPriceMin] = useState(
    query.priceMin === undefined ? "" : String(query.priceMin),
  );
  const [priceMax, setPriceMax] = useState(
    query.priceMax === undefined ? "" : String(query.priceMax),
  );

  // Back/forward navigation rewrites the query without remounting this
  // component, so the two typed inputs have to re-sync from the URL.
  useEffect(() => {
    setPriceMin(query.priceMin === undefined ? "" : String(query.priceMin));
    setPriceMax(query.priceMax === undefined ? "" : String(query.priceMax));
  }, [query.priceMin, query.priceMax]);

  function apply(change: Partial<SearchQuery>) {
    router.push(buildSearchUrl({ ...change, page: 1 }, query));
  }

  const types = query.types ?? [];
  const beds = query.beds ?? 0;

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={pillClass(
              query.priceMin !== undefined || query.priceMax !== undefined,
            )}
          >
            {priceLabel(query)}
            <CaretDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={priceMinId}>Min (₦)</Label>
              <Input
                id={priceMinId}
                inputMode="numeric"
                placeholder="Any"
                value={priceMin}
                onChange={(event) => setPriceMin(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={priceMaxId}>Max (₦)</Label>
              <Input
                id={priceMaxId}
                inputMode="numeric"
                placeholder="Any"
                value={priceMax}
                onChange={(event) => setPriceMax(event.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full px-3 text-sm font-medium text-muted-ink normal-case tracking-normal"
              onClick={() => {
                setPriceMin("");
                setPriceMax("");
                apply({ priceMin: undefined, priceMax: undefined });
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-full text-sm font-semibold normal-case tracking-normal"
              onClick={() =>
                apply({
                  priceMin: parseAmount(priceMin),
                  priceMax: parseAmount(priceMax),
                })
              }
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={pillClass(types.length > 0)}
          >
            {typeLabel(query)}
            <CaretDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <ul className="flex max-h-72 flex-col overflow-y-auto">
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => {
              const id = `quick-type-${value}`;
              return (
                <li
                  key={value}
                  className="flex min-h-11 items-center gap-2.5 px-2"
                >
                  <Checkbox
                    id={id}
                    checked={types.includes(value)}
                    onCheckedChange={() =>
                      apply({
                        types: types.includes(value)
                          ? types.filter((entry) => entry !== value)
                          : [...types, value],
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
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={pillClass(beds > 0)}
          >
            {beds > 0 ? `${beds}+ beds` : "Bedrooms"}
            <CaretDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <RadioGroup
            aria-label="Minimum bedrooms"
            value={String(beds)}
            onValueChange={(value) =>
              apply({ beds: value === ANY_BEDS ? undefined : Number(value) })
            }
            className="gap-0"
          >
            {BED_STEPS.map((step) => {
              const id = `quick-beds-${step}`;
              return (
                <div
                  key={step}
                  className="flex min-h-11 items-center gap-2.5 px-2"
                >
                  <RadioGroupItem id={id} value={String(step)} />
                  <Label htmlFor={id} className="w-full cursor-pointer py-2">
                    {step === 0 ? "Any" : `${step}+ bedrooms`}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </PopoverContent>
      </Popover>

      <div
        className={cn(
          "flex h-11 shrink-0 items-center gap-2.5 rounded-full border px-4",
          query.verifiedOnly
            ? "border-primary-500 bg-primary-500 text-primary-foreground"
            : "border-border bg-card text-ink",
        )}
      >
        <ShieldCheckIcon weight="fill" className="size-4 shrink-0" />
        <Label
          htmlFor={verifiedId}
          className="cursor-pointer text-sm font-medium tracking-normal whitespace-nowrap normal-case"
        >
          Verified only
        </Label>
        <Switch
          id={verifiedId}
          checked={query.verifiedOnly}
          onCheckedChange={(verifiedOnly) => apply({ verifiedOnly })}
          className="data-unchecked:border-border data-unchecked:bg-paper-3"
        />
      </div>

      <FiltersSheet query={query} activeCount={activeFilterCount(query)} />
    </div>
  );
}
