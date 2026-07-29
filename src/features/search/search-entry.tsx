"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  cityBySlug,
  NIGERIA_LOCATIONS,
  stateBySlug,
} from "@/constants/locations";
import { buildSearchUrl, type SearchQuery } from "@/lib/search-params";
import type { Intent } from "@/lib/types";

interface SearchEntryProps {
  query: SearchQuery;
}

export function SearchEntry({ query }: SearchEntryProps) {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent>(query.intent);
  const [state, setState] = useState(query.state ?? "");
  const [city, setCity] = useState(query.city ?? "");
  const [areas, setAreas] = useState<string[]>(query.areas ?? []);

  const stateFieldId = useId();
  const cityFieldId = useId();
  const areasFieldId = useId();

  const cities = useMemo(() => stateBySlug(state)?.cities ?? [], [state]);
  const areaOptions = useMemo(
    () => cityBySlug(state, city)?.areas ?? [],
    [state, city],
  );

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
    if (!state || !city) return;
    router.push(
      buildSearchUrl({
        intent,
        state,
        city,
        areas: areas.length > 0 ? areas : undefined,
        page: 1,
      }),
    );
  }

  const canSubmit = Boolean(state && city);
  const areasSummary =
    areas.length === 0
      ? city
        ? "Any area"
        : "Choose a city first"
      : `${areas.length} area${areas.length > 1 ? "s" : ""} selected`;

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16 md:py-24">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-ink md:text-4xl">
          Find a home you can trust
        </h1>
        <p className="mt-2 text-muted-ink">
          Verified listings across Nigeria — no agent runaround.
        </p>
      </div>

      <fieldset className="m-0 grid w-full grid-cols-2 gap-3 border-0 p-0">
        <legend className="sr-only">Rent or buy</legend>
        <Button
          type="button"
          variant={intent === "rent" ? "default" : "outline"}
          aria-pressed={intent === "rent"}
          onClick={() => setIntent("rent")}
          className="h-14 text-base normal-case tracking-normal"
        >
          Rent a home
        </Button>
        <Button
          type="button"
          variant={intent === "buy" ? "default" : "outline"}
          aria-pressed={intent === "buy"}
          onClick={() => setIntent("buy")}
          className="h-14 text-base normal-case tracking-normal"
        >
          Buy a home
        </Button>
      </fieldset>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={stateFieldId}>State</Label>
            <Select value={state} onValueChange={handleStateChange}>
              <SelectTrigger id={stateFieldId} className="w-full">
                <SelectValue placeholder="Select a state" />
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
            <Label htmlFor={cityFieldId}>City / LGA</Label>
            <Select
              value={city}
              onValueChange={handleCityChange}
              disabled={!state}
            >
              <SelectTrigger id={cityFieldId} className="w-full">
                <SelectValue
                  placeholder={
                    state ? "Select a city / LGA" : "Choose a state first"
                  }
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
            <Label htmlFor={areasFieldId}>Areas (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={areasFieldId}
                  type="button"
                  variant="outline"
                  disabled={!city}
                  className="h-11 w-full justify-start text-sm normal-case tracking-normal"
                >
                  <span className="truncate">{areasSummary}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-2"
                align="start"
              >
                <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                  {areaOptions.map((area) => {
                    const checkboxId = `${areasFieldId}-${area.slug}`;
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

          <div className="flex flex-col items-center gap-2 pt-2">
            <Button
              type="button"
              size="lg"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="h-12 w-full text-base normal-case tracking-normal"
            >
              Browse homes
            </Button>
            <p className="text-xs text-muted-ink">
              Browsing is open — no account needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
