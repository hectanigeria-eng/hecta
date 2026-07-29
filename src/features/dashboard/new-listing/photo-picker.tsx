"use client";

import { CheckIcon } from "@phosphor-icons/react";
import Image from "next/image";
import type { Ref } from "react";
import { MIN_LISTING_IMAGES } from "@/constants/marketplace";
import { LISTING_PHOTO_POOL } from "@/lib/mock/images";
import { cn } from "@/lib/utils";
import { MAX_LISTING_IMAGES } from "./steps";

// One flat, de-duplicated gallery built once at module load — the pool ships
// as themed sets of five, but the landlord just wants to see every photo.
const PHOTO_POOL: readonly string[] = Array.from(
  new Set(LISTING_PHOTO_POOL.flat()),
);

const PHOTO_SIZES = "(min-width: 768px) 12rem, 33vw";

interface PhotoPickerProps {
  /** Selected URLs, in the order the landlord tapped them. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Id of the error paragraph, wired up as `aria-describedby`. */
  describedById: string;
  invalid: boolean;
  /** RHF focus target so a failed submit lands on the grid. */
  firstTileRef?: Ref<HTMLButtonElement>;
}

/**
 * Stand-in for a real uploader: the landlord picks from a fixed pool instead
 * of uploading files. Selection order is display order — the first photo
 * tapped becomes the cover — and the counter keeps the minimum visible so the
 * requirement never arrives as a surprise at the end of the step.
 */
export function PhotoPicker({
  value,
  onChange,
  describedById,
  invalid,
  firstTileRef,
}: PhotoPickerProps) {
  const remaining = Math.max(0, MIN_LISTING_IMAGES - value.length);
  const atCapacity = value.length >= MAX_LISTING_IMAGES;

  function toggle(url: string) {
    if (value.includes(url)) {
      onChange(value.filter((selected) => selected !== url));
      return;
    }
    if (atCapacity) return;
    onChange([...value, url]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          aria-live="polite"
          className={cn(
            "text-sm font-semibold",
            remaining === 0 ? "text-primary-700" : "text-ink",
          )}
        >
          {value.length} of {MIN_LISTING_IMAGES} minimum
          {remaining === 0
            ? " — you are good to go"
            : ` — ${remaining} more to add`}
        </p>
        <p className="text-xs text-muted-ink">
          Tap to add. The first photo you pick becomes the cover.
        </p>
      </div>

      <ul
        className="grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-4 md:grid-cols-5"
        aria-describedby={describedById}
      >
        {PHOTO_POOL.map((url, index) => {
          const position = value.indexOf(url);
          const isSelected = position >= 0;
          return (
            <li key={url}>
              <button
                type="button"
                ref={index === 0 ? firstTileRef : undefined}
                onClick={() => toggle(url)}
                aria-pressed={isSelected}
                aria-invalid={invalid && !isSelected ? true : undefined}
                aria-label={
                  isSelected
                    ? `Photo ${index + 1}, selected as photo ${position + 1}. Tap to remove.`
                    : `Photo ${index + 1}. Tap to add to your listing.`
                }
                disabled={atCapacity && !isSelected}
                className={cn(
                  "relative block aspect-square min-h-11 w-full overflow-hidden rounded-xl bg-paper-2 ring-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
                  isSelected
                    ? "ring-2 ring-primary-500"
                    : "ring-border hover:ring-primary-300",
                )}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes={PHOTO_SIZES}
                  loading="lazy"
                  className={cn(
                    "object-cover transition-transform duration-300",
                    isSelected && "scale-105",
                  )}
                />
                {isSelected && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-primary-foreground shadow-sm"
                  >
                    {position + 1}
                  </span>
                )}
                {isSelected && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-end justify-end bg-primary-900/15 p-1.5"
                  >
                    <CheckIcon
                      weight="bold"
                      className="size-4 text-primary-foreground"
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {atCapacity && (
        <p className="text-xs text-muted-ink">
          That is the maximum of {MAX_LISTING_IMAGES} photos. Remove one to swap
          it out.
        </p>
      )}
    </div>
  );
}
