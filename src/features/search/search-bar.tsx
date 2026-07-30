"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  cityBySlug,
  NIGERIA_LOCATIONS,
  stateBySlug,
} from "@/constants/locations";
import { buildSearchUrl, type SearchQuery } from "@/lib/search-params";

// Borderless treatment shared by every pill segment's control so it reads as
// plain text sitting inside the pill rather than a nested dropdown box.
const SEGMENT_TRIGGER_CLASS =
  "h-auto w-full justify-start gap-1 border-0 bg-transparent p-0 text-sm font-medium normal-case tracking-normal text-ink shadow-none disabled:opacity-40 [&_svg]:text-muted-ink";

function areasSummary(city: string, areas: string[]): string {
  if (areas.length > 0) {
    return `${areas.length} area${areas.length > 1 ? "s" : ""} selected`;
  }
  return city ? "Any area" : "Choose a city first";
}

interface SearchBarProps {
  query: SearchQuery;
}

export function SearchBar({ query }: SearchBarProps) {
  const router = useRouter();
  const [state, setState] = useState(query.state ?? "");
  const [city, setCity] = useState(query.city ?? "");
  const [areas, setAreas] = useState<string[]>(query.areas ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Location can change from outside this component too — the "Clear
  // location" button in the results toolbar, or browser back/forward — none
  // of which remount this component, so it has to re-sync from the URL.
  useEffect(() => {
    setState(query.state ?? "");
    setCity(query.city ?? "");
    setAreas(query.areas ?? []);
  }, [query.state, query.city, query.areas]);

  const desktopStateId = useId();
  const desktopCityId = useId();
  const desktopAreasId = useId();
  const mobileStateId = useId();
  const mobileCityId = useId();
  const mobileAreasId = useId();

  const cities = useMemo(() => stateBySlug(state)?.cities ?? [], [state]);
  const areaOptions = useMemo(
    () => cityBySlug(state, city)?.areas ?? [],
    [state, city],
  );

  const stateLabel = state ? (stateBySlug(state)?.label ?? state) : undefined;
  const cityLabel =
    state && city ? (cityBySlug(state, city)?.label ?? city) : undefined;
  const mobileSummary =
    cityLabel && stateLabel
      ? `${cityLabel}, ${stateLabel}`
      : (stateLabel ?? "Anywhere in Nigeria");

  function handleStateChange(nextState: string) {
    setState(nextState);
    setCity("");
    setAreas([]);
  }

  function handleCityChange(nextCity: string) {
    setCity(nextCity);
    setAreas([]);
  }

  function toggleArea(slug: string) {
    setAreas((prev) =>
      prev.includes(slug)
        ? prev.filter((selected) => selected !== slug)
        : [...prev, slug],
    );
  }

  function handleSubmit() {
    router.push(
      buildSearchUrl(
        {
          state: state || undefined,
          city: city || undefined,
          areas: areas.length > 0 ? areas : undefined,
          page: 1,
        },
        query,
      ),
    );
    setSheetOpen(false);
  }

  return (
    <div className="w-full">
      {/* Desktop / tablet: a single pill with borderless segments. */}
      <div className="mx-auto hidden w-full max-w-3xl items-center rounded-full border border-border bg-card p-2 shadow-md lg:flex">
        <div className="flex min-w-0 flex-1 items-center">
          <div className="min-w-0 flex-1 px-6">
            <Label htmlFor={desktopStateId}>Where</Label>
            <Select value={state} onValueChange={handleStateChange}>
              <SelectTrigger
                id={desktopStateId}
                className={SEGMENT_TRIGGER_CLASS}
              >
                <SelectValue placeholder="All of Nigeria" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIA_LOCATIONS.map((stateDef) => (
                  <SelectItem key={stateDef.slug} value={stateDef.slug}>
                    {stateDef.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div aria-hidden className="h-8 w-px shrink-0 bg-border" />

          <div className="min-w-0 flex-1 px-6">
            <Label htmlFor={desktopCityId}>City / LGA</Label>
            <Select
              value={city}
              onValueChange={handleCityChange}
              disabled={!state}
            >
              <SelectTrigger
                id={desktopCityId}
                className={SEGMENT_TRIGGER_CLASS}
              >
                <SelectValue
                  placeholder={state ? "Any city" : "Choose a state first"}
                />
              </SelectTrigger>
              <SelectContent>
                {cities.map((cityDef) => (
                  <SelectItem key={cityDef.slug} value={cityDef.slug}>
                    {cityDef.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div aria-hidden className="h-8 w-px shrink-0 bg-border" />

          <div className="min-w-0 flex-1 px-6">
            <Label htmlFor={desktopAreasId}>Areas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  id={desktopAreasId}
                  type="button"
                  disabled={!city}
                  className="flex w-full items-center truncate bg-transparent p-0 text-left text-sm font-medium text-ink disabled:opacity-40"
                >
                  <span className="truncate">{areasSummary(city, areas)}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                  {areaOptions.map((area) => {
                    const checkboxId = `${desktopAreasId}-${area.slug}`;
                    return (
                      <li
                        key={area.slug}
                        className="flex min-h-11 items-center gap-2.5 px-2"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={areas.includes(area.slug)}
                          onCheckedChange={() => toggleArea(area.slug)}
                        />
                        <Label
                          htmlFor={checkboxId}
                          className="w-full cursor-pointer py-2"
                        >
                          {area.label}
                        </Label>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          type="button"
          size="icon-lg"
          onClick={handleSubmit}
          aria-label="Search"
          className="size-12 shrink-0 rounded-full bg-primary-500 text-primary-foreground hover:bg-primary-500/90"
        >
          <MagnifyingGlassIcon weight="bold" className="size-5" />
        </Button>
      </div>

      {/* Mobile: a single tappable bar that opens a sheet with the same fields. */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={`Search location, currently ${mobileSummary}`}
            className="flex h-14 w-full items-center justify-between gap-3 rounded-full border border-border bg-card px-5 shadow-md lg:hidden"
          >
            <span className="truncate text-sm font-medium text-ink">
              {mobileSummary}
            </span>
            <MagnifyingGlassIcon
              aria-hidden
              weight="bold"
              className="size-5 shrink-0 text-muted-ink"
            />
          </button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="max-h-[85vh] gap-0 overflow-y-auto p-0"
        >
          <SheetHeader className="border-b border-border p-5">
            <SheetTitle className="normal-case tracking-normal">
              Where to?
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-5 py-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={mobileStateId}>State</Label>
              <Select value={state} onValueChange={handleStateChange}>
                <SelectTrigger id={mobileStateId} className="w-full">
                  <SelectValue placeholder="All of Nigeria" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIA_LOCATIONS.map((stateDef) => (
                    <SelectItem key={stateDef.slug} value={stateDef.slug}>
                      {stateDef.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={mobileCityId}>City / LGA</Label>
              <Select
                value={city}
                onValueChange={handleCityChange}
                disabled={!state}
              >
                <SelectTrigger id={mobileCityId} className="w-full">
                  <SelectValue
                    placeholder={state ? "Any city" : "Choose a state first"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((cityDef) => (
                    <SelectItem key={cityDef.slug} value={cityDef.slug}>
                      {cityDef.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={mobileAreasId}>Areas (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id={mobileAreasId}
                    type="button"
                    variant="outline"
                    disabled={!city}
                    className="h-11 w-full justify-start text-sm normal-case tracking-normal"
                  >
                    <span className="truncate">
                      {areasSummary(city, areas)}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-2"
                  align="start"
                >
                  <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                    {areaOptions.map((area) => {
                      const checkboxId = `${mobileAreasId}-${area.slug}`;
                      return (
                        <li
                          key={area.slug}
                          className="flex min-h-11 items-center gap-2.5 px-2"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={areas.includes(area.slug)}
                            onCheckedChange={() => toggleArea(area.slug)}
                          />
                          <Label
                            htmlFor={checkboxId}
                            className="w-full cursor-pointer py-2"
                          >
                            {area.label}
                          </Label>
                        </li>
                      );
                    })}
                  </ul>
                </PopoverContent>
              </Popover>
              {areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {areas.map((slug) => {
                    const label =
                      areaOptions.find((area) => area.slug === slug)?.label ??
                      slug;
                    return (
                      <Badge
                        key={slug}
                        variant="secondary"
                        className="border border-border bg-secondary-100 px-2 py-1 text-secondary-900 normal-case tracking-normal"
                      >
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="mt-0 border-t border-border p-5">
            <Button
              type="button"
              size="lg"
              onClick={handleSubmit}
              className="h-12 w-full text-base normal-case tracking-normal"
            >
              Search
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
