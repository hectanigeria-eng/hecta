"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  ImagesIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// The desktop mosaic is a fixed 4x2 grid: one hero spanning 2x2 plus four
// quarter tiles. Anything beyond the fifth photo is reachable only through
// the lightbox.
const GRID_TILE_COUNT = 5;

// The mosaic is capped at the page's max-w-6xl (72rem); the hero occupies
// half of it and each small tile a quarter.
const HERO_SIZES = "(min-width: 1152px) 576px, (min-width: 640px) 50vw, 92vw";
const TILE_SIZES = "(min-width: 1152px) 288px, 25vw";
const LIGHTBOX_SIZES = "(min-width: 1024px) 960px, 100vw";

interface GalleryProps {
  images: string[];
  title: string;
  /** Human-readable "Area, City" — folded into every image's alt text. */
  place: string;
}

export function Gallery({ images, title, place }: GalleryProps) {
  // `null` means closed. Keeping the index and the open state in one value
  // means the lightbox's contents only exist while it is open (Radix
  // unmounts the portal on close), so its images are never fetched for a
  // visitor who never opens it.
  const [openAt, setOpenAt] = useState<number | null>(null);

  // Listings are expected to carry at least four photos (enforced at
  // creation), but this component's safety shouldn't depend on that upstream
  // guarantee holding — an empty array would otherwise leave `hero`
  // undefined and crash `next/image`, which requires a `src`.
  if (images.length === 0) return null;

  const tiles = images.slice(0, GRID_TILE_COUNT);
  const [hero, ...rest] = tiles;
  const hiddenCount = images.length - tiles.length;

  function photoAlt(index: number): string {
    const subject = place ? `${title} in ${place}` : title;
    return `${subject} — photo ${index + 1} of ${images.length}`;
  }

  function step(delta: number) {
    setOpenAt((current) =>
      current === null
        ? current
        : (current + delta + images.length) % images.length,
    );
  }

  function handleLightboxKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  }

  const activeIndex = openAt ?? 0;

  return (
    <>
      {/* Mobile: one swipeable, snapping strip that bleeds to both edges. */}
      <ul className="-mx-4 flex list-none snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:hidden">
        {images.map((src, index) => (
          <li key={src} className="w-[86%] shrink-0 snap-center">
            <button
              type="button"
              onClick={() => setOpenAt(index)}
              aria-label={`Open photo ${index + 1} of ${images.length} full screen`}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper-2 outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Image
                src={src}
                alt={photoAlt(index)}
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="92vw"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: the 4x2 mosaic. */}
      <div className="hidden aspect-[2/1] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl sm:grid">
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          aria-label={`Open photo 1 of ${images.length} full screen`}
          className="group relative col-span-2 row-span-2 overflow-hidden bg-paper-2 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
        >
          <Image
            src={hero}
            alt={photoAlt(0)}
            fill
            priority
            sizes={HERO_SIZES}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>

        {rest.map((src, offset) => {
          const index = offset + 1;
          const isLastTile = offset === rest.length - 1;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setOpenAt(index)}
              aria-label={
                isLastTile
                  ? `See all ${images.length} photos`
                  : `Open photo ${index + 1} of ${images.length} full screen`
              }
              className="group relative overflow-hidden bg-paper-2 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
            >
              <Image
                src={src}
                alt={photoAlt(index)}
                fill
                loading="lazy"
                sizes={TILE_SIZES}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {isLastTile && (
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center gap-1.5 bg-deep/45 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-deep/60"
                >
                  <ImagesIcon weight="bold" className="size-4" />
                  {hiddenCount > 0
                    ? `+${hiddenCount} photos`
                    : `All ${images.length} photos`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog
        open={openAt !== null}
        onOpenChange={(next) => setOpenAt(next ? activeIndex : null)}
      >
        <DialogContent
          onKeyDown={handleLightboxKeyDown}
          className="max-w-[calc(100%-1rem)] gap-4 rounded-2xl bg-card p-4 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">{title} — photo gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Use the left and right arrow keys, or the previous and next buttons,
            to move between photos.
          </DialogDescription>

          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-paper-2">
            <Image
              src={images[activeIndex]}
              alt={photoAlt(activeIndex)}
              fill
              sizes={LIGHTBOX_SIZES}
              className="object-contain"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-card/90 text-ink backdrop-blur-sm hover:bg-card"
            >
              <CaretLeftIcon weight="bold" className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Next photo"
              onClick={() => step(1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-card/90 text-ink backdrop-blur-sm hover:bg-card"
            >
              <CaretRightIcon weight="bold" className="size-5" />
            </Button>
          </div>

          <p aria-live="polite" className="text-center text-sm text-muted-ink">
            Photo {activeIndex + 1} of {images.length}
          </p>

          <ul className="flex list-none justify-center gap-2 overflow-x-auto p-0">
            {images.map((src, index) => (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => setOpenAt(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === activeIndex}
                  className={cn(
                    "relative block h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-paper-2 outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    index === activeIndex
                      ? "ring-2 ring-primary-500"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
