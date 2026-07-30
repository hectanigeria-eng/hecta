"use client";

import {
  MapPinIcon,
  RowsIcon,
  SquaresFourIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cityBySlug, stateBySlug } from "@/constants/locations";
import { buildSearchUrl, type SearchQuery } from "@/lib/search-params";

const SORT_OPTIONS: Array<{ value: SearchQuery["sort"]; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "freshness", label: "Recently confirmed" },
];

const VIEW_OPTIONS: Array<{ value: SearchQuery["view"]; label: string }> = [
  { value: "grid", label: "Grid view" },
  { value: "list", label: "List view" },
];

function toSort(value: string): SearchQuery["sort"] {
  return (
    SORT_OPTIONS.find((option) => option.value === value)?.value ?? "newest"
  );
}

function toView(value: string): SearchQuery["view"] {
  return VIEW_OPTIONS.find((option) => option.value === value)?.value ?? "grid";
}

interface ResultsToolbarProps {
  query: SearchQuery;
  total: number;
  hydrated: boolean;
}

export function ResultsToolbar({
  query,
  total,
  hydrated,
}: ResultsToolbarProps) {
  const router = useRouter();
  const sortId = useId();
  const mapId = useId();

  const hasLocation = query.state !== undefined;
  const cityLabel =
    query.state !== undefined && query.city !== undefined
      ? (cityBySlug(query.state, query.city)?.label ?? query.city)
      : "";
  const stateLabel =
    query.state !== undefined
      ? (stateBySlug(query.state)?.label ?? query.state)
      : "";
  const place = [cityLabel, stateLabel].filter(Boolean).join(", ");
  const areaCount = query.areas?.length ?? 0;

  function apply(change: Partial<SearchQuery>) {
    router.push(buildSearchUrl(change, query));
  }

  function handleClearLocation() {
    // There's no gate to fall back to anymore — clearing location just drops
    // the results back to the nationwide set while intent and display
    // preferences survive in the URL. Editing location itself now happens in
    // the SearchBar pill above, not here.
    router.push(
      buildSearchUrl(
        { state: undefined, city: undefined, areas: undefined, page: 1 },
        query,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {hydrated ? (
          <h2 className="font-heading text-xl font-bold text-ink md:text-2xl">
            {total} {total === 1 ? "home" : "homes"}
            {query.intent === "rent" ? " to rent" : " for sale"}
          </h2>
        ) : (
          <Skeleton className="h-7 w-48 rounded-md md:h-8" aria-hidden />
        )}
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-ink">
          <MapPinIcon weight="fill" className="size-4 shrink-0" />
          {hasLocation ? (
            <>
              <span>{place}</span>
              {areaCount > 0 && (
                <span>
                  · {areaCount} {areaCount === 1 ? "area" : "areas"}
                </span>
              )}
              <Button
                type="button"
                variant="link"
                onClick={handleClearLocation}
                className="-mx-2 h-11 gap-1 px-2 text-sm font-medium text-primary-600 normal-case tracking-normal"
              >
                <XCircleIcon />
                Clear location
              </Button>
            </>
          ) : (
            <span>Homes across Nigeria</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={sortId} className="sr-only">
          Sort results
        </Label>
        <Select
          value={query.sort}
          onValueChange={(v) => apply({ sort: toSort(v), page: 1 })}
        >
          <SelectTrigger
            id={sortId}
            className="h-11 w-48 rounded-full border-border bg-card text-sm"
          >
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={query.view}
          onValueChange={(v) => apply({ view: toView(v) })}
        >
          <TabsList className="h-11 rounded-full border border-border bg-card p-0">
            <TabsTrigger
              value="grid"
              aria-label="Grid view"
              className="size-11 rounded-full px-0 data-active:bg-primary-500 data-active:text-primary-foreground"
            >
              <SquaresFourIcon className="size-4" />
            </TabsTrigger>
            <TabsTrigger
              value="list"
              aria-label="List view"
              className="size-11 rounded-full px-0 data-active:bg-primary-500 data-active:text-primary-foreground"
            >
              <RowsIcon className="size-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="hidden h-11 items-center gap-2.5 rounded-full border border-border bg-card px-4 lg:flex">
          <Label
            htmlFor={mapId}
            className="cursor-pointer text-sm font-medium tracking-normal normal-case"
          >
            Map
          </Label>
          <Switch
            id={mapId}
            checked={query.map}
            onCheckedChange={(map) => apply({ map })}
          />
        </div>
      </div>
    </div>
  );
}
